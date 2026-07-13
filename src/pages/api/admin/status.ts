import type { APIRoute } from 'astro'; import health from '../../../../data/health/system_health.json';
export const GET: APIRoute=()=>new Response(JSON.stringify({...health,adminAuth:'NOT_IMPLEMENTED',mutations:'DISABLED'}),{status:200,headers:{'content-type':'application/json','cache-control':'no-store'}});
