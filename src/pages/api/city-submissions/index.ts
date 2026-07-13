import type { APIRoute } from 'astro';
import { getCloudflareEnv } from '../../../lib/cloudflare-env';
import {
  MAX_CITY_SUBMISSION_BYTES,
  cleanText,
  ensureCitySubmissionSchema,
  sha256Hex,
  slugifyCity,
  validDate,
  validEmail,
  validSourceUrl,
  validateCitySubmissionZip,
} from '../../../lib/city-submissions';
import { sameOrigin } from '../../../lib/admin/security';

function error(message: string, status = 400): Response {
  return Response.json({ error: message }, { status });
}

export const POST: APIRoute = async ({ request }) => {
  if (!sameOrigin(request)) return error('Cross-origin uploads are blocked.', 403);

  const env = getCloudflareEnv();
  if (!env.DB || !env.EVIDENCE_BUCKET || !env.CITY_PIPELINE_SHARED_SECRET) {
    return error('City submission storage or pipeline security is not configured in this deployment.', 503);
  }

  const contentLength = Number(request.headers.get('content-length') || 0);
  if (contentLength && contentLength > MAX_CITY_SUBMISSION_BYTES + 2 * 1024 * 1024) {
    return error('The upload is larger than the 50 MB submission limit.', 413);
  }

  let form: FormData;
  try {
    form = await request.formData();
  } catch {
    return error('The upload form could not be read.', 400);
  }

  if (cleanText(form.get('company_website'), 100)) {
    return Response.json({ message: 'Submission received.' }, { status: 202 });
  }

  const cityName = cleanText(form.get('city_name'), 100);
  const county = cleanText(form.get('county'), 100);
  const state = cleanText(form.get('state'), 100);
  const country = cleanText(form.get('country'), 100) || 'United States';
  const contactName = cleanText(form.get('contact_name'), 120);
  const contactEmail = cleanText(form.get('contact_email'), 254).toLowerCase();
  const organization = cleanText(form.get('organization'), 160);
  const submitterRole = cleanText(form.get('submitter_role'), 120);
  const sourceAgency = cleanText(form.get('source_agency'), 180);
  const sourceUrl = cleanText(form.get('source_url'), 500);
  const coverageStart = cleanText(form.get('coverage_start'), 10);
  const coverageEnd = cleanText(form.get('coverage_end'), 10);
  const citySlug = slugifyCity(cityName);

  const requiredText = { cityName, county, state, contactName, contactEmail, sourceAgency, coverageStart, coverageEnd };
  const missing = Object.entries(requiredText).filter(([, value]) => !value).map(([key]) => key);
  if (missing.length) return error(`Complete the required fields: ${missing.join(', ')}.`);
  if (!citySlug) return error('Enter a valid city name.');
  if (!validEmail(contactEmail)) return error('Enter a valid contact email address.');
  if (!validSourceUrl(sourceUrl)) return error('Enter a valid official source URL.');
  if (!validDate(coverageStart) || !validDate(coverageEnd) || coverageStart > coverageEnd) {
    return error('Enter a valid coverage start and end date.');
  }

  for (const field of ['authorized_source', 'complete_scope', 'deidentified', 'manifest_confirmed']) {
    if (form.get(field) !== 'on') return error('All submission attestations are required.');
  }

  const upload = form.get('data_bundle');
  if (!(upload instanceof File) || !upload.name) return error('Attach the complete city-data ZIP package.');
  if (!/\.zip$/i.test(upload.name)) return error('Upload one ZIP file containing the complete package.');
  if (upload.size <= 0) return error('The uploaded ZIP is empty.');
  if (upload.size > MAX_CITY_SUBMISSION_BYTES) return error('The ZIP is larger than the 50 MB submission limit.', 413);

  const bytes = await upload.arrayBuffer();
  let bundle;
  try {
    bundle = await validateCitySubmissionZip(bytes, { citySlug, cityName, county, state, sourceAgency, sourceUrl, coverageStart, coverageEnd });
  } catch (reason) {
    return error(reason instanceof Error ? reason.message : 'The ZIP package is invalid.');
  }

  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const digest = await sha256Hex(bytes);
  const safeFilename = upload.name.replace(/[^A-Za-z0-9._-]+/g, '-').slice(-180) || 'city-data.zip';
  const objectKey = `city-submissions/pending/${id}/${safeFilename}`;

  await ensureCitySubmissionSchema(env.DB);
  const ip = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
  const fingerprintBytes = new TextEncoder().encode(`${env.CITY_PIPELINE_SHARED_SECRET}:${ip}`);
  const requestFingerprint = await sha256Hex(fingerprintBytes.buffer as ArrayBuffer);
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();
  const recent = await env.DB.prepare('SELECT COUNT(*) AS count FROM city_submissions WHERE request_fingerprint = ? AND submitted_at >= ?')
    .bind(requestFingerprint, since).first<{ count: number }>();
  if (Number(recent?.count || 0) >= 3) return error('This connection has reached the daily city-submission limit.', 429);

  try {
    await env.EVIDENCE_BUCKET.put(objectKey, bytes, {
      httpMetadata: { contentType: 'application/zip' },
      customMetadata: {
        submissionId: id,
        citySlug,
        batchId: bundle.batchId,
        sha256: digest,
        status: 'RECEIVED',
      },
    });

    await env.DB.prepare(`
      INSERT INTO city_submissions (
        id, city_slug, city_name, county, state, country, contact_name, contact_email,
        organization, submitter_role, source_agency, source_url, coverage_start, coverage_end,
        submission_type, status, object_key, original_filename, size_bytes, sha256,
        manifest_json, request_fingerprint, submitted_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, citySlug, cityName, county, state, country, contactName, contactEmail,
      organization || null, submitterRole || null, sourceAgency, sourceUrl || null,
      coverageStart, coverageEnd, 'DEIDENTIFIED_REPO_READY', 'RECEIVED', objectKey,
      safeFilename, upload.size, digest, JSON.stringify(bundle.manifest), requestFingerprint, now, now,
    ).run();
  } catch (reason) {
    await env.EVIDENCE_BUCKET.delete(objectKey).catch(() => undefined);
    console.error('City submission storage failure', reason);
    return error('The package could not be stored. No submission was recorded.', 500);
  }

  return Response.json({
    message: 'Your complete package was received for private review. Receipt does not mean the city is accepted or published.',
    submission_id: id,
    city_slug: citySlug,
    batch_id: bundle.batchId,
    status: 'RECEIVED',
  }, { status: 201 });
};
