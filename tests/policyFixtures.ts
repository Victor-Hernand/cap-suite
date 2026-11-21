import type { PolicyContentInput } from '../src/lib/policies';

export function draftInput(overrides: Partial<PolicyContentInput> = {}): PolicyContentInput {
  return {
    title: 'Reuniones virtuales',
    department: 'Gerencia Administrativa',
    type: 'policy',
    classification: 'internal',
    status: 'draft',
    summary: null,
    objective: null,
    scope: null,
    indicators: null,
    relatedDocuments: null,
    owner: null,
    approver: null,
    nextReviewDate: null,
    officialFilePath: null,
    guidelines: [],
    attachments: [],
    versions: [],
    ...overrides,
  };
}
