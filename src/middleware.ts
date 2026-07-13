import {defineMiddleware} from 'astro:middleware';
import {verifySession} from './lib/admin/session';
export const onRequest=defineMiddleware(async(ctx,next)=>{
  const path=ctx.url.pathname;
  if(!path.startsWith('/admin')||path==='/admin/login')return next();
  const secret=(ctx.locals.runtime?.env as any)?.ADMIN_SESSION_SECRET;
  const ok=await verifySession(ctx.cookies.get('courtscope_session')?.value,secret);
  if(!ok)return ctx.redirect(`/admin/login?next=${encodeURIComponent(path)}`);
  return next();
});
