import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '../../../lib/cloudflare-env';
import { ensureCitySubmissionSchema, type CitySubmissionRow } from '../../../lib/city-submissions';
import { sameOrigin } from '../../../lib/admin/security';
import { SUBMISSION_ACTIONS, isSubmissionActionId } from '../../../lib/admin/submission-actions';

interface SubmissionActionRequest {
  submission_id?: string;
  action?: string;
  note?: string;
  confirmed?: boolean;
}

async function moveObject(env: ReturnType<typeof getCloudflareEnv>, submission: CitySubmissionRow, lane: 'rejected' | 'processed') {
  if (!env.EVIDENCE_BUCKET) return submission.object_key;
  const object = await env.EVIDENCE_BUCKET.get(submission.object_key);
  if (!object?.body) return submission.object_key;
  const newKey = `city-submissions/${lane}/${submission.id}/${submission.original_filename}`;
  await env.EVIDENCE_BUCKET.put(newKey, object.body, {
    httpMetadata: object.httpMetadata,
    customMetadata: { ...(object.customMetadata || {}), status: lane.toUpperCase() },
  });
  await env.EVIDENCE_BUCKET.delete(submission.object_key);
  return newKey;
}

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return Response.json({ error: 'Cross-origin admin requests are blocked.' }, { status: 403 });
  const env = getCloudflareEnv();
  if (!env.DB) return Response.json({ error: 'D1 is not configured.' }, { status: 503 });

  const body = await request.json().catch(() => ({})) as SubmissionActionRequest;
  const submissionId = String(body.submission_id || '');
  const action = String(body.action || '');
  const note = String(body.note || '').trim().slice(0, 1000);
  if (!isSubmissionActionId(action)) {
    return Response.json({ error: 'Invalid submission action.' }, { status: 400 });
  }
  const definition = SUBMISSION_ACTIONS[action];
  if (definition.confirm && !body.confirmed) {
    return Response.json({ error: 'Confirmation is required.' }, { status: 409 });
  }

  await ensureCitySubmissionSchema(env.DB);
  const now = new Date().toISOString();
  if (action === 'purge_eligible') {
    if (!env.EVIDENCE_BUCKET) return Response.json({ error: 'Private R2 storage is not configured.' }, { status: 503 });
    const result = await env.DB.prepare("SELECT * FROM city_submissions WHERE retention_delete_at IS NOT NULL AND retention_delete_at <= ? AND status IN ('PUBLISHED','REJECTED') AND object_key <> ''")
      .bind(now).all<CitySubmissionRow>();
    for (const item of result.results || []) {
      await env.EVIDENCE_BUCKET.delete(item.object_key);
      await env.DB.prepare("UPDATE city_submissions SET status = 'PURGED', object_key = '', updated_at = ? WHERE id = ?")
        .bind(now, item.id).run();
    }
    return Response.json({ message: `${result.results?.length || 0} eligible private upload(s) purged.` });
  }
  if (!submissionId) return Response.json({ error: 'Submission ID is required.' }, { status: 400 });
  const submission = await env.DB.prepare('SELECT * FROM city_submissions WHERE id = ?').bind(submissionId).first<CitySubmissionRow>();
  if (!submission) return Response.json({ error: 'Submission not found.' }, { status: 404 });

  if (action === 'mark_under_review') {
    if (!['RECEIVED', 'UNDER_REVIEW'].includes(submission.status)) return Response.json({ error: 'This submission cannot return to review.' }, { status: 409 });
    await env.DB.prepare("UPDATE city_submissions SET status = 'UNDER_REVIEW', review_note = ?, updated_at = ? WHERE id = ?")
      .bind(note || null, now, submissionId).run();
    return Response.json({ message: 'Submission marked under review.' });
  }

  if (action === 'reject') {
    if (!['RECEIVED', 'UNDER_REVIEW', 'FAILED'].includes(submission.status)) return Response.json({ error: 'This submission cannot be rejected from its current state.' }, { status: 409 });
    const objectKey = await moveObject(env, submission, 'rejected');
    const retentionDeleteAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
    await env.DB.prepare("UPDATE city_submissions SET status = 'REJECTED', object_key = ?, review_note = ?, retention_delete_at = ?, updated_at = ? WHERE id = ?")
      .bind(objectKey, note || 'Rejected during admin review.', retentionDeleteAt, now, submissionId).run();
    return Response.json({ message: 'Submission rejected and moved to the private rejected lane.' });
  }

  if (!['RECEIVED', 'UNDER_REVIEW', 'FAILED'].includes(submission.status)) return Response.json({ error: 'This submission cannot be dispatched from its current state.' }, { status: 409 });
  if (!env.GITHUB_ADMIN_TOKEN || !env.GITHUB_REPOSITORY) {
    return Response.json({ error: 'The GitHub admin token is not configured in the CourtScope Worker.' }, { status: 503 });
  }
  if (!env.CITY_PIPELINE_SHARED_SECRET) {
    return Response.json({ error: 'The city pipeline shared secret is not configured in the CourtScope Worker.' }, { status: 503 });
  }

  const manifest = JSON.parse(submission.manifest_json) as Record<string, unknown>;
  const batchId = String(manifest.batch_id || '');
  if (!batchId) return Response.json({ error: 'The stored manifest does not contain a batch ID.' }, { status: 409 });
  const receiptId = crypto.randomUUID();
  const url = `https://api.github.com/repos/${env.GITHUB_REPOSITORY}/actions/workflows/city-submission-intake.yml/dispatches`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      authorization: `Bearer ${env.GITHUB_ADMIN_TOKEN}`,
      accept: 'application/vnd.github+json',
      'x-github-api-version': '2022-11-28',
      'user-agent': 'CourtScope-Admin',
    },
    body: JSON.stringify({
      ref: 'main',
      inputs: {
        submission_id: submission.id,
        city_slug: submission.city_slug,
        batch_id: batchId,
        receipt_id: receiptId,
      },
    }),
  });
  if (!response.ok) {
    return Response.json({ error: `GitHub rejected the submission dispatch (${response.status}). No processing was recorded.` }, { status: 502 });
  }

  await env.DB.prepare("UPDATE city_submissions SET status = 'DISPATCHED', workflow_receipt_id = ?, review_note = ?, updated_at = ? WHERE id = ?")
    .bind(receiptId, note || 'Approved for repository processing.', now, submissionId).run();
  return Response.json({
    message: 'Submission dispatched to the repository pipeline. Publication is not claimed until the workflow finishes.',
    receipt_id: receiptId,
  }, { status: 202 });
};
