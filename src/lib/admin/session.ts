const enc=new TextEncoder();
const dec=new TextDecoder();
function b64url(bytes:Uint8Array){return btoa(String.fromCharCode(...bytes)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','')}
function fromB64url(value:string){const b=value.replaceAll('-','+').replaceAll('_','/').padEnd(Math.ceil(value.length/4)*4,'=');return Uint8Array.from(atob(b),c=>c.charCodeAt(0))}
async function sign(input:string,secret:string){const key=await crypto.subtle.importKey('raw',enc.encode(secret),{name:'HMAC',hash:'SHA-256'},false,['sign']);return b64url(new Uint8Array(await crypto.subtle.sign('HMAC',key,enc.encode(input))))}
export async function createSession(secret:string,ttl=3600){const body=b64url(enc.encode(JSON.stringify({exp:Math.floor(Date.now()/1000)+ttl,role:'owner'})));return `${body}.${await sign(body,secret)}`}
export async function verifySession(token:string|undefined,secret:string|undefined){if(!token||!secret)return false;const [body,sig]=token.split('.');if(!body||!sig)return false;const expected=await sign(body,secret);if(expected.length!==sig.length)return false;let diff=0;for(let i=0;i<sig.length;i++)diff|=sig.charCodeAt(i)^expected.charCodeAt(i);if(diff)return false;try{const data=JSON.parse(dec.decode(fromB64url(body)));return data.role==='owner'&&data.exp>Math.floor(Date.now()/1000)}catch{return false}}
export function sessionCookie(token:string,maxAge=3600){return `courtscope_session=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`}
export function clearSessionCookie(){return 'courtscope_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0'}
