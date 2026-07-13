import type { APIRoute } from 'astro';
import { sameOrigin, sha256 } from '../../../lib/admin/security';
const allowed=new Set(['wrong_judge','wrong_court','wrong_division','wrong_sentence','broken_link','duplicate','missing_case','wrong_election_year','wrong_background','demographic_mismatch','translation','other']);
type ReportBody={reportType?:string;entityId?:string;explanation?:string};
export const POST:APIRoute=async({request})=>{
  if(!sameOrigin(request)) return new Response('Forbidden',{status:403});
  const b=(await request.json().catch(()=>({}))) as ReportBody;
  if(!allowed.has(String(b.reportType||''))||!b.entityId||String(b.explanation||'').length<10) return Response.json({ok:false,error:'INVALID_REPORT'},{status:400});
  const id=(await sha256(`${b.reportType}:${b.entityId}:${Date.now()}`)).slice(0,16);
  return Response.json({ok:true,reportId:id,status:'RECEIVED',note:'Persistence requires deployed D1 binding.'},{status:202});
};
