// Slide renderer: project JSON + template config -> markup. Used by the stage, filmstrip, gallery and export.
import { TEMPLATES } from './templates/index.js';
import { RATIOS, KINDS, PAIRINGS, FONTS, fontStack, paletteById, inlineMarkup } from './schema.js';
import { esc, pad2, onColor, contrast, clamp } from './util.js';
import { urlOf } from './assets.js';
import { overlaysHTML } from './overlays.js';

/* ---------- global style injection ---------- */
export function injectStyles() {
  const base = new URL('../fonts/', import.meta.url).href;
  let css = '';
  for (const [name, f] of Object.entries(FONTS)) {
    css += `@font-face{font-family:"${name}";font-style:normal;font-weight:${f.w[0]} ${f.w[1]};font-display:swap;src:url(${base}${f.file}) format("woff2")}\n`;
    if (f.italic) css += `@font-face{font-family:"${name}";font-style:italic;font-weight:${f.w[0]} ${f.w[1]};font-display:swap;src:url(${base}${f.italic}) format("woff2")}\n`;
  }
  const fonts = document.createElement('style');
  fonts.id = 'cs-fonts';
  fonts.textContent = css;
  document.head.appendChild(fonts);

  let t = '';
  // "& [data-x]" targets attributes on the slide root itself, so glue it to the root selector
  for (const tpl of Object.values(TEMPLATES)) t += tpl.css.replace(/&\s+\[data-/g, '&[data-').replace(/&/g, `.sl.t-${tpl.id}`) + '\n';
  const st = document.createElement('style');
  st.id = 'cs-templates';
  st.textContent = t;
  document.head.appendChild(st);
}

export const fontFacesFor = (families) => {
  const base = new URL('../fonts/', import.meta.url).href;
  return families
    .filter((n) => FONTS[n])
    .map((n) => ({ name: n, ...FONTS[n], url: base + FONTS[n].file, italicUrl: FONTS[n].italic ? base + FONTS[n].italic : null }));
};

/* ---------- theme resolution ---------- */
export function resolve(p) {
  const t = TEMPLATES[p.template] || Object.values(TEMPLATES)[0];
  const pal = paletteById(p.theme.palette || t.palette);
  const o = p.theme.overrides || {};
  const colors = {
    bg: o.bg || pal.bg,
    surface: o.surface || pal.surface,
    text: o.text || pal.text,
    accent: o.accent || pal.accent,
    accent2: pal.accent2,
    muted: o.text || o.bg ? null : pal.muted,
    heading: o.heading || null,
    body: o.body || null,
    tag: o.tag || null,
    footer: o.footer || null,
    hl: o.hl || null, // custom *highlight* colour; null = the template's own highlight colour
  };
  colors.hlDefault = t.hl === 'accent2' ? pal.accent2 : colors.accent;
  const pair = PAIRINGS.find((x) => x.id === (p.type.pairing || t.pairing)) || PAIRINGS[0];
  const display = p.type.display || pair.display;
  const body = p.type.body || pair.body;
  const dFont = FONTS[display];
  const weight = clamp(p.type.weight ?? pair.hw, dFont.w[0], dFont.w[1]);
  return {
    t,
    colors,
    pair,
    display,
    body,
    tracking: p.type.tracking ?? pair.tr,
    leading: p.type.leading ?? pair.lh,
    gap: p.shape.gap ?? 1,
    weight,
    radius: p.shape.radius ?? t.radius ?? 2,
    pad: p.shape.pad ?? t.pad ?? 6.5,
    texture: p.theme.texture || t.texture || 'none',
    gradient: p.theme.gradient || t.gradient || 'none',
  };
}

export const usedFamilies = (p) => {
  const r = resolve(p);
  return [...new Set([r.display, r.body, 'JetBrains Mono'])];
};

export function mediaModeFor(t, kind) {
  const m = t.media;
  if (typeof m === 'string') return m;
  return (m && (m[kind] || m.default)) || 'frame';
}

/* ---------- markup ---------- */
const ARROW = '<svg class="ar" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 12h15M13 6l6 6-6 6"/></svg>';
const para = (text) =>
  String(text)
    .split(/\n+/)
    .filter((l) => l.trim())
    .map((l) => `<p>${inlineMarkup(l)}</p>`)
    .join('');

const initials = (n) =>
  String(n || '')
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] || '')
    .join('')
    .toUpperCase() || '·';

export function slideHTML(p, i, { mode = 'static', fit = 1, ow = false, measure = false } = {}) {
  const r = resolve(p);
  const { t, colors } = r;
  const s = p.slides[i];
  const n = p.slides.length;
  const f = s.fields;
  const edit = mode === 'edit';
  const kind = s.kind;
  const has = (v) => v && String(v).trim();
  const attr = (k) => (edit ? ` data-f="${k}"` : '');
  // per-element offset + alignment (set by dragging on the canvas or the Slide tab)
  const E = (k) => {
    const e = s.el && s.el[k];
    let st = '';
    if (e) {
      // measuring ignores offset + scale so manual placement never makes autofit shrink the rest of the slide
      if (!measure && (e.x || e.y)) st += `translate:calc(var(--u0) * ${e.x}) calc(var(--u0) * ${e.y});`;
      if (!measure && e.s && e.s !== 1) st += `--u:calc(var(--u0) * ${e.s});`;
      if (e.a) st += `align-self:${e.a === 'left' ? 'flex-start' : e.a === 'right' ? 'flex-end' : 'center'};text-align:${e.a};`;
    }
    return ` data-el="${k}"${st ? ` style="${st}"` : ''}`;
  };

  const assetUrl = s.media.asset ? urlOf(s.media.asset) : '';
  let mm = mediaModeFor(t, kind);
  if (mm === 'frame' && !assetUrl && kind !== 'visual') mm = 'none';
  if (mm === 'bg' && !assetUrl) mm = 'none';
  const onMedia = mm === 'bg' && !!assetUrl;

  /* colours */
  let text = colors.text;
  let muted = colors.muted || `color-mix(in srgb, ${colors.text} 70%, ${colors.bg})`;
  let accent = colors.accent;
  if (onMedia) {
    text = '#ffffff';
    muted = 'rgba(255,255,255,.8)';
    if (contrast(accent, '#000') < 3.4) accent = '#ffffff';
  }
  if (colors.body && !onMedia) muted = `color-mix(in srgb, ${colors.body} 72%, ${colors.bg})`;
  const m = s.media;
  const vars = {
    bg: colors.bg,
    surface: colors.surface,
    text,
    muted,
    accent,
    accent2: colors.accent2,
    'on-accent': onColor(accent),
    'on-accent2': onColor(colors.accent2),
    fd: fontStack(r.display),
    fb: fontStack(r.body),
    fm: fontStack('JetBrains Mono'),
    hw: r.weight,
    hs: +(r.pair.hs * (t.hs || 1) * p.type.scale).toFixed(3),
    htr: r.tracking + 'em',
    hlh: r.leading,
    sp: r.gap,
    hc: colors.heading || text,
    bc: colors.body || text,
    radius: r.radius,
    pad: r.pad,
    fit: +fit.toFixed(4),
    ow: ow ? 'anywhere' : 'normal',
    scrim: m.scrim / 100,
    hcase: p.type.caps === 'on' ? 'uppercase' : p.type.caps === 'off' ? 'none' : t.caps ? 'uppercase' : 'none',
  };
  if (colors.tag) {
    vars.tagbg = colors.tag;
    vars['on-tag'] = onColor(colors.tag);
  }
  if (colors.footer) vars.fc = colors.footer;
  if (colors.hl) {
    vars.hl = colors.hl; // text-coloured highlights
    vars.hlp = colors.hl; // pill highlights: background ...
    vars.hlt = onColor(colors.hl); // ... and a label colour that stays readable on it
  }
  const gr = p.theme.grad;
  if (gr && gr.on) vars.bgimg = `linear-gradient(${gr.angle}deg, ${gr.c1}, ${gr.c2})`;
  if (p.type.align !== 'auto') {
    vars.ta = p.type.align;
    vars.ai = p.type.align === 'left' ? 'flex-start' : p.type.align === 'right' ? 'flex-end' : 'center';
  }
  const style = Object.entries(vars)
    .map(([k, v]) => `--${k}:${v}`)
    .join(';');

  /* media */
  let media = '';
  if (mm !== 'none') {
    if (assetUrl) {
      const img = `<img src="${esc(assetUrl)}" alt="" draggable="false" style="object-fit:${m.fit};object-position:${m.x}% ${m.y}%;transform-origin:${m.x}% ${m.y}%;transform:scale(${m.zoom});opacity:${m.opacity}">`;
      media = `<div class="media"${edit ? ' data-media="1"' : ''}>${img}</div>`;
    } else {
      media = `<div class="media ph"${edit ? ' data-media="1"' : ''}><span>${edit ? 'Add image in the Media tab' : ''}</span></div>`;
    }
  }

  /* header */
  const hd = `<header class="hd">${has(f.tag) ? `<span class="tag"${E('tag')}${attr('tag')}>${esc(f.tag)}</span>` : ''}<span class="num">${esc(f.num) || pad2(i + 1)}</span></header>`;

  /* main */
  const H = kind === 'cover' ? 'h1' : 'h2';
  const heading = has(f.heading) ? `<${H} class="h"${E('heading')}${attr('heading')}>${inlineMarkup(f.heading)}</${H}>` : '';
  const sub = has(f.sub) ? `<p class="sub"${E('sub')}${attr('sub')}>${inlineMarkup(f.sub)}</p>` : '';
  const body = has(f.body) ? `<div class="body"${E('body')}${attr('body')}>${para(f.body)}</div>` : '';
  let mn = '';
  switch (kind) {
    case 'cover':
    case 'visual':
      mn = heading + sub;
      break;
    case 'content':
      mn = heading + sub + body;
      break;
    case 'stats':
      mn =
        (has(f.stat) ? `<div class="stat"${E('stat')}${attr('stat')}>${esc(f.stat)}</div>` : '') +
        (has(f.statLabel) ? `<div class="statl"${E('statl')}${attr('statLabel')}>${esc(f.statLabel)}</div>` : '') +
        heading +
        body;
      break;
    case 'quote':
      mn =
        (has(f.quote) ? `<blockquote class="q"${E('quote')}><p${attr('quote')}>${esc(f.quote)}</p></blockquote>` : '') +
        (has(f.author) || has(f.role)
          ? `<div class="by"${E('by')}>${has(f.author) ? `<b${attr('author')}>${esc(f.author)}</b>` : ''}${has(f.role) ? `<span${attr('role')}>${esc(f.role)}</span>` : ''}</div>`
          : '');
      break;
    case 'list': {
      const items = String(f.items || '')
        .split('\n')
        .map((x) => x.trim())
        .filter(Boolean)
        .slice(0, 12);
      mn =
        heading +
        sub +
        (items.length ? `<ol class="items"${E('items')}>${items.map((it, k) => `<li><span class="n">${pad2(k + 1)}</span><span class="t">${it.includes('|') ? it.split('|').slice(0, 2).map((x, j) => `<span class="c${j + 1}">${inlineMarkup(x.trim())}</span>`).join('') : inlineMarkup(it)}</span></li>`).join('')}</ol>` : '');
      break;
    }
    case 'cta':
      mn = heading + sub + (has(f.cta) ? `<div class="cbtn"${E('btn')}${attr('cta')}>${esc(f.cta)}</div>` : '') + body;
      break;
  }

  /* footer / branding */
  const b = p.brand;
  let ft = '';
  if (b.show && !(b.hideCover && i === 0)) {
    const av = b.avatar && urlOf(b.avatar) ? `<img src="${esc(urlOf(b.avatar))}" alt="" draggable="false">` : esc(initials(b.name));
    const who = has(b.name) || has(b.handle) ? `<span class="brand"><span class="av">${av}</span><span class="bn">${has(b.name) ? `<b>${esc(b.name)}</b>` : ''}${has(b.handle) ? `<i>${esc(b.handle)}</i>` : ''}</span></span>` : '<span class="brand"></span>';
    const nav = `<span class="nav">${b.counter ? `<span class="ct">${pad2(i + 1)}<em>/${pad2(n)}</em></span>` : ''}${b.swipe && i < n - 1 ? `<span class="sw">${ARROW}</span>` : ''}</span>`;
    ft = `<footer class="ft"${E('brand')}>${who}${nav}</footer>`;
  }

  const fx = r.texture !== 'none' || r.gradient !== 'none' ? `<div class="fx" data-tx="${r.texture}" data-gr="${r.gradient}"></div>` : '';
  const scrim = onMedia ? `<div class="scrim" data-s="${t.scrim || 'bottom'}"></div>` : '';
  const deco = t.deco ? `<div class="deco" aria-hidden="true">${t.deco({ i, n, kind, first: i === 0, last: i === n - 1 })}</div>` : '';
  const bgMedia = mm === 'bg' ? media : '';
  const frameMedia = mm === 'frame' ? media : '';

  const cls = `sl t-${t.id}${edit ? ' edit' : ''}`;
  const data = `data-kind="${kind}" data-mm="${mm}" data-onm="${onMedia ? 1 : 0}" data-brand="${b.pos}" data-first="${i === 0 ? 1 : 0}" data-last="${i === n - 1 ? 1 : 0}" data-align="${p.type.align}"${s.valign ? ` data-va="${s.valign}"` : ''}${colors.tag ? ' data-tg="1"' : ''}${colors.footer ? ' data-fc="1"' : ''}${vars.bgimg ? ' data-bgi="1"' : ''}${edit && s.canvasLocked ? ' data-locked="1"' : ''}`;
  return `<div class="${cls}" ${data} style="${esc(style)}">${fx}${bgMedia}${scrim}${deco}<div class="inner">${hd}${frameMedia}<main class="mn">${mn}</main>${ft}</div>${overlaysHTML(s, edit)}</div>`;
}

/* ---------- fit measurement ---------- */
const cache = new Map();
let epoch = 0;
export const invalidateFit = () => {
  epoch++;
  cache.clear();
};

let measureEl = null;
function getMeasure() {
  if (!measureEl) {
    measureEl = document.createElement('div');
    measureEl.className = 'cwrap';
    measureEl.setAttribute('aria-hidden', 'true');
    measureEl.style.cssText = 'position:fixed;left:-30000px;top:0;visibility:hidden;pointer-events:none;';
    document.body.appendChild(measureEl);
  }
  return measureEl;
}

function fitKey(p, i) {
  const s = p.slides[i];
  const b = p.brand;
  return JSON.stringify([epoch, p.template, p.ratio, p.type, p.shape, p.theme.palette, p.slides.length, i, s.kind, s.fields, !!s.media.asset, b.show, b.name, b.handle, !!b.avatar, b.counter, b.swipe, b.pos, b.hideCover]);
}

/**
 * Largest text scale (0.3-1) at which the slide's content fits, plus whether words must be allowed to break
 * mid-word (only when even the smallest scale overflows, e.g. a 200-character unbroken string).
 * Cached; identical for preview, thumbnails and export.
 * Overflow is judged from the content boxes, not scrollHeight: scrollHeight also counts tight-leading glyph
 * overhang, which flags slides that sit flush against the bottom edge as overflowing when they are not.
 */
export function measureFitInfo(p, i) {
  if (!p.type.autofit) return { fit: 1, ow: false };
  const key = fitKey(p, i);
  const hit = cache.get(key);
  if (hit) return hit;
  const [W, H] = RATIOS[p.ratio];
  const host = getMeasure();
  host.style.width = W + 'px';
  host.style.height = H + 'px';
  host.innerHTML = slideHTML(p, i, { mode: 'static', fit: 1, measure: true });
  const sl = host.firstElementChild;
  const inner = sl.querySelector('.inner');
  const mn = sl.querySelector('.mn');
  const over = () => {
    if (inner.scrollWidth > inner.clientWidth + 1) return true;
    const m = mn.getBoundingClientRect();
    for (const c of mn.children) {
      const r = c.getBoundingClientRect();
      if (r.bottom > m.bottom + 1 || r.right > m.right + 1 || r.left < m.left - 1 || c.scrollWidth > c.clientWidth + 1) return true;
    }
    return false;
  };
  let res = { fit: 1, ow: false };
  if (over()) {
    let lo = 0.3;
    let hi = 1;
    sl.style.setProperty('--fit', lo);
    if (over()) {
      sl.style.setProperty('--ow', 'anywhere');
      res = { fit: lo, ow: true };
    } else {
      for (let k = 0; k < 9; k++) {
        const mid = (lo + hi) / 2;
        sl.style.setProperty('--fit', mid);
        if (over()) hi = mid;
        else lo = mid;
      }
      res = { fit: lo, ow: false };
    }
  }
  host.innerHTML = '';
  cache.set(key, res);
  return res;
}
export const measureFit = (p, i) => measureFitInfo(p, i).fit;

export const slideMarkup = (p, i, mode) => slideHTML(p, i, { mode, ...measureFitInfo(p, i) });

/** Make sure the fonts a project uses are actually loaded (so measurement and export never see fallbacks). */
export async function ensureFonts(p) {
  const r = resolve(p);
  const loads = [];
  const w = r.weight;
  loads.push(document.fonts.load(`${w} 48px "${r.display}"`));
  loads.push(document.fonts.load(`400 24px "${r.body}"`));
  loads.push(document.fonts.load(`700 24px "${r.body}"`));
  loads.push(document.fonts.load(`500 24px "JetBrains Mono"`));
  if (FONTS[r.display].italic) loads.push(document.fonts.load(`italic ${w} 48px "${r.display}"`));
  await Promise.all(loads.map((x) => x.catch(() => [])));
  await document.fonts.ready;
}

export const kindLabel = (k) => KINDS[k]?.label || k;
