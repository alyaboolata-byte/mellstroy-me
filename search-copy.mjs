import fs from 'node:fs';
import path from 'node:path';
import {reviewedCopy} from './copy-edits.mjs';

// This runs on generated HTML. It never rewrites URLs, IDs, CSS, tracking,
// verification, approved artwork or executable scripts.
const locales = new Set(['en','de','pt','es','ro','el','ro-md','md','it','ar','hi','uz','tr','fr','az','uk','ua','kk','tg']);
const walk = dir => fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):[path.join(dir,e.name)]);
const esc = s => String(s).replaceAll('&','&amp;').replaceAll('"','&quot;').replaceAll('<','&lt;');
const attr = (tag,name) => tag.match(new RegExp('\\b'+name+'\\s*=\\s*(["\'])(.*?)\\1','i'))?.[2];
const boundary = word => new RegExp('(?<![\\p{L}\\p{N}])(?:'+word+')(?![\\p{L}\\p{N}])','giu');

// Editorial changes are exact, reviewed phrases. Unknown sentences stay intact
// and the positioning validator below reports stale wording instead of guessing.
// Editorial changes are exact, reviewed phrases. Unknown sentences stay intact
// and the positioning validator below reports stale wording instead of guessing.
// Editorial changes are exact, reviewed phrases. Unknown sentences stay intact
// and the positioning validator below reports stale wording instead of guessing.
export function cleanCopy(value, lang='ru') {
  return reviewedCopy[lang]?.[value] ?? value;
}

const casino = {ru:'казино',en:'Casino',de:'Casino',pt:'cassino',es:'casino',ro:'cazino',el:'καζίνο',it:'casinò',fr:'casino',ar:'كازينو',hi:'कैसीनो',uz:'kazino',tr:'casino',az:'kazino',uk:'казино',kk:'казино',tg:'казино'};
const access = {ru:'вход и регистрация',en:'Login and Registration',de:'Login und Registrierung',pt:'acesso e cadastro',es:'acceso y registro',ro:'autentificare și înregistrare',el:'σύνδεση και εγγραφή',it:'accesso e registrazione',fr:'connexion et inscription',ar:'تسجيل الدخول والتسجيل',hi:'लॉगिन और पंजीकरण',uz:'kirish va ro‘yxatdan o‘tish',tr:'giriş ve kayıt',az:'giriş və qeydiyyat',uk:'вхід і реєстрація',kk:'кіру және тіркелу',tg:'воридшавӣ ва бақайдгирӣ'};
function homeCopy(brand,lang,origin){
  const name=brand==='Mostbet'&&lang==='ru'?'Мостбет':brand==='Parimatch'&&lang==='ru'&&origin.includes('press')?'Париматч':brand==='Mellstroy'&&lang==='ru'&&origin.includes('xn--')?'Меллстрой':brand;
  const h1=lang==='ru'&&['Betano','Parimatch'].includes(brand)?name+' официальный сайт':name+' '+(casino[lang]||casino.en);
  const alias=lang==='ru'?(brand==='Mellstroy'?(name==='Меллстрой'?'Mellstroy казино':'Меллстрой казино'):brand==='Mostbet'?'Mostbet':brand==='Parimatch'?(name==='Париматч'?'Parimatch':'Париматч'):''):'';
  return {h1,title:h1+' — '+(alias?alias+', ':'')+(access[lang]||access.en)};
}
function setMeta(h,name,value){
  const re=new RegExp('<meta\\b(?=[^>]*(?:name|property)=["\']'+name.replaceAll(':','\\:')+'["\'])[^>]*>','gi');
  return h.replace(re,tag=>tag.replace(/\bcontent=(["'])[\s\S]*?\1/i,'content="'+esc(value)+'"'));
}
function alternateTags(h){return [...h.matchAll(/<link\b[^>]*>/gi)].map(m=>m[0]).filter(t=>attr(t,'rel')==='alternate'&&attr(t,'hreflang')).map(t=>({tag:attr(t,'hreflang'),url:attr(t,'href')}));}

export function updateSearchCopy({out,brand}){
  const mapFile=path.join(out,'sitemap.xml');
  if(!fs.existsSync(mapFile)) throw new Error('sitemap.xml is required');
  const sitemap=fs.readFileSync(mapFile,'utf8');
  const urls=[...sitemap.matchAll(/<loc>\s*([^<]+)\s*<\/loc>/g)].map(m=>m[1].replaceAll('&amp;','&'));
  if(!urls.length||new Set(urls).size!==urls.length) throw new Error('Empty or duplicate sitemap URLs');
  const origin=new URL(urls[0]).origin;
  const byPath=new Map(urls.map(u=>[decodeURI(new URL(u).pathname).replace(/\/$/, '')||'/',u]));
  const pages=[];
  for(const file of walk(out).filter(f=>f.endsWith('.html'))){
    let h=fs.readFileSync(file,'utf8');
    const rel=path.relative(out,file).replaceAll(path.sep,'/');
    const lang=(h.match(/<html[^>]*\blang=["']([^"']+)/i)?.[1]||'ru').split('-')[0];
    const home=rel==='index.html'||(/^[^/]+\/index\.html$/.test(rel)&&locales.has(rel.split('/')[0]));
    const key='/'+rel.replace(/(?:\/)?index\.html$/, '').replace(/\.html$/,'');
    const canonical=byPath.get(key.replace(/\/$/,'')||'/');
    const copy=home&&brand!=='Mellstroy'?homeCopy(brand,lang,origin):null;
    const scripts=[];
    h=h.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,block=>{
      let result=block;
      if(/^<script\b/i.test(block)&&/type=["']application\/ld\+json["']/i.test(block)){
        const open=block.match(/^<script[^>]*>/i)[0];
        const visit=(v,k='')=>typeof v==='string'?(['url','@id','item','image','logo','contentUrl'].includes(k)?v:cleanCopy(v,lang)):Array.isArray(v)?v.map(x=>visit(x)):v&&typeof v==='object'?Object.fromEntries(Object.entries(v).map(([key,x])=>[key,copy&&key==='name'&&v['@type']==='WebPage'?copy.h1:visit(x,key)])):v;
        result=open+JSON.stringify(visit(JSON.parse(block.slice(open.length,-9)))).replaceAll('<','\\u003c')+'</script>';
      }
      scripts.push(result);return '<!--search-copy-block-'+(scripts.length-1)+'-->';
    });
    h=h.replace(/(<[^>]+>)|([^<]+)/g,(all,tag,text)=>tag?tag.replace(/\b(content|alt|aria-label|title)=(['"])(.*?)\2/gi,(m,a,q,v)=>a+'='+q+(/^https?:\/\//i.test(v)?v:cleanCopy(v,lang))+q):cleanCopy(text,lang));
    if(copy){
      h=h.replace(/<h1\b([^>]*)>[\s\S]*?<\/h1>/i,'<h1$1>'+esc(copy.h1)+'</h1>');
      h=h.replace(/<title>[\s\S]*?<\/title>/i,'<title>'+esc(copy.title)+'</title>');
      h=setMeta(setMeta(h,'og:title',copy.title),'twitter:title',copy.title);
    }
    if(canonical){
      const tag='<link rel="canonical" href="'+esc(canonical)+'">';
      h=/<link\b[^>]*rel=["']canonical["'][^>]*>/i.test(h)?h.replace(/<link\b[^>]*rel=["']canonical["'][^>]*>/i,tag):h.replace('</head>',tag+'</head>');
      h=setMeta(h,'og:url',canonical);
    }
    if(brand==='1win')h=h.replace(/>([^<]*)</g,(m,t)=>'>'+t.replace(/[\p{Extended_Pictographic}\uFE0F\u200D]/gu,'')+'<');
    h=h.replace(/<!--search-copy-block-(\d+)-->/g,(_,i)=>scripts[+i]);
    pages.push({file,h,rel,lang,canonical});
  }
  // Use only existing translations and reciprocal relationships. Country tags
  // also receive a generic language fallback (e.g. ro-MD + ro).
  const indexed=new Map(pages.filter(p=>p.canonical).map(p=>[p.canonical,p]));
  const previous=new Map(pages.map(p=>[p.canonical,alternateTags(p.h)]));
  const languageMaps=new Map();
  for(const p of pages){
    if(p.canonical){
      const alts=new Map();
      for(const a of previous.get(p.canonical)||[]){
        if(!indexed.has(a.url))continue;
        if(a.tag!=='x-default'&&a.url!==p.canonical&&!(previous.get(a.url)||[]).some(b=>b.url===p.canonical)) continue;
        alts.set(a.tag,a.url);
        if(a.tag.includes('-')&&a.tag!=='x-default')alts.set(a.tag.split('-')[0],a.url);
      }
      alts.set(p.lang,p.canonical);
      if(!alts.has('x-default'))alts.set('x-default',alts.get('ru')||p.canonical);
      p.h=p.h.replace(/<link\b[^>]*>/gi,tag=>attr(tag,'rel')==='alternate'&&attr(tag,'hreflang')?'':tag);
      p.h=p.h.replace('</head>',[...alts].map(([tag,url])=>'<link rel="alternate" hreflang="'+esc(tag)+'" href="'+esc(url)+'">').join('')+'</head>');
      const group=languageMaps.get(p.lang)||[];group.push(p.canonical);languageMaps.set(p.lang,group);
    }
    fs.writeFileSync(p.file,p.h);
  }
  const xml=list=>'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+list.map(u=>'<url><loc>'+esc(u)+'</loc></url>').join('\n')+'\n</urlset>\n';
  for(const [lang,list] of languageMaps)fs.writeFileSync(path.join(out,'sitemap-'+lang+'.xml'),xml(list));
  const bing=path.join(out,'BingSiteAuth.xml');
  if(!fs.existsSync(bing))fs.writeFileSync(bing,'<?xml version="1.0"?><users><user>0DE36A8DCEE7B75181435A6ED39F3AAC</user></users>');
  // Build must fail rather than publish broken or unindexable sitemap entries.
  const errors=[],titles=new Map();
  for(const url of urls){
    const p=indexed.get(url);
    if(!p){errors.push('No HTML for '+url);continue;}
    if((p.h.match(/<h1\b/gi)||[]).length!==1)errors.push('H1 count: '+url);
    if((p.h.match(/<title>/gi)||[]).length!==1)errors.push('Title count: '+url);
    const title=p.h.match(/<title>([\s\S]*?)<\/title>/i)?.[1];
    const titleKey=p.lang+'|'+title;
    if(titles.has(titleKey))errors.push('Duplicate title: '+url+' and '+titles.get(titleKey));
    titles.set(titleKey,url);
    if(process.env.VERCEL_ENV!=='preview'&&process.env.SITE_PREVIEW!=='1'&&/<meta\b[^>]*(?:name=["'](?:robots|googlebot|bingbot)["'][^>]*content=["'][^"']*noindex|content=["'][^"']*noindex[^>]*name=["']robots)/i.test(p.h))errors.push('noindex: '+url);
    const visible=p.h.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'').replace(/<[^>]*>/g,' ');
    if(boundary('гид(?:а|у|ом|е|ы|ов|ам|ами|ах)?|руководство|guides?|guías?|guias?|ghid(?:ul|uri)?|Ratgeber|Leitfaden|οδηγός').test(visible))errors.push('Unedited positioning: '+url);
    for(const a of alternateTags(p.h)){
      if(!indexed.has(a.url))errors.push('Missing hreflang: '+a.url);
      else if(a.tag!=='x-default'&&!alternateTags(indexed.get(a.url).h).some(b=>b.url===url))errors.push('Nonreciprocal hreflang: '+url+' -> '+a.url);
    }
    const html=p.h.replace(/<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi,'');
    for(const m of html.matchAll(/<(a|img|script|link)\b[^>]*>/gi)){
      const tag=m[0],kind=m[1].toLowerCase();
      if(kind==='link'&&!['stylesheet','icon','apple-touch-icon','preload'].includes(attr(tag,'rel')))continue;
      const ref=attr(tag,kind==='img'||kind==='script'?'src':'href');
      if(!ref||/^(?:data:|mailto:|tel:|javascript:)/i.test(ref))continue;
      const target=new URL(ref.replaceAll('&amp;','&'),url);
      if(target.origin!==origin)continue;
      const name=decodeURI(target.pathname).replace(/^\//,'');
      const candidates=[path.join(out,name),path.join(out,name,'index.html'),path.join(out,name+'.html')];
      const file=candidates.find(f=>fs.existsSync(f)&&fs.statSync(f).isFile());
      if(!file){errors.push('Broken internal '+kind+': '+url+' -> '+ref);continue;}
      if(kind==='a'&&target.hash&&file.endsWith('.html')){
        const id=decodeURIComponent(target.hash.slice(1));
        if(![...fs.readFileSync(file,'utf8').matchAll(/\bid=(["'])(.*?)\1/g)].some(x=>x[2]===id))errors.push('Missing anchor: '+url+' -> '+ref);
      }
    }
  }
  if(errors.length)throw new Error(errors.slice(0,30).join('\n'));
  console.log('SEO verified: '+urls.length+' canonical pages, '+languageMaps.size+' languages; homepage keys and visible copy updated.');
}
