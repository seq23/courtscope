export const SUBMISSION_ACTIONS = {
  mark_under_review: {
    confirm: false,
    allowedStatuses: ['RECEIVED', 'UNDER_REVIEW'],
    effect: 'D1 status only',
  },
  reject: {
    confirm: true,
    allowedStatuses: ['RECEIVED', 'UNDER_REVIEW', 'FAILED'],
    effect: 'Move private R2 object to rejected retention and update D1',
  },
  dispatch: {
    confirm: true,
    allowedStatuses: ['RECEIVED', 'UNDER_REVIEW', 'FAILED'],
    effect: 'Dispatch allowlisted GitHub workflow after owner approval',
  },
  purge_eligible: {
    confirm: true,
    allowedStatuses: ['PUBLISHED', 'REJECTED'],
    effect: 'Delete only private R2 objects whose retention date has passed',
  },
} as const;

export type SubmissionActionId = keyof typeof SUBMISSION_ACTIONS;
export function isSubmissionActionId(value: string): value is SubmissionActionId {
  return Object.hasOwn(SUBMISSION_ACTIONS, value);
}
