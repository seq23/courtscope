import { defineMiddleware } from 'astro:middleware';
import { verifySession } from './lib/admin/session';
import { getCloudflareEnv } from './lib/cloudflare-env';

const PUBLIC_ADMIN_PATHS = new Set(['/admin/login', '/api/admin/login', '/api/admin/logout']);

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.hostname === 'www.courtscope.org') {
    const canonical = new URL(context.url);
    canonical.hostname = 'courtscope.org';
    return Response.redirect(canonical, 301);
  }

  const path = context.url.pathname;
  const protectedAdminPath = path.startsWith('/admin') || path.startsWith('/api/admin');
  if (!protectedAdminPath || PUBLIC_ADMIN_PATHS.has(path)) return next();

  const env = getCloudflareEnv();
  const session = context.cookies.get('courtscope_session')?.value;
  const authenticated = await verifySession(session, env.ADMIN_SESSION_SECRET);

  if (!authenticated) {
    if (path.startsWith('/api/')) {
      return Response.json({ error: 'Admin authentication is required.' }, { status: 401 });
    }
    return context.redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  }

  return next();
});
