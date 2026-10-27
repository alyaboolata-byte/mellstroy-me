import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { LANGS } from './content.mjs';
import { OFFERS, DESTINATION_URL } from './site-config.mjs';
const root=path.dirname(fileURLToPath(import.meta.url));
const dist=path.join(root,'dist');
const problems=[];
const files=[];
const visit=d=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){const p=path.join(d,e.name);e.isDirectory()?visit(p):e.name==='index.html'&&files.push(p);}};
visit(dist);
const expected=LANGS.length*(1+OFFERS.length+12);
if(files.length!==expected) problems.push(`Expected ${expected} pages, got ${files.length}`);
for(const file of files){
  const html=fs.readFileSync(file,'utf8');
  const rel=path.relative(dist,file);
  if((html.match(/<h1\b/g)||[]).length!==1) problems.push(`H1: ${rel}`);
  if(!/<link rel="canonical" href="https:\/\/mellstroy\.me\//.test(html)) problems.push(`Canonical: ${rel}`);
  if(/noindex/i.test(html)) problems.push(`Noindex: ${rel}`);
  if(/[—–]/.test(html.replace(/<script[\s\S]*?<\/script>/g,''))) problems.push(`Long dash: ${rel}`);
  if(/>\s*(?:0[1-9]|10)\s*</.test(html)) problems.push(`Decorative numbering: ${rel}`);
  if(!html.includes('z4hsgdjk7o')) problems.push(`Clarity: ${rel}`);
  for(const [lang] of LANGS) if(!html.includes(`hreflang="${lang}"`)) problems.push(`Hreflang ${lang}: ${rel}`);
  if(!html.includes(`href="${DESTINATION_URL.replaceAll('&','&amp;')}"`)) problems.push(`CTA: ${rel}`);
  for(const match of html.matchAll(/(?:href|src)="(\/[^"#?]*)(?:#[^"]*)?"/g)) {
    const item=match[1];
    const target=path.join(dist,item.endsWith('/')?item+'index.html':item);
    if(!fs.existsSync(target)) problems.push(`Broken ${item}: ${rel}`);
  }
}
for(const offer of OFFERS) if(!fs.existsSync(path.join(dist,'assets',offer.image))) problems.push(`Missing asset ${offer.image}`);
for(const [lang] of LANGS){
  const home=fs.readFileSync(path.join(dist,lang==='ru'?'':lang,'index.html'),'utf8');
  for(const offer of OFFERS){
    const localizedArtwork=new Set(['ru','en','pt','uk','hi','uz','kk']);
    const asset=lang==='ru'?offer.image:`${localizedArtwork.has(lang)?lang:'en'}-${offer.image}`;
    if(!fs.existsSync(path.join(dist,'assets',asset))) problems.push(`Missing localized asset ${asset}`);
    if(!home.includes(`<a class="bonus-banner" href="${DESTINATION_URL}"`) || !home.includes(`src="/assets/${asset}"`)) problems.push(`Banner ${lang} ${offer.id}`);
    const detail=fs.readFileSync(path.join(dist,lang==='ru'?'':lang,'bonus',offer.id,'index.html'),'utf8');
    if(!detail.includes(`src="/assets/${asset}"`) || !detail.includes(`property="og:image" content="https://mellstroy.me/assets/${asset}"`)) problems.push(`Offer locale ${lang} ${offer.id}`);
  }
}
const xml=fs.readFileSync(path.join(dist,'sitemap.xml'),'utf8');
if((xml.match(/<url>/g)||[]).length!==expected) problems.push('Sitemap count');
if((xml.match(/<lastmod>/g)||[]).length!==expected) problems.push('Sitemap lastmod count');
if(problems.length){console.error(problems.join('\n'));process.exitCode=1;}else console.log(`Verified ${files.length} pages, internal links, assets, CTAs, canonicals, hreflang and sitemap.`);
