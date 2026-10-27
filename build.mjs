import fs from 'node:fs';
import { createHash } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { SITE_URL, DESTINATION_URL, BRAND, OFFERS } from './site-config.mjs';
import { COPY, LANGS } from './content.mjs';
import { OFFER_COPY } from './offer-content.mjs';

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const DIST = path.join(ROOT, 'dist');
const STYLE_VERSION = createHash('sha256').update(fs.readFileSync(path.join(ROOT,'styles.css'))).digest('hex').slice(0,12);
const TOPICS = ['bonuses','login','registration','mirror','casino','slots','payments','mobile','crypto','safety'];
const languageNames = Object.fromEntries(LANGS);
const cleanPunctuation = value => String(value).replace(/\s*[—–]\s*/g,' - ');
const esc = (value) => cleanPunctuation(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const base = lang => lang === 'ru' ? '/' : `/${lang}/`;
const url = (lang, segment = '') => SITE_URL + base(lang) + segment;
const local = (lang, segment = '') => base(lang) + segment;
// Original vector icons: no platform emoji or font-dependent symbols.
const ICON_PATHS = {
  external: 'M6 18 18 6M6 6h12v12',
  arrow: 'M4 12h16m-6-6 6 6-6 6',
  chevron: 'm6 9 6 6 6-6',
  menu: 'M4 6h16M4 12h16M4 18h16',
  plus: 'M5 12h14M12 5v14'
};
const icon = name => `<svg class="icon icon-${name}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path d="${ICON_PATHS[name]}"></path></svg>`;
const link = (href, label, cls = '') => `<a href="${esc(href)}" class="${cls}">${esc(label)}</a>`;
const external = (label, cls = 'btn btn-primary') => `<a class="${cls}" href="${esc(DESTINATION_URL)}" target="_blank" rel="noopener noreferrer nofollow sponsored">${esc(label)}${icon('external')}</a>`;
const offerPath = id => `bonus/${id}/`;
const topicPath = id => `guide/${id}/`;
const offerName = (lang, offer) => OFFER_COPY[lang][offer.id][0];
const localizedArtwork = new Set(['ru','en','pt','uk','hi','uz','kk']);
const offerImage = (lang, offer) => `/assets/${lang === 'ru' ? offer.image : `${localizedArtwork.has(lang)?lang:'en'}-${offer.image}`}`;
const offerFigure = (lang, offer) => `<img src="${offerImage(lang,offer)}" loading="lazy" width="1672" height="940" alt="${esc(BRAND + ' — ' + offerName(lang,offer) + ', ' + offer.percent + (offer.spins ? ' + ' + offer.spins : ''))}">`;
const banner = (lang,offer) => `<a class="bonus-banner" href="${esc(DESTINATION_URL)}" rel="nofollow sponsored noopener noreferrer" aria-label="${esc(offerName(lang,offer) + ' — ' + COPY[lang].cta)}">${offerFigure(lang,offer)}</a>`;
const bannerRow = (lang, offers=OFFERS) => `<div class="bonus-row" tabindex="0" aria-label="${esc(COPY[lang].offersTitle)}">${offers.map(o=>banner(lang,o)).join('')}</div>`;

function langSwitcher(lang, segment) {
  const current = languageNames[lang];
  return `<div class="lang-control"><button class="lang-button" type="button" aria-expanded="false" aria-controls="lang-list" data-lang-button>${esc(current)}${icon('chevron')}</button><div id="lang-list" class="lang-list" hidden>${LANGS.map(([code,name]) => `<a lang="${code}" hreflang="${code}" href="${local(code,segment)}" ${code===lang?'aria-current="page"':''}>${esc(name)}</a>`).join('')}</div></div>`;
}

function header(lang, segment) {
  const c = COPY[lang];
  return `<header class="site-header"><div class="shell header-inner"><a href="${base(lang)}" class="brand" aria-label="Mellstroy"><img src="/assets/favicon.webp" width="46" height="46" alt=""><span>MELLSTROY</span></a><nav class="desktop-nav" aria-label="Navigation"><a href="${local(lang)}#offers">${esc(c.nav[0])}</a><a href="${local(lang)}#games">${esc(c.nav[1])}</a><a href="${local(lang,topicPath('login'))}">${esc(c.nav[2])}</a><a href="${local(lang)}#articles">${esc(c.nav[3])}</a></nav><div class="header-actions">${langSwitcher(lang,segment)}<button class="menu-button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu" data-menu-button>${icon('menu')}</button></div></div><nav id="mobile-menu" class="mobile-menu" hidden>${c.nav.map((name,i)=>`<a href="${[local(lang)+'#offers',local(lang)+'#games',local(lang,topicPath('login')),local(lang)+'#articles'][i]}">${esc(name)}</a>`).join('')}</nav></header>`;
}

function footer(lang) {
  const c=COPY[lang];
  return `<footer class="site-footer"><div class="shell footer-grid"><div><a href="${base(lang)}" class="brand"><img src="/assets/favicon.webp" width="43" height="43" alt=""><span>MELLSTROY</span></a><p>${esc(c.footerEnd)}</p></div><div><h2>${esc(c.footerTitle)}</h2><div class="footer-links">${TOPICS.map(id=>link(local(lang,topicPath(id)),c.topicNames[id])).join('')}</div></div><div><h2>${esc(c.offersTitle)}</h2><div class="footer-links">${OFFERS.map(o=>link(local(lang,offerPath(o.id)),offerName(lang,o))).join('')}</div></div><div class="footer-languages">${LANGS.map(([code,name])=>link(base(code),name,code===lang?'active':'')).join('')}</div><p class="footer-note">${esc(c.note)}</p></div></footer>`;
}

function stickyActions(lang) {
  const c=COPY[lang];
  return `<div class="sticky-actions" aria-label="${esc(c.heroTitle)}"><strong>MELLSTROY CASINO</strong><div>${external(c.cta,'btn btn-primary')}${link(local(lang,topicPath('registration')),c.register,'btn btn-outline')}</div></div>`;
}

const ogLocale = lang => ({ru:'ru_RU',pl:'pl_PL',en:'en_US',pt:'pt_BR',uk:'uk_UA',hi:'hi_IN',uz:'uz_UZ',kk:'kk_KZ',tg:'tg_TJ',de:'de_DE',it:'it_IT',es:'es_ES',tr:'tr_TR',az:'az_AZ',hy:'hy_AM','ro-MD':'ro_MD',fr:'fr_FR'}[lang]||'en_US');

function head(lang,segment,title,description,ogImage='/assets/favicon.webp') {
  const canonical = url(lang,segment);
  const alternates = LANGS.map(([code])=>`<link rel="alternate" hreflang="${code}" href="${esc(url(code,segment))}">`).join('');
  const jsonLd = JSON.stringify({ '@context':'https://schema.org', '@type':'WebPage', name:cleanPunctuation(title), description:cleanPunctuation(description), url:canonical, inLanguage:lang });
  const image=SITE_URL+ogImage;
  const localeAlternates=LANGS.filter(([code])=>code!==lang).map(([code])=>`<meta property="og:locale:alternate" content="${ogLocale(code)}">`).join('');
  return `<!doctype html><html lang="${lang}"><head><meta name="google-site-verification" content="hsBZPHAVQ9-PA1MukTkZUEittSQKiXXVZHOxNp-sfjo"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>${esc(title)}</title><meta name="description" content="${esc(description)}"><meta name="robots" content="index,follow,max-image-preview:large"><link rel="canonical" href="${esc(canonical)}">${alternates}<link rel="alternate" hreflang="x-default" href="${esc(url('en',segment))}"><link rel="icon" type="image/webp" href="/assets/favicon.webp"><meta property="og:type" content="website"><meta property="og:site_name" content="Mellstroy"><meta property="og:locale" content="${ogLocale(lang)}">${localeAlternates}<meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(description)}"><meta property="og:url" content="${esc(canonical)}"><meta property="og:image" content="${esc(image)}"><meta property="og:image:type" content="image/webp"><meta property="og:image:width" content="1672"><meta property="og:image:height" content="940"><meta property="og:image:alt" content="${esc(title)}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${esc(title)}"><meta name="twitter:description" content="${esc(description)}"><meta name="twitter:image" content="${esc(image)}"><meta name="twitter:image:alt" content="${esc(title)}"><meta name="theme-color" content="#7131d9"><link rel="stylesheet" href="/styles.css?v=${STYLE_VERSION}"><script type="application/ld+json">${jsonLd.replace(/</g,'\\u003c')}</script><script defer src="/script.js"></script></head>`;
}

function page(lang,segment,title,description,body,ogImage) {
  return `${head(lang,segment,title,description,ogImage)}<body>${header(lang,segment)}<main>${body}</main>${footer(lang)}${stickyActions(lang)}</body></html>`;
}

function home(lang) {
  const c=COPY[lang];
  const hero = `<section class="hero"><div class="shell brand-intro"><p class="eyebrow">MELLSTROY CASINO</p><h1>${esc(c.heroTitle)}</h1><p class="hero-lead">${esc(c.heroText)}</p><div class="hero-actions">${external(c.cta)}${link(local(lang,topicPath('registration')),c.register,'btn btn-outline')}</div></div></section>`;
  const offers = `<section id="offers" class="section offers"><div class="shell"><h2>${esc(c.offersTitle)}</h2>${bannerRow(lang)}</div></section>`;
  const overview = `<section class="section overview"><div class="shell"><span class="overline">${esc(c.overviewTitle)}</span><div class="overview-grid"><h2>${esc(c.overviewTitle)}</h2><p>${esc(c.overviewLead)}</p></div><div class="steps">${c.steps.map(([,title,text])=>`<article><h3>${esc(title)}</h3><p>${esc(text)}</p></article>`).join('')}</div></div></section>`;
  const games = `<section id="games" class="section games"><div class="shell"><h2>${esc(c.featuredTitle)}</h2><p>${esc(c.featuredText)}</p><div class="game-links">${OFFERS.slice(2,6).map(o=>link(local(lang,offerPath(o.id)),offerName(lang,o),'game-pill')).join('')}</div></div></section>`;
  const articles = `<section id="articles" class="section articles"><div class="shell"><span class="overline">${esc(c.nav[3])}</span><div class="section-heading"><div><h2>${esc(c.articlesTitle)}</h2><p>${esc(c.articlesLead)}</p></div></div><div class="article-grid">${TOPICS.map(id=>`<a href="${local(lang,topicPath(id))}" class="article-link"><h3>${esc(c.topicNames[id])}</h3><p>${esc(c.topicBody[id][0])}</p><b>${icon('external')}</b></a>`).join('')}</div></div></section>`;
  const intent = `<section class="section intent-coverage"><div class="shell"><h2>${esc(c.heroTitle)}</h2><div class="intent-grid">${TOPICS.map(id=>`<article><h3>${esc(c.topicNames[id])}</h3>${c.topicBody[id].map(p=>`<p>${esc(p)}</p>`).join('')}<a href="${local(lang,topicPath(id))}">${esc(c.details)}</a></article>`).join('')}</div></div></section>`;
  const faq = `<section class="section faq"><div class="shell faq-layout"><div><span class="overline">FAQ</span><h2>${esc(c.faqTitle)}</h2></div><div>${c.faq.map(([q,a])=>`<details><summary>${esc(q)}${icon('plus')}</summary><p>${esc(a)}</p></details>`).join('')}</div></div></section>`;
  const final = `<section class="final-cta"><div class="shell final-inner"><div><span class="overline">MELLSTROY</span><h2>${esc(c.heroTitle)}</h2></div>${external(c.cta)}</div></section>`;
  const description=c.description;
  return page(lang,'',c.title,description,hero+offers+overview+games+articles+intent+faq+final,offerImage(lang,OFFERS[0]));
}

function offerPage(lang,offer) {
  const c=COPY[lang], title=offerName(lang,offer), segment=offerPath(offer.id);
  const intro=`<section class="section offer-detail"><div class="shell"><h1>${esc(title)} | Mellstroy</h1>${banner(lang,offer)}</div></section>`;
  const related=`<section class="section related"><div class="shell"><h2>${esc(c.offersTitle)}</h2>${bannerRow(lang,OFFERS.filter(o=>o.id!==offer.id))}</div></section>`;
  return page(lang,segment,`${title} | Mellstroy Casino | ${languageNames[lang]}`,`${title}. ${c.description}`,intro+related,offerImage(lang,offer));
}

function topicPage(lang,id) {
  const c=COPY[lang], title=c.topicNames[id], body=c.topicBody[id], segment=topicPath(id);
  const hero=`<section class="article-hero"><div class="shell"><span class="overline">MELLSTROY / ${esc(c.nav[3])}</span><h1>${esc(title)}</h1><p>${esc(body[0])}</p></div></section>`;
  const content=`<section class="section article-body"><div class="shell article-layout"><article><h2>${esc(title)}</h2>${body.slice(1).map(text=>`<p>${esc(text)}</p>`).join('')}<div class="hero-actions">${external(c.cta)}</div></article><aside><h2>${esc(c.footerTitle)}</h2>${TOPICS.filter(topic=>topic!==id).map(topic=>link(local(lang,topicPath(topic)),c.topicNames[topic])).join('')}</aside></div></section>`;
  const final=`<section class="final-cta"><div class="shell final-inner"><div><span class="overline">MELLSTROY</span><h2>${esc(c.heroTitle)}</h2></div>${external(c.cta)}</div></section>`;
  return page(lang,segment,`${title} | Mellstroy Casino`,`${body[0]} ${body[1]}`,hero+content+final);
}

function save(rel,html) { const dest=path.join(DIST,rel,'index.html'); fs.mkdirSync(path.dirname(dest),{recursive:true}); fs.writeFileSync(dest,html); }
fs.mkdirSync(DIST,{recursive:true});
fs.cpSync(path.join(ROOT,'assets'),path.join(DIST,'assets'),{recursive:true});
for (const name of ['styles.css','script.js','104d35d9cda7b4335046104b8265bf54.txt']) fs.copyFileSync(path.join(ROOT,name),path.join(DIST,name));
const segments=['',...OFFERS.map(o=>offerPath(o.id)),...TOPICS.map(topicPath)];
for (const [lang] of LANGS) {
  const prefix=lang==='ru'?'':lang;
  save(prefix,home(lang));
  for (const offer of OFFERS) save(path.join(prefix,offerPath(offer.id)),offerPage(lang,offer));
  for (const topic of TOPICS) save(path.join(prefix,topicPath(topic)),topicPage(lang,topic));
}
const xmlEsc=s=>s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
const lastmod=new Date().toISOString().slice(0,10);
const sitemap=`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${segments.flatMap(segment=>LANGS.map(([lang])=>`<url><loc>${xmlEsc(url(lang,segment))}</loc><lastmod>${lastmod}</lastmod>${LANGS.map(([alternate])=>`<xhtml:link rel="alternate" hreflang="${alternate}" href="${xmlEsc(url(alternate,segment))}"/>`).join('')}<xhtml:link rel="alternate" hreflang="x-default" href="${xmlEsc(url('en',segment))}"/></url>`)).join('\n')}\n</urlset>`;
fs.writeFileSync(path.join(DIST,'sitemap.xml'),sitemap);
const indexConfig=JSON.parse(fs.readFileSync(path.join(ROOT,'indexnow.config.json'),'utf8'));
indexConfig.sites[0].urls=segments.flatMap(segment=>LANGS.map(([lang])=>url(lang,segment)));
fs.writeFileSync(path.join(DIST,'indexnow.config.json'),JSON.stringify(indexConfig,null,2)+'\n');
fs.writeFileSync(path.join(DIST,'robots.txt'),`User-agent: *\nAllow: /\nSitemap: ${SITE_URL}/sitemap.xml\n`);
console.log(`Built ${LANGS.length * segments.length} pages in ${DIST}`);


import {updateSearchCopy} from './search-copy.mjs';
updateSearchCopy({out:'dist',brand:'Mellstroy'});
