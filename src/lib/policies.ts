import {
  visiblePolicyStatusIds,
  type AttachmentKind,
  type PolicyClassification,
  type PolicyStatus,
  type PolicyType,
} from '../data/policies';
import { uniqueSlug, type Db } from './db';

export interface PolicyGuideline { title: string; body: string }
export interface PolicyAttachment { kind: AttachmentKind; label: string; url: string | null; filePath: string | null }
export interface PolicyVersion { version: string; date: string; author: string; reason: string }

export interface PolicyContentInput {
  title: string;
  department: string;
  type: PolicyType;
  classification: PolicyClassification;
  status: PolicyStatus;
  summary: string | null;
  objective: string | null;
  scope: string | null;
  indicators: string | null;
  relatedDocuments: string | null;
  owner: string | null;
  approver: string | null;
  nextReviewDate: string | null;
  officialFilePath: string | null;
  guidelines: PolicyGuideline[];
  attachments: PolicyAttachment[];
  versions: PolicyVersion[];
}

export interface PolicySummary {
  id: number;
  slug: string;
  title: string;
  department: string;
  type: PolicyType;
  classification: PolicyClassification;
  status: PolicyStatus;
  version: string | null;
  effectiveDate: string | null;
}

export interface PolicyRow extends Omit<PolicyContentInput, 'guidelines' | 'attachments' | 'versions'> {
  id: number;
  slug: string;
  version: string | null;
  effectiveDate: string | null;
}

export interface PolicyDetail extends PolicyRow {
  guidelines: PolicyGuideline[];
  attachments: PolicyAttachment[];
  versions: PolicyVersion[];
}

export interface PublishInput { version: string; effectiveDate: string; author: string; reason: string }

export class PolicyRuleError extends Error {}

const POLICY_SELECT = `SELECT id, slug, title, department, type, classification, status, summary, objective,
  scope, indicators, related_documents AS relatedDocuments, owner, approver, version,
  effective_date AS effectiveDate, next_review_date AS nextReviewDate,
  official_file_path AS officialFilePath FROM policies`;

const VISIBLE_STATUS_CONDITION = `status IN (${visiblePolicyStatusIds.map((id) => `'${id}'`).join(', ')})`;

const SUMMARY_SELECT = `SELECT id, slug, title, department, type, classification, status, version,
  effective_date AS effectiveDate FROM policies`;

export function listPolicies(db: Db): PolicySummary[] {
  return db.prepare(`${SUMMARY_SELECT} ORDER BY title, id`).all() as PolicySummary[];
}

export function listVisiblePolicies(db: Db, department?: string): PolicySummary[] {
  const departmentCondition = department === undefined ? '' : 'AND department = ?';
  const parameters = department === undefined ? [] : [department];
  return db
    .prepare(`${SUMMARY_SELECT} WHERE ${VISIBLE_STATUS_CONDITION} ${departmentCondition} ORDER BY title, id`)
    .all(...parameters) as PolicySummary[];
}

export function getPolicy(db: Db, id: number): PolicyDetail | null {
  const row = db.prepare(`${POLICY_SELECT} WHERE id = ?`).get(id) as PolicyRow | undefined;
  return row ? withChildren(db, row) : null;
}

export function getVisiblePolicyBySlug(db: Db, slug: string): PolicyDetail | null {
  const row = db.prepare(`${POLICY_SELECT} WHERE slug = ? AND ${VISIBLE_STATUS_CONDITION}`).get(slug) as PolicyRow | undefined;
  return row ? withChildren(db, row) : null;
}

function withChildren(db: Db, row: PolicyRow): PolicyDetail {
  return {
    ...row,
    guidelines: db.prepare('SELECT title, body FROM policy_guidelines WHERE policy_id = ? ORDER BY sort_order, id')
      .all(row.id) as PolicyGuideline[],
    attachments: db.prepare(`SELECT kind, label, url, file_path AS filePath FROM policy_attachments
      WHERE policy_id = ? ORDER BY sort_order, id`).all(row.id) as PolicyAttachment[],
    versions: db.prepare('SELECT version, date, author, reason FROM policy_versions WHERE policy_id = ? ORDER BY date DESC, version DESC')
      .all(row.id) as PolicyVersion[],
  };
}

/** Columnas que comparten el alta y la edición; el estado lo fija cada una. */
function contentColumns(input: PolicyContentInput) {
  return {
    title: input.title,
    department: input.department,
    type: input.type,
    classification: input.classification,
    summary: input.summary,
    objective: input.objective,
    scope: input.scope,
    indicators: input.indicators,
    relatedDocuments: input.relatedDocuments,
    owner: input.owner,
    approver: input.approver,
    nextReviewDate: input.nextReviewDate,
    officialFilePath: input.officialFilePath,
  };
}

function replaceChildren(db: Db, policyId: number, input: PolicyContentInput): void {
  db.prepare('DELETE FROM policy_guidelines WHERE policy_id = ?').run(policyId);
  db.prepare('DELETE FROM policy_attachments WHERE policy_id = ?').run(policyId);
  db.prepare('DELETE FROM policy_versions WHERE policy_id = ?').run(policyId);
  const insertGuideline = db.prepare(`INSERT INTO policy_guidelines (policy_id, title, body, sort_order)
    VALUES (@policyId, @title, @body, @sortOrder)`);
  input.guidelines.forEach((guideline, sortOrder) => insertGuideline.run({ ...guideline, policyId, sortOrder }));
  const insertAttachment = db.prepare(`INSERT INTO policy_attachments (policy_id, kind, label, url, file_path, sort_order)
    VALUES (@policyId, @kind, @label, @url, @filePath, @sortOrder)`);
  input.attachments.forEach((attachment, sortOrder) => insertAttachment.run({ ...attachment, policyId, sortOrder }));
  const insertVersion = prepareVersionInsert(db);
  input.versions.forEach((entry) => insertVersion.run({ ...entry, policyId }));
}

function prepareVersionInsert(db: Db) {
  return db.prepare(`INSERT INTO policy_versions (policy_id, version, date, author, reason)
    VALUES (@policyId, @version, @date, @author, @reason)`);
}

export function createPolicy(db: Db, input: PolicyContentInput): PolicyDetail {
  const create = db.transaction(() => {
    const result = db
      .prepare(`INSERT INTO policies (slug, title, department, type, classification, status, summary, objective,
        scope, indicators, related_documents, owner, approver, next_review_date, official_file_path)
        VALUES (@slug, @title, @department, @type, @classification, 'draft', @summary, @objective,
        @scope, @indicators, @relatedDocuments, @owner, @approver, @nextReviewDate, @officialFilePath)`)
      .run({ ...contentColumns(input), slug: uniqueSlug(db, 'policies', input.title, 'politica') });
    const policyId = Number(result.lastInsertRowid);
    replaceChildren(db, policyId, input);
    return policyId;
  });
  return getPolicy(db, create())!;
}

export function updatePolicy(db: Db, id: number, input: PolicyContentInput): PolicyDetail | null {
  const current = getPolicy(db, id);
  if (!current) return null;
  if (current.status === 'draft' && input.status !== 'draft') {
    throw new PolicyRuleError('Usa «Publicar versión» para publicar un borrador.');
  }
  db.transaction(() => {
    db.prepare(`UPDATE policies SET title = @title, department = @department, type = @type,
      classification = @classification, status = @status, summary = @summary, objective = @objective,
      scope = @scope, indicators = @indicators, related_documents = @relatedDocuments, owner = @owner,
      approver = @approver, next_review_date = @nextReviewDate, official_file_path = @officialFilePath,
      updated_at = datetime('now') WHERE id = @id`).run({ ...contentColumns(input), status: input.status, id });
    replaceChildren(db, id, input);
  })();
  return getPolicy(db, id);
}

export function publishPolicyVersion(db: Db, id: number, input: PublishInput): PolicyDetail | null {
  const current = getPolicy(db, id);
  if (!current) return null;
  if (!current.officialFilePath) throw new PolicyRuleError('Sube el documento oficial antes de publicar.');
  db.transaction(() => {
    db.prepare(`UPDATE policies SET version = @version, effective_date = @effectiveDate, status = 'active',
      updated_at = datetime('now') WHERE id = @id`).run({ version: input.version, effectiveDate: input.effectiveDate, id });
    db.prepare('DELETE FROM policy_versions WHERE policy_id = ? AND version = ?').run(id, input.version);
    prepareVersionInsert(db).run({
      policyId: id,
      version: input.version,
      date: input.effectiveDate,
      author: input.author,
      reason: input.reason,
    });
  })();
  return getPolicy(db, id);
}

export function deletePolicy(db: Db, id: number): PolicyDetail | null {
  const policy = getPolicy(db, id);
  if (policy) db.prepare('DELETE FROM policies WHERE id = ?').run(id);
  return policy;
}

export function policyFilePaths(policy: PolicyDetail): string[] {
  const attachmentPaths = policy.attachments.flatMap((attachment) => (attachment.filePath ? [attachment.filePath] : []));
  return policy.officialFilePath ? [policy.officialFilePath, ...attachmentPaths] : attachmentPaths;
}

export function unknownAttachmentPaths(submittedPaths: string[], existing: PolicyDetail | null): string[] {
  const knownPaths = new Set(existing ? policyFilePaths(existing) : []);
  return submittedPaths.filter((path) => !knownPaths.has(path));
}

export function countVisiblePoliciesByDepartment(db: Db): Map<string, number> {
  const rows = db.prepare(`SELECT department, COUNT(*) AS total FROM policies
    WHERE ${VISIBLE_STATUS_CONDITION} GROUP BY department`).all() as { department: string; total: number }[];
  return new Map(rows.map((row) => [row.department, row.total]));
}
