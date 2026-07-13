import { defineMiddleware } from 'astro:middleware';
import { verifySession } from './lib/admin/session';
import { getCloudflareEnv } from './lib/cloudflare-env';

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.hostname === 'www.courtscope.org') {
    const canonical = new URL(context.url);
    canonical.hostname = 'courtscope.org';
    return Response.redirect(canonical, 301);
  }

  const path = context.url.pathname;
  if (!path.startsWith('/admin') || path === '/admin/login') {
    return next();
  }

  const env = getCloudflareEnv();
  const session = context.cookies.get('courtscope_session')?.value;
  const authenticated = await verifySession(session, env.ADMIN_SESSION_SECRET);

  if (!authenticated) {
    return context.redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  }

  return next();
});
