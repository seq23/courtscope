import type { APIRoute } from 'astro';
import health from '../../../../data/health/system_health.json';
import pipeline from '../../../../data/admin/city_pipeline_status.json';
import cleanup from '../../../../data/admin/cleanup_queue.json';
import registry from '../../../../data/cities/registry.json';

export const GET: APIRoute = () =>
  Response.json(
    {
      health,
      cityPipeline: pipeline,
      cleanupQueue: cleanup,
      cityRegistry: registry,
      adminAuth: 'SERVER_VERIFIED',
      mutations: 'GITHUB_WORKFLOW_DISPATCH_PROVIDER_GATED',
    },
    { headers: { 'cache-control': 'no-store' } },
  );
