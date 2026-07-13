import type { APIRoute } from 'astro';
export const GET:APIRoute=()=>Response.json({status:'DEGRADED_EXTERNAL_DEPENDENCY',phasesImplemented:[1,2,3,4,5,6,7,8,9,10,11,12,13],officialData:'PENDING',publicScores:'WITHHELD',api:'INTERNAL_ONLY'});
