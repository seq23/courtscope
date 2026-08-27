import type { APIRoute } from 'astro';
import { visibleCities } from '../lib/cities';

const SITE = 'https://courtscope.org';

// Routes that render real published content and return 200.
// Redirect shims (/cases, /judges, /compare and their /es equivalents),
// /admin/* and /api/* are deliberately excluded.
const STATIC_ROUTES = [
  '/',
  '/about',
  '/accessibility',
  '/add-cities',
  '/cities',
  '/contact',
  '/corrections',
  '/data',
  '/data-sources',
  '/data-use',
  '/elections',
  '/funding-conflicts',
  '/governance',
  '/legal/disclaimer',
  '/legal/takedown',
  '/methodology',
  '/open-source',
  '/political-neutrality',
  '/privacy',
  '/records',
  '/security',
  '/terms',
  '/es',
  '/es/add-cities',
  '/es/cities',
  '/es/contact',
  '/es/corrections',
  '/es/data',
  '/es/data-sources',
  '/es/governance',
  '/es/methodology',
  '/es/records'
];

// Per-city dashboard surfaces that exist for every visible city.
const CITY_ROUTES = ['', '/cases', '/compare', '/data', '/judges'];

function escapeXml(value: string): string {
  return value.replace(/[&<>"']/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&apos;' })[c] as string
  );
}

export function collectUrls(): string[] {
  const urls = [...STATIC_ROUTES];
  for (const city of visibleCities) {
    for (const suffix of CITY_ROUTES) {
      urls.push(`/${city.slug}${suffix}`);
      urls.push(`/es/${city.slug}${suffix}`);
    }
  }
  return urls;
}

export const GET: APIRoute = () => {
  const lastmod = new Date().toISOString().slice(0, 10);
  const body =
    '<?xml version="1.0" encoding="UTF-8"?>\n' +
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' +
    collectUrls()
      .map((route) => `  <url><loc>${escapeXml(SITE + route)}</loc><lastmod>${lastmod}</lastmod></url>`)
      .join('\n') +
    '\n</urlset>\n';

  return new Response(body, {
    headers: {
      'Content-Type': 'application/xml; charset=utf-8',
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
