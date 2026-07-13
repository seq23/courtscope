export const ACTIONS = {
  process_city_data: {
    confirm: true,
    workflow: 'city-data-pipeline.yml',
    paths: ['data/intake/**', 'data/cities/**', 'public/downloads/**', 'data/admin/**'],
  },
  refresh_city_status: {
    confirm: false,
    workflow: 'city-data-pipeline.yml',
    paths: ['data/admin/**'],
  },
  refresh_cleanup_queue: {
    confirm: false,
    workflow: 'city-data-cleanup.yml',
    paths: ['data/admin/**'],
  },
  cleanup_processed_data: {
    confirm: true,
    workflow: 'city-data-cleanup.yml',
    paths: ['data/intake/processed/**', 'data/admin/**'],
  },
  pause_automation: {
    confirm: true,
    workflow: 'admin-control.yml',
    paths: ['data/admin/**'],
  },
  resume_automation: {
    confirm: true,
    workflow: 'admin-control.yml',
    paths: ['data/admin/**'],
  },
  emergency_stop: {
    confirm: true,
    workflow: 'admin-control.yml',
    paths: ['data/admin/**'],
  },
} as const;

export type ActionId = keyof typeof ACTIONS;
export function isActionId(value: string): value is ActionId {
  return Object.hasOwn(ACTIONS, value);
}
