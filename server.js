'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const ROOT=__dirname,DATA=path.join(ROOT,'data'),UPLOAD=path.join(DATA,'uploads');
fs.mkdirSync(UPLOAD,{recursive:true});
const EVENTS=path.join(DATA,'events.json');
const USER=process.env.ADMIN_USERNAME,PIN=process.env.ADMIN_PIN,PORT=Number(process.env.PORT||3000);
if(!USER||!PIN){console.error('Set ADMIN_USERNAME and ADMIN_PIN environment variables before starting.');process.exit(1)}
const pinSalt=crypto.randomBytes(16),pinHash=crypto.scryptSync(PIN,pinSalt,64);const sessions=new Map(),attempts=new Map();
const mime={'.html':'text/html; charset=utf-8','.css':'text/css; charset=utf-8','.js':'text/javascript; charset=utf-8','.jpg':'image/jpeg','.jpeg':'image/jpeg','.png':'image/png','.webp':'image/webp','.svg':'image/svg+xml','.ico':'image/x-icon'};
function send(res,status,obj,headers={}){res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff',...headers});res.end(JSON.stringify(obj))}
function load(){try{return JSON.parse(fs.readFileSync(EVENTS,'utf8'))}catch{return []}}
function save(events){fs.writeFileSync(EVENTS+'.tmp',JSON.stringify(events,null,2));fs.renameSync(EVENTS+'.tmp',EVENTS)}
function body(req){return new Promise((resolve,reject)=>{let s='',n=0;req.on('data',c=>{n+=c.length;if(n>5*1024*1024){reject(Error('Request too large'));req.destroy()}else s+=c});req.on('end',()=>{try{resolve(JSON.parse(s||'{}'))}catch{reject(Error('Invalid JSON'))}});req.on('error',reject)})}
function authorized(req){const token=(req.headers.cookie||'').match(/(?:^|;\s*)cl_session=([a-f0-9]+)/)?.[1];if(!token)return false;const exp=sessions.get(token);if(!exp||exp<Date.now()){sessions.delete(token);return false}return true}
const cookie=(value,maxAge)=>`cl_session=${value}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${maxAge}${process.env.NODE_ENV==='production'?'; Secure':''}`;
function safeURL(u){if(!u)return '';try{const v=new URL(u);return ['https:','http:'].includes(v.protocol)?v.href:''}catch{return ''}}
http.createServer(async(req,res)=>{try{const url=new URL(req.url,'http://localhost'),pathname=decodeURIComponent(url.pathname);res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('X-Frame-Options','DENY');
if(pathname==='/api/session'&&req.method==='GET')return send(res,200,{authenticated:authorized(req)});
if(pathname==='/api/login'&&req.method==='POST'){
const ip=req.socket.remoteAddress||'unknown',rec=attempts.get(ip)||{n:0,until:0};if(rec.until>Date.now())return send(res,429,{error:'Too many attempts. Try again in 15 minutes.'});
const data=await body(req),given=crypto.scryptSync(String(data.pin||''),pinSalt,64);if(data.username!==USER||!crypto.timingSafeEqual(given,pinHash)){rec.n++;if(rec.n>=5){rec.until=Date.now()+900000;rec.n=0}attempts.set(ip,rec);return send(res,401,{error:'Invalid username or PIN'})}
attempts.delete(ip);const token=crypto.randomBytes(32).toString('hex');sessions.set(token,Date.now()+8*3600000);return send(res,200,{ok:true},{'Set-Cookie':cookie(token,8*3600)})}
if(pathname==='/api/logout'&&req.method==='POST'){const token=(req.headers.cookie||'').match(/cl_session=([a-f0-9]+)/)?.[1];if(token)sessions.delete(token);return send(res,200,{ok:true},{'Set-Cookie':cookie('',0)})}
if(pathname==='/api/events'&&req.method==='GET')return send(res,200,load());
if(pathname.startsWith('/api/')){
if(!authorized(req))return send(res,401,{error:'Please sign in first'});
if(pathname==='/api/events'&&req.method==='POST'){
const d=await body(req),title=String(d.title||'').trim().slice(0,120),date=String(d.date||'');if(!title||!/^\d{4}-\d{2}-\d{2}$/.test(date))return send(res,400,{error:'A valid event title and date are required'});
if(d.rsvp&&!safeURL(d.rsvp))return send(res,400,{error:'RSVP link must begin with https:// or http://'});
const id=crypto.randomUUID();let image='';if(d.imageData){const match=String(d.imageData).match(/^data:(image\/(?:jpeg|png|webp));base64,([a-zA-Z0-9+/=]+)$/);if(!match)return send(res,400,{error:'Invalid image type'});const bytes=Buffer.from(match[2],'base64');if(bytes.length>3*1024*1024)return send(res,400,{error:'Image exceeds 3 MB'});const ext={'image/jpeg':'jpg','image/png':'png','image/webp':'webp'}[match[1]];image=`/media/${id}.${ext}`;fs.writeFileSync(path.join(UPLOAD,`${id}.${ext}`),bytes,{flag:'wx'})}
const ev={id,title,date,location:String(d.location||'').slice(0,200),description:String(d.description||'').slice(0,2000),rsvp:safeURL(d.rsvp),image};const events=load();events.push(ev);save(events);return send(res,201,ev)}
if(pathname.startsWith('/api/events/')&&req.method==='DELETE'){const id=pathname.split('/').pop();const events=load(),ev=events.find(e=>e.id===id);if(!ev)return send(res,404,{error:'Event not found'});save(events.filter(e=>e.id!==id));if(ev.image)try{fs.unlinkSync(path.join(UPLOAD,path.basename(ev.image)))}catch{}return send(res,200,{ok:true})}
return send(res,404,{error:'Not found'})}
let file;if(pathname.startsWith('/media/')){file=path.join(UPLOAD,path.basename(pathname));}else{const rel=pathname==='/'?'index.html':pathname.slice(1);file=path.resolve(ROOT,rel);if(!file.startsWith(ROOT+path.sep)||file.startsWith(DATA+path.sep)||['server.js','.env','package.json'].includes(path.basename(file)))return send(res,403,{error:'Forbidden'})}
if(!fs.existsSync(file)||!fs.statSync(file).isFile())return send(res,404,{error:'Not found'});res.writeHead(200,{'Content-Type':mime[path.extname(file).toLowerCase()]||'application/octet-stream'});fs.createReadStream(file).pipe(res)
}catch(e){console.error(e);if(!res.headersSent)send(res,400,{error:'Could not process request'})}}).listen(PORT,()=>console.log(`Changing Lives website: http://localhost:${PORT}`));
