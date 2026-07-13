const enc=new TextEncoder();
export async function sha256(v:string){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',enc.encode(v)))].map(x=>x.toString(16).padStart(2,'0')).join('')}
export async function verifyPassword(password:string, expectedHash:string){const actual=await sha256(password);if(actual.length!==expectedHash.length)return false;let d=0;for(let i=0;i<actual.length;i++)d|=actual.charCodeAt(i)^expectedHash.charCodeAt(i);return d===0}
export function secureCookie(value:string,maxAge=3600){return `courtscope_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
export function sameOrigin(req:Request){const o=req.headers.get('origin');if(!o)return false;return new URL(o).host===new URL(req.url).host}
