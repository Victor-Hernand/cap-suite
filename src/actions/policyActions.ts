import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import {
  PolicyRuleError,
  createPolicy,
  deletePolicy,
  getPolicy,
  policyFilePaths,
  publishPolicyVersion,
  unknownAttachmentPaths,
  updatePolicy,
  type PolicyAttachment,
  type PolicyContentInput,
  type PolicyDetail,
} from '../lib/policies';
import { getDb } from '../lib/db';
import { deleteUpload } from '../lib/uploads';
import { policyFormFields, policyPublishFields, type PolicyAttachmentForm } from './formSchemas';
import { badRequest, hasFile, idInput, notFound, replaceUpload } from './actionHelpers';

type PolicyForm = z.infer<z.ZodObject<typeof policyFormFields>> & { id?: number };

/** Archivos guardados durante un guardado, para borrarlos si el guardado falla. */
function trackedUploads() {
  const storedPaths: string[] = [];
  return {
    async store(file: File): Promise<string> {
      const filePath = await replaceUpload(file, 'policies');
      storedPaths.push(filePath);
      return filePath;
    },
    rollback(): void {
      storedPaths.forEach(deleteUpload);
    },
  };
}

type TrackedUploads = ReturnType<typeof trackedUploads>;

function blankToNull(text: string | undefined): string | null {
  return text?.trim() || null;
}

function policyNotFound() {
  return notFound('La política no existe.');
}

function translateRuleError(error: unknown): unknown {
  return error instanceof PolicyRuleError ? badRequest(error.message) : error;
}

function submittedFilePaths(attachments: PolicyAttachmentForm[]): string[] {
  return attachments.flatMap((attachment) =>
    attachment.kind === 'file' && attachment.filePath ? [attachment.filePath] : [],
  );
}

async function resolveAttachment(
  attachment: PolicyAttachmentForm,
  position: number,
  files: File[],
  uploads: TrackedUploads,
): Promise<PolicyAttachment> {
  const { kind, label } = attachment;
  if (kind !== 'file') return { kind, label, url: attachment.url!.trim(), filePath: null };
  if (attachment.fileIndex == null) return { kind, label, url: null, filePath: attachment.filePath! };
  const file = files[attachment.fileIndex];
  if (!hasFile(file)) throw badRequest(`Anexo ${position}: el archivo no llegó al servidor. Vuelve a seleccionarlo.`);
  return { kind, label, url: null, filePath: await uploads.store(file) };
}

async function resolveAttachments(form: PolicyForm, uploads: TrackedUploads): Promise<PolicyAttachment[]> {
  const files = form.attachmentFiles ?? [];
  const resolved: PolicyAttachment[] = [];
  for (const [index, attachment] of (form.attachments ?? []).entries()) {
    resolved.push(await resolveAttachment(attachment, index + 1, files, uploads));
  }
  return resolved;
}

async function resolvePolicyContent(
  form: PolicyForm,
  existing: PolicyDetail | null,
  uploads: TrackedUploads,
): Promise<PolicyContentInput> {
  const unknownPaths = unknownAttachmentPaths(submittedFilePaths(form.attachments ?? []), existing);
  if (unknownPaths.length > 0) throw badRequest('Un anexo apunta a un archivo que no pertenece a esta política.');
  const officialFilePath = hasFile(form.officialFile)
    ? await uploads.store(form.officialFile)
    : (existing?.officialFilePath ?? null);
  const attachments = await resolveAttachments(form, uploads);
  return {
    title: form.title,
    department: form.department,
    type: form.type,
    classification: form.classification,
    status: form.status,
    summary: blankToNull(form.summary),
    objective: blankToNull(form.objective),
    scope: blankToNull(form.scope),
    indicators: blankToNull(form.indicators),
    relatedDocuments: blankToNull(form.relatedDocuments),
    owner: blankToNull(form.owner),
    approver: blankToNull(form.approver),
    nextReviewDate: blankToNull(form.nextReviewDate),
    officialFilePath,
    guidelines: form.guidelines ?? [],
    attachments,
    versions: form.versions ?? [],
  };
}

function persistPolicy(content: PolicyContentInput, policyId: number | undefined): PolicyDetail {
  const db = getDb();
  if (!policyId) return createPolicy(db, content);
  const saved = updatePolicy(db, policyId, content);
  if (!saved) throw policyNotFound();
  return saved;
}

function deleteOrphanedFiles(before: PolicyDetail, after: PolicyDetail): void {
  const pathsStillUsed = new Set(policyFilePaths(after));
  try {
    policyFilePaths(before)
      .filter((path) => !pathsStillUsed.has(path))
      .forEach(deleteUpload);
  } catch {
    // La política ya quedó guardada: un archivo viejo que no se pudo borrar no debe convertir eso en error.
  }
}

async function savePolicy(form: PolicyForm): Promise<{ id: number }> {
  const existing = form.id ? getPolicy(getDb(), form.id) : null;
  const uploads = trackedUploads();
  let saved: PolicyDetail;
  try {
    const content = await resolvePolicyContent(form, existing, uploads);
    saved = persistPolicy(content, form.id);
  } catch (error) {
    uploads.rollback();
    throw translateRuleError(error);
  }
  if (existing) deleteOrphanedFiles(existing, saved);
  return { id: saved.id };
}

export const policies = {
  save: defineAction({
    accept: 'form',
    input: z.object({ ...policyFormFields, id: idInput.shape.id.optional() }),
    handler: savePolicy,
  }),
  publish: defineAction({
    accept: 'form',
    input: z.object(policyPublishFields),
    handler: ({ id, ...version }) => {
      try {
        const published = publishPolicyVersion(getDb(), id, version);
        if (!published) throw policyNotFound();
        return { id: published.id };
      } catch (error) {
        throw translateRuleError(error);
      }
    },
  }),
  remove: defineAction({
    input: idInput,
    handler: ({ id }) => {
      const deleted = deletePolicy(getDb(), id);
      if (deleted) policyFilePaths(deleted).forEach(deleteUpload);
      return { ok: true };
    },
  }),
};
