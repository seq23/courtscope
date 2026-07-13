import JSZip from 'jszip';

export const MAX_CITY_SUBMISSION_BYTES = 50 * 1024 * 1024;
export const CITY_SUBMISSION_STATUSES = [
  'RECEIVED',
  'UNDER_REVIEW',
  'DISPATCHED',
  'PROCESSING',
  'PUBLISHED',
  'REJECTED',
  'FAILED',
  'PURGED',
] as const;

export type CitySubmissionStatus = (typeof CITY_SUBMISSION_STATUSES)[number];

export interface CitySubmissionRow {
  id: string;
  city_slug: string;
  city_name: string;
  county: string;
  state: string;
  country: string;
  contact_name: string;
  contact_email: string;
  organization: string | null;
  submitter_role: string | null;
  source_agency: string;
  source_url: string | null;
  coverage_start: string;
  coverage_end: string;
  submission_type: string;
  status: CitySubmissionStatus;
  object_key: string;
  original_filename: string;
  size_bytes: number;
  sha256: string;
  manifest_json: string;
  review_note: string | null;
  workflow_receipt_id: string | null;
  request_fingerprint: string | null;
  retention_delete_at: string | null;
  submitted_at: string;
  updated_at: string;
}

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS city_submissions (
  id TEXT PRIMARY KEY,
  city_slug TEXT NOT NULL,
  city_name TEXT NOT NULL,
  county TEXT NOT NULL,
  state TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'United States',
  contact_name TEXT NOT NULL,
  contact_email TEXT NOT NULL,
  organization TEXT,
  submitter_role TEXT,
  source_agency TEXT NOT NULL,
  source_url TEXT,
  coverage_start TEXT NOT NULL,
  coverage_end TEXT NOT NULL,
  submission_type TEXT NOT NULL DEFAULT 'DEIDENTIFIED_REPO_READY',
  status TEXT NOT NULL DEFAULT 'RECEIVED',
  object_key TEXT NOT NULL UNIQUE,
  original_filename TEXT NOT NULL,
  size_bytes INTEGER NOT NULL,
  sha256 TEXT NOT NULL,
  manifest_json TEXT NOT NULL,
  review_note TEXT,
  workflow_receipt_id TEXT,
  request_fingerprint TEXT,
  retention_delete_at TEXT,
  submitted_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
CREATE INDEX IF NOT EXISTS idx_city_submissions_status ON city_submissions(status, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_submissions_city ON city_submissions(city_slug, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_submissions_rate ON city_submissions(request_fingerprint, submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_city_submissions_retention ON city_submissions(retention_delete_at, status);
`;

export async function ensureCitySubmissionSchema(db: D1Database): Promise<void> {
  for (const statement of SCHEMA_SQL.split(';').map((value) => value.trim()).filter(Boolean)) {
    await db.prepare(statement).run();
  }
  for (const statement of [
    'ALTER TABLE city_submissions ADD COLUMN request_fingerprint TEXT',
    'ALTER TABLE city_submissions ADD COLUMN retention_delete_at TEXT',
  ]) {
    try { await db.prepare(statement).run(); } catch (error) {
      if (!String(error).toLowerCase().includes('duplicate column')) throw error;
    }
  }
}

export function slugifyCity(value: string): string {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export function cleanText(value: FormDataEntryValue | null, max = 240): string {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, max);
}

export function validDate(value: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(value) && !Number.isNaN(Date.parse(`${value}T00:00:00Z`));
}

export function validEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) && value.length <= 254;
}

export function validSourceUrl(value: string): boolean {
  if (!value) return true;
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return [...new Uint8Array(digest)].map((byte) => byte.toString(16).padStart(2, '0')).join('');
}

export interface ValidatedBundle {
  manifest: Record<string, unknown>;
  citySlug: string;
  batchId: string;
  rootPrefix: string;
}

function normalizedEntryName(name: string): string {
  return name.replaceAll('\\', '/').replace(/^\.\//, '');
}

function safeArchiveEntry(name: string): boolean {
  const normalized = normalizedEntryName(name);
  if (!normalized || normalized.startsWith('/') || /^[A-Za-z]:\//.test(normalized)) return false;
  return !normalized.split('/').some((part) => part === '..');
}

function archiveRootPrefix(names: string[]): string {
  const files = names.filter((name) => !name.endsWith('/'));
  if (!files.length) return '';
  const firstParts = files.map((name) => normalizedEntryName(name).split('/')[0]);
  return firstParts.every((part) => part === firstParts[0]) && files.every((name) => normalizedEntryName(name).includes('/'))
    ? `${firstParts[0]}/`
    : '';
}

export async function validateCitySubmissionZip(
  bytes: ArrayBuffer,
  expected: { citySlug: string; cityName: string; county: string; state: string; sourceAgency: string; sourceUrl: string; coverageStart: string; coverageEnd: string },
): Promise<ValidatedBundle> {
  const zip = await JSZip.loadAsync(bytes, { checkCRC32: true, createFolders: true });
  const names = Object.keys(zip.files).map(normalizedEntryName);
  if (!names.length || names.length > 30) throw new Error('The ZIP must contain between 1 and 30 files.');
  for (const name of names) if (!safeArchiveEntry(name)) throw new Error(`Unsafe ZIP path: ${name}`);
  let declaredUncompressedBytes = 0;
  for (const entry of Object.values(zip.files)) {
    if (entry.dir) continue;
    const internal = entry as unknown as { _data?: { uncompressedSize?: number } };
    declaredUncompressedBytes += Number(internal._data?.uncompressedSize || 0);
  }
  if (declaredUncompressedBytes > 75 * 1024 * 1024) throw new Error('The ZIP expands beyond the 75 MB safety limit.');

  const prefix = archiveRootPrefix(names);
  const manifestEntry = zip.file(`${prefix}manifest.json`);
  if (!manifestEntry) throw new Error('The ZIP must include manifest.json at its root.');

  let manifest: Record<string, unknown>;
  try {
    manifest = JSON.parse(await manifestEntry.async('text')) as Record<string, unknown>;
  } catch {
    throw new Error('manifest.json is not valid JSON.');
  }

  const required = [
    'city_slug', 'city_name', 'county', 'state', 'batch_id', 'source_agency', 'source_url',
    'source_id', 'data_file', 'data_dictionary_file', 'coverage_start', 'coverage_end', 'checks',
  ];
  const missing = required.filter((field) => manifest[field] === undefined || manifest[field] === '' || manifest[field] === null);
  if (missing.length) throw new Error(`manifest.json is missing: ${missing.join(', ')}.`);

  const citySlug = String(manifest.city_slug || '');
  const batchId = String(manifest.batch_id || '');
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(citySlug)) throw new Error('manifest.json has an invalid city_slug.');
  if (!/^[A-Za-z0-9][A-Za-z0-9._-]*$/.test(batchId)) throw new Error('manifest.json has an invalid batch_id.');
  if (citySlug !== expected.citySlug) throw new Error('The city in manifest.json does not match the form.');
  const equalText = (left: unknown, right: string) => String(left || '').trim().toLowerCase() === right.trim().toLowerCase();
  if (!equalText(manifest.city_name, expected.cityName) || !equalText(manifest.county, expected.county) || !equalText(manifest.state, expected.state)) {
    throw new Error('The city, county, or state in manifest.json does not match the form.');
  }
  if (!equalText(manifest.source_agency, expected.sourceAgency) || String(manifest.source_url || '').trim() !== expected.sourceUrl.trim()) {
    throw new Error('The source agency or URL in manifest.json does not match the form.');
  }
  if (String(manifest.coverage_start) !== expected.coverageStart || String(manifest.coverage_end) !== expected.coverageEnd) {
    throw new Error('The coverage dates in manifest.json do not match the form.');
  }

  const checks = manifest.checks as Record<string, unknown>;
  const requiredChecks = [
    'official_or_authorized_source',
    'declared_court_scope_complete',
    'stable_case_identifiers',
    'judge_identity_crosswalk_complete',
    'all_required_fields_present',
    'date_coverage_documented',
    'no_unexplained_coverage_gaps',
    'data_dictionary_included',
    'amendments_and_corrections_addressed',
    'privacy_review_passed',
    'public_projection_safe',
  ];
  const failedChecks = requiredChecks.filter((check) => checks?.[check] !== true);
  if (failedChecks.length) throw new Error(`manifest.json does not attest: ${failedChecks.join(', ')}.`);

  const dataFile = `${prefix}${String(manifest.data_file)}`;
  const dictionaryFile = `${prefix}${String(manifest.data_dictionary_file)}`;
  if (!zip.file(dataFile)) throw new Error(`The ZIP is missing the declared data file: ${String(manifest.data_file)}.`);
  if (!zip.file(dictionaryFile)) throw new Error(`The ZIP is missing the declared data dictionary: ${String(manifest.data_dictionary_file)}.`);
  if (!/\.(csv|json)$/i.test(dataFile)) throw new Error('The structured data file must be CSV or JSON.');
  if (!/\.(txt|md|csv|json|pdf)$/i.test(dictionaryFile)) throw new Error('The data dictionary must be TXT, Markdown, CSV, JSON, or PDF.');

  const prohibitedExtensions = /\.(exe|dll|dmg|pkg|app|sh|bat|cmd|ps1|jar|com|scr|msi)$/i;
  const prohibited = names.find((name) => !name.endsWith('/') && prohibitedExtensions.test(name));
  if (prohibited) throw new Error(`Executable content is not accepted: ${prohibited}.`);

  return { manifest, citySlug, batchId, rootPrefix: prefix };
}

export function maskEmail(email: string): string {
  const [local, domain] = email.split('@');
  if (!local || !domain) return '—';
  return `${local.slice(0, 2)}${local.length > 2 ? '…' : ''}@${domain}`;
}

export function humanBytes(value: number): string {
  if (value < 1024) return `${value} B`;
  if (value < 1024 * 1024) return `${(value / 1024).toFixed(1)} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
