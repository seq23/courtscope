import type { APIRoute } from 'astro';
import { findCity } from '../../../lib/cities';
import { cityJudges, cityCases } from '../../../lib/city-data';
export const GET: APIRoute = ({ url }) => {
  const q=(url.searchParams.get('q')||'').trim().toLowerCase();
  const citySlug=(url.searchParams.get('city')||'memphis').toLowerCase();
  const city=findCity(citySlug);
  if(!city) return Response.json({error:'Unknown city.'},{status:404});
  if(!q) return Response.json({query:q,city:citySlug,results:[]},{headers:{'cache-control':'no-store'}});
  const judges=cityJudges(citySlug).filter(j=>[j.name,j.shortName,j.court,j.division,String(j.nextElectionYear)].some(v=>v.toLowerCase().includes(q))).map(j=>({type:'judge',id:j.slug,label:j.shortName,url:`/${citySlug}/judges/${j.slug}`}));
  const cases=cityCases(citySlug).filter(c=>[c.id,c.publicCaseNumber,c.court,c.division].some(v=>v.toLowerCase().includes(q))).map(c=>({type:'case',id:c.id,label:c.publicCaseNumber,url:`/${citySlug}/cases/${c.publicCaseNumber}`}));
  return Response.json({query:q,city:citySlug,classification:city.dataMode==='fixture'?'SYNTHETIC_FIXTURE':'PUBLISHED_CITY_DATA',results:[...judges,...cases].slice(0,25)},{headers:{'cache-control':'no-store'}});
};
