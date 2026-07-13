import type { APIRoute } from 'astro';
import { fixtureJudges, fixtureCases } from '../../../lib/fixtures';
export const GET: APIRoute = ({ url }) => {
  const q=(url.searchParams.get('q')||'').trim().toLowerCase();
  if(!q) return new Response(JSON.stringify({query:q,results:[]}),{headers:{'content-type':'application/json','cache-control':'no-store'}});
  const judges=fixtureJudges.filter(j=>[j.name,j.shortName,j.court,j.division,String(j.nextElectionYear)].some(v=>v.toLowerCase().includes(q))).map(j=>({type:'judge',id:j.slug,label:j.shortName,url:`/judges/${j.slug}`}));
  const cases=fixtureCases.filter(c=>[c.id,c.publicCaseNumber,c.court,c.division].some(v=>v.toLowerCase().includes(q))).map(c=>({type:'case',id:c.id,label:c.publicCaseNumber,url:`/cases/${c.publicCaseNumber}`}));
  return new Response(JSON.stringify({query:q,classification:'SYNTHETIC_FIXTURE',results:[...judges,...cases].slice(0,25)}),{headers:{'content-type':'application/json','cache-control':'no-store'}});
};
