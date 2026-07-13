import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '../../../lib/cloudflare-env';
import { ensureCitySubmissionSchema, type CitySubmissionRow } from '../../../lib/city-submissions';

export const GET: APIRoute = async ({ url }) => {
  const env = getCloudflareEnv();
  if (!env.DB || !env.EVIDENCE_BUCKET) return new Response('Private submission storage is unavailable.', { status: 503 });
  const submissionId = String(url.searchParams.get('id') || '');
  if (!submissionId) return new Response('Missing submission ID.', { status: 400 });
  await ensureCitySubmissionSchema(env.DB);
  const submission = await env.DB.prepare('SELECT * FROM city_submissions WHERE id = ?').bind(submissionId).first<CitySubmissionRow>();
  if (!submission) return new Response('Submission not found.', { status: 404 });
  if (!submission.object_key) return new Response('The retained private object has been purged.', { status: 410 });
  const object = await env.EVIDENCE_BUCKET.get(submission.object_key);
  if (!object?.body) return new Response('Private object not found.', { status: 404 });
  return new Response(object.body, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${submission.original_filename.replaceAll('"', '')}"`,
      'cache-control': 'no-store, private',
      'x-content-type-options': 'nosniff',
    },
  });
};
