import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '../../../../lib/cloudflare-env';
import { ensureCitySubmissionSchema, type CitySubmissionRow } from '../../../../lib/city-submissions';

function tokenMatches(received: string, expected: string): boolean {
  if (!received || !expected || received.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) {
    difference |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  }
  return difference === 0;
}

export const GET: APIRoute = async ({ request, url }) => {
  const env = getCloudflareEnv();
  const expected = env.CITY_PIPELINE_SHARED_SECRET || '';
  const received = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tokenMatches(received, expected)) return new Response('Unauthorized', { status: 401 });
  if (!env.DB || !env.EVIDENCE_BUCKET) return new Response('Submission storage is unavailable.', { status: 503 });

  const submissionId = String(url.searchParams.get('submission_id') || '');
  if (!submissionId) return new Response('Missing submission_id.', { status: 400 });
  await ensureCitySubmissionSchema(env.DB);
  const submission = await env.DB.prepare('SELECT * FROM city_submissions WHERE id = ?').bind(submissionId).first<CitySubmissionRow>();
  if (!submission) return new Response('Submission not found.', { status: 404 });
  if (!['DISPATCHED', 'PROCESSING'].includes(submission.status)) return new Response('Submission is not approved for pipeline export.', { status: 409 });

  const object = await env.EVIDENCE_BUCKET.get(submission.object_key);
  if (!object?.body) return new Response('Submission object is missing.', { status: 404 });

  await env.DB.prepare("UPDATE city_submissions SET status = 'PROCESSING', updated_at = ? WHERE id = ?")
    .bind(new Date().toISOString(), submissionId)
    .run();

  return new Response(object.body, {
    headers: {
      'content-type': 'application/zip',
      'content-disposition': `attachment; filename="${submission.original_filename.replaceAll('"', '')}"`,
      'x-courtscope-city-slug': submission.city_slug,
      'x-courtscope-sha256': submission.sha256,
      'cache-control': 'no-store',
    },
  });
};
