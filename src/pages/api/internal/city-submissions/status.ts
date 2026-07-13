import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '../../../../lib/cloudflare-env';
import { ensureCitySubmissionSchema } from '../../../../lib/city-submissions';

function tokenMatches(received: string, expected: string): boolean {
  if (!received || !expected || received.length !== expected.length) return false;
  let difference = 0;
  for (let index = 0; index < expected.length; index += 1) difference |= received.charCodeAt(index) ^ expected.charCodeAt(index);
  return difference === 0;
}

export const POST: APIRoute = async ({ request }) => {
  const env = getCloudflareEnv();
  const expected = env.CITY_PIPELINE_SHARED_SECRET || '';
  const received = (request.headers.get('authorization') || '').replace(/^Bearer\s+/i, '');
  if (!tokenMatches(received, expected)) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  if (!env.DB) return Response.json({ error: 'D1 is unavailable.' }, { status: 503 });

  const body = await request.json().catch(() => ({})) as { submission_id?: string; status?: string; note?: string };
  const submissionId = String(body.submission_id || '');
  const status = String(body.status || '');
  if (!submissionId || !['PUBLISHED', 'REJECTED', 'FAILED', 'PROCESSING'].includes(status)) {
    return Response.json({ error: 'Invalid status callback.' }, { status: 400 });
  }

  await ensureCitySubmissionSchema(env.DB);
  const current = await env.DB.prepare('SELECT object_key, original_filename FROM city_submissions WHERE id = ?')
    .bind(submissionId).first<{ object_key: string; original_filename: string }>();
  if (!current) return Response.json({ error: 'Submission not found.' }, { status: 404 });
  let objectKey = current.object_key;
  if (env.EVIDENCE_BUCKET && (status === 'PUBLISHED' || status === 'REJECTED')) {
    const object = await env.EVIDENCE_BUCKET.get(current.object_key);
    if (object?.body) {
      const lane = status === 'PUBLISHED' ? 'processed' : 'rejected';
      const nextKey = `city-submissions/${lane}/${submissionId}/${current.original_filename}`;
      await env.EVIDENCE_BUCKET.put(nextKey, object.body, {
        httpMetadata: object.httpMetadata,
        customMetadata: { ...(object.customMetadata || {}), status },
      });
      await env.EVIDENCE_BUCKET.delete(current.object_key);
      objectKey = nextKey;
    }
  }
  const retentionDeleteAt = (status === 'PUBLISHED' || status === 'REJECTED')
    ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString()
    : null;
  await env.DB.prepare('UPDATE city_submissions SET status = ?, object_key = ?, review_note = ?, retention_delete_at = ?, updated_at = ? WHERE id = ?')
    .bind(status, objectKey, String(body.note || '').slice(0, 1000) || null, retentionDeleteAt, new Date().toISOString(), submissionId)
    .run();
  return Response.json({ updated: true, submission_id: submissionId, status });
};
