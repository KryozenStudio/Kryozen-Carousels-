// Inspector: slide fields, design (palette, type, shape), media and branding. Static markup lives in index.html;
// this module builds the data-driven bits, binds events and keeps controls in sync with the project.
import { getProject, ui, commit, historyAssetIds, selectEl } from '../state.js';
import { KINDS, FIELDS, PALETTES, PAIRINGS, TEXTURES, GRADIENTS, PRESETS, FONTS, FONT_CATS, EL_LABELS, EL_KEYS, RATIOS, ARROW_STYLES, OVERLAY_SWATCHES, loadOverlayPrefs, saveOverlayPrefs, fontStack } from '../schema.js';
import { TEMPLATES } from '../templates/index.js';
import { resolve, mediaModeFor } from '../render.js';
import { circleCenter } from '../overlays.js';
import { addImage, urlOf, gc } from '../assets.js';
import { $, $$, normHex, debounce, clamp } from '../util.js';
import { toast } from './toast.js';
import { paintCircleMode } from './stage.js';

let hooks = { openGallery() {} };
const cur = () => getProject().slides[ui.slide];

const setPath = (o, path, v) => {
  const k = path.split('.');
  let t = o;
  for (let i = 0; i < k.length - 1; i++) t = t[k[i]];
  t[k[k.length - 1]] = v;
};
const getPath = (o, path) => path.split('.').reduce((a, k) => a?.[k], o);

/* ---------- tabs ---------- */
export function setTab(name) {
  $$('.tabs [role=tab]').forEach((t) => {
    const on = t.dataset.tab === name;
    t.setAttribute('aria-selected', on ? 'true' : 'false');
    t.tabIndex = on ? 0 : -1;
  });
  $$('#panels section').forEach((s) => (s.hidden = s.dataset.panel !== name));
  $('#panels').scrollTop = 0;
  const insp = $('#insp');
  if (insp.dataset.open === '0') setOpen(true);
}
function setOpen(open) {
  const insp = $('#insp');
  insp.dataset.open = open ? '1' : '0';
  $('#collapse').setAttribute('aria-expanded', open ? 'true' : 'false');
}

/* ---------- build dynamic controls ---------- */
function build() {
  $('#kindChips').innerHTML = Object.entries(KINDS)
    .map(([k, v]) => `<button class="chip" role="radio" data-kind="${k}" aria-checked="false">${v.label}</button>`)
    .join('');

  $('#slideFields').innerHTML = Object.entries(FIELDS)
    .map(([k, f]) => {
      const id = 'sf-' + k;
      const ctl = f.kind === 'line' ? `<input type="text" id="${id}" data-sf="${k}" maxlength="${f.max}" placeholder="${f.ph}" autocomplete="off">` : `<textarea id="${id}" data-sf="${k}" maxlength="${f.max}" placeholder="${f.ph}" rows="${f.rows || 2}"></textarea>`;
      return `<div class="field" data-fieldrow="${k}"><label class="lbl" for="${id}">${f.label}</label>${ctl}</div>`;
    })
    .join('');

  $('#palettes').innerHTML = PALETTES.map((p) => `<button class="sw" role="radio" data-pal="${p.id}" aria-checked="false" aria-label="${p.name}" title="${p.name}" style="--b:${p.bg};--t:${p.text};--a:${p.accent}"></button>`).join('');
  $('#textures').innerHTML = TEXTURES.map((t) => `<button class="chip" role="radio" data-tex="${t.id}" aria-checked="false">${t.id === 'none' ? 'No texture' : t.name}</button>`).join('');
  $('#gradients').innerHTML = GRADIENTS.map((t) => `<button class="chip" role="radio" data-grad="${t.id}" aria-checked="false">${t.id === 'none' ? 'No gradient' : t.name}</button>`).join('');
  $('#aStyle').innerHTML = Object.entries(ARROW_STYLES).map(([k, v]) => `<option value="${k}">${v}</option>`).join('');
  const swatches = (kind) =>
    OVERLAY_SWATCHES[kind].map(([v, name]) => `<button type="button" class="cs" role="radio" data-sw="${v}" aria-checked="false" aria-label="${name}" title="${name}"></button>`).join('') +
    `<label class="cs custom" title="Custom colour"><input type="color" data-swc="${kind}" aria-label="Custom colour"></label>`;
  $('#cRing').innerHTML = swatches('circle');
  $('#aColor').innerHTML = swatches('arrow');
  const groups = {};
  for (const n of Object.keys(FONTS)) (groups[FONT_CATS[n]] ||= []).push(n);
  const opts = Object.entries(groups).map(([g, l]) => `<optgroup label="${g}">${l.map((n) => `<option value="${n}">${n}</option>`).join('')}</optgroup>`).join('');
  $('#fDisp').innerHTML = opts;
  $('#fBody').innerHTML = opts;
  $('#pairs').innerHTML = PAIRINGS.map(
    (p) => `<button class="pair" role="radio" data-pair="${p.id}" aria-checked="false"><span class="a" style="font-family:${fontStack(p.display)};font-weight:${Math.min(p.hw, FONTS[p.display].w[1])}">${p.name}</span><span class="b" style="font-family:${fontStack(p.body)}">${p.display} + ${p.body}</span></button>`
  ).join('');
}

/* ---------- blocks that exist on the active slide (feeds the Block selector) ---------- */
export function availableEls(p, i) {
  const s = p.slides[i];
  const f = s.fields;
  const k = s.kind;
  const has = (v) => !!(v && String(v).trim());
  const out = [];
  const on = {
    tag: has(f.tag),
    heading: has(f.heading) && k !== 'quote',
    sub: has(f.sub) && ['cover', 'content', 'visual', 'list', 'cta'].includes(k),
    body: has(f.body) && ['content', 'stats', 'cta'].includes(k),
    stat: k === 'stats' && has(f.stat),
    statl: k === 'stats' && has(f.statLabel),
    quote: k === 'quote' && has(f.quote),
    by: k === 'quote' && (has(f.author) || has(f.role)),
    items: k === 'list' && has(f.items),
    btn: k === 'cta' && has(f.cta),
    brand: p.brand.show && !(p.brand.hideCover && i === 0),
  };
  for (const key of EL_KEYS) if (on[key]) out.push(key);
  return out;
}

/* ---------- remembered circle / arrow styling (localStorage), written lazily ---------- */
let pendingPrefs = {};
const flushPrefs = debounce(() => {
  const p = pendingPrefs;
  pendingPrefs = {};
  if (p.circle || p.arrow) saveOverlayPrefs(p);
}, 200);
const rememberPrefs = (patch) => {
  for (const g of Object.keys(patch)) pendingPrefs[g] = { ...(pendingPrefs[g] || {}), ...patch[g] };
  flushPrefs();
};
window.addEventListener('pagehide', () => flushPrefs.flush());

/* ---------- sync controls <- project ---------- */
const setVal = (el, v) => {
  if (!el || el === document.activeElement) return;
  if (el.type === 'checkbox') el.checked = !!v;
  else if (el.value !== String(v)) el.value = v;
};
const checked = (sel, pred) => $$(sel).forEach((b) => b.setAttribute('aria-checked', pred(b) ? 'true' : 'false'));

export function syncInspector() {
  const p = getProject();
  const s = cur();
  const r = resolve(p);

  checked('#kindChips .chip', (b) => b.dataset.kind === s.kind);
  const fields = KINDS[s.kind].fields;
  $$('[data-fieldrow]').forEach((row) => (row.hidden = !fields.includes(row.dataset.fieldrow)));
  $$('[data-sf]').forEach((el) => setVal(el, s.fields[el.dataset.sf]));

  $('#tplName').textContent = r.t.name;
  checked('#palettes .sw', (b) => b.dataset.pal === (p.theme.palette || r.t.palette));
  checked('#textures .chip', (b) => b.dataset.tex === r.texture);
  checked('#gradients .chip', (b) => b.dataset.grad === r.gradient);
  checked('#pairs .pair', (b) => b.dataset.pair === r.pair.id && !p.type.display && !p.type.body);
  const txt = r.colors.text;
  const shownColor = { bg: r.colors.bg, surface: r.colors.surface, heading: r.colors.heading || txt, body: r.colors.body || txt, accent: r.colors.accent, tag: r.colors.tag || r.colors.accent, hl: r.colors.hl || r.colors.hlDefault, footer: r.colors.footer || txt };
  $$('[data-color]').forEach((el) => setVal(el, normHex(shownColor[el.dataset.color], '#000000')));
  setVal($('#fDisp'), r.display);
  setVal($('#fBody'), r.body);
  const g = p.theme.grad;
  $('[data-gon]').checked = g.on;
  $$('[data-gcol]').forEach((el) => ((el.disabled = !g.on), setVal(el, g[el.dataset.gcol])));
  setVal($('#gAng'), g.angle);
  $('#gAng').disabled = !g.on;
  $('[data-gout]').textContent = g.angle + '°';
  // position group
  const key = ui.el && availableEls(p, ui.slide).includes(ui.el) ? ui.el : null;
  const eo = (key && s.el[key]) || { x: 0, y: 0, a: null, s: 1 };
  $('#posGroup').dataset.empty = key ? '0' : '1';
  $('#elName').textContent = key ? EL_LABELS[key] : 'select a block';
  setVal($('#posX'), eo.x);
  setVal($('#posY'), eo.y);
  setVal($('#posS'), eo.s ?? 1);
  $$('[data-pout]').forEach((o) => (o.textContent = o.dataset.pout === 's' ? Math.round((eo.s ?? 1) * 100) + '%' : eo[o.dataset.pout]));
  checked('#posAlign button', (b) => b.dataset.pa === eo.a);
  checked('#vAlign button', (b) => b.dataset.va === (s.valign || 'auto'));

  // block selector (works on locked canvases: it never touches the canvas)
  const avail = availableEls(p, ui.slide);
  const sel = $('#elSel');
  const sig = avail.join(',');
  if (sel.dataset.sig !== sig) {
    sel.dataset.sig = sig;
    sel.innerHTML = '<option value="">Select a block…</option>' + avail.map((k) => `<option value="${k}">${EL_LABELS[k]}</option>`).join('');
  }
  if (sel !== document.activeElement) sel.value = key && avail.includes(key) ? key : '';

  const shown = { 'type.scale': p.type.scale, 'type.weight': r.weight, 'shape.radius': r.radius, 'shape.pad': r.pad, 'type.tracking': r.tracking, 'type.leading': r.leading, 'shape.gap': r.gap };
  $$('[data-bind]').forEach((el) => {
    const path = el.dataset.bind;
    setVal(el, path in shown ? shown[path] : getPath(p, path));
  });
  const wRange = $('#typeWeight');
  const [lo, hi] = FONTS[r.display].w;
  wRange.min = lo;
  wRange.max = hi;
  wRange.disabled = lo === hi;
  $$('[data-out]').forEach((o) => {
    const v = shown[o.dataset.out];
    const k = o.dataset.out;
    o.textContent = k === 'type.scale' ? Math.round(v * 100) + '%' : k === 'type.weight' ? v : k === 'type.tracking' ? (v * 100).toFixed(1) + '%' : k === 'type.leading' || k === 'shape.gap' ? (+v).toFixed(2) : (+v).toFixed(1);
  });
  $$('[data-seg]').forEach((g) => checked(`[data-seg="${g.dataset.seg}"] button`, (b) => b.dataset.v === String(getPath(p, g.dataset.seg))));

  // media
  const has = !!(s.media.asset && urlOf(s.media.asset));
  $('#mediaCtl').hidden = !has;
  const prev = $('#dropPrev');
  prev.hidden = !has;
  prev.style.backgroundImage = has ? `url("${urlOf(s.media.asset)}")` : '';
  $('#dropTitle').textContent = has ? 'Replace image' : 'Drop an image here';
  const mode = mediaModeFor(r.t, s.kind);
  $('#scrimField').hidden = mode !== 'bg';
  $('#mediaHint').textContent =
    mode === 'bg'
      ? 'This template uses the image as a full-bleed background. Drag it on the preview to reposition; Ctrl/Cmd + scroll or pinch to zoom.'
      : mode === 'frame'
        ? 'This template shows the image in a frame. Drag it on the preview to reposition; Ctrl/Cmd + scroll or pinch to zoom.'
        : 'This template does not use images on this slide type.';
  $$('[data-m]').forEach((el) => setVal(el, s.media[el.dataset.m]));
  $$('[data-mout]').forEach((o) => {
    const k = o.dataset.mout;
    o.textContent = k === 'zoom' ? s.media.zoom.toFixed(2) + '×' : Math.round(s.media[k] * (k === 'opacity' ? 100 : 1)) + '%';
  });
  checked('[data-mseg=fit] button', (b) => b.dataset.v === s.media.fit);

  syncOverlays(p, s, r);

  $('#avatarClear').disabled = !p.brand.avatar;
  $('#mvL').disabled = ui.slide === 0;
  $('#mvR').disabled = ui.slide === p.slides.length - 1;
}

function paintSwatches(root, value, resolved) {
  let match = false;
  $$('.cs[data-sw]', root).forEach((b) => {
    const v = b.dataset.sw;
    b.style.setProperty('--c', v === 'accent' ? resolved.accent : v === 'text' ? resolved.text : v);
    const on = v === value;
    match ||= on;
    b.setAttribute('aria-checked', on ? 'true' : 'false');
  });
  const cu = $('.cs.custom', root);
  const hex = value === 'accent' ? resolved.accent : value === 'text' ? resolved.text : value;
  cu.style.setProperty('--c', hex);
  cu.setAttribute('aria-checked', match ? 'false' : 'true');
  const inp = $('input', cu);
  if (inp !== document.activeElement) inp.value = normHex(hex, '#ffffff');
}

function syncOverlays(p, s, r) {
  const [W, H] = RATIOS[p.ratio];
  const c = s.circle;
  const a = s.arrow;
  checked('#cMode button', (b) => b.dataset.cm === ui.circleMode);
  checked('#cPos button', (b) => b.dataset.cp === c.pos);
  $('#circleCtl').hidden = c.pos === 'off';
  const ctr = circleCenter(c, W, H);
  const cv = { cx: ctr.x, cy: ctr.y, size: c.size, border: c.border, zoom: c.zoom * 100, px: c.px, py: c.py };
  $$('#panels [data-c]').forEach((el) => setVal(el, +cv[el.dataset.c].toFixed(1)));
  $$('[data-cout]').forEach((o) => {
    const k = o.dataset.cout;
    o.textContent = k === 'border' ? String(Math.round(c.border)) : Math.round(cv[k]) + '%';
  });
  paintSwatches($('#cRing'), c.ring, r.colors);
  $('#cClear').disabled = !c.asset;
  $('#cBtn span').textContent = c.asset ? 'Replace' : 'Upload';

  $('#arrowCtl').hidden = a.style === 'off';
  setVal($('#aStyle'), a.style);
  const av = { size: a.size, rot: a.rot, x: a.x * 100, y: a.y * 100 };
  $$('#panels [data-a]').forEach((el) => setVal(el, +av[el.dataset.a].toFixed(1)));
  $$('[data-aout]').forEach((o) => {
    const k = o.dataset.aout;
    o.textContent = k === 'rot' ? Math.round(a.rot) + '°' : k === 'size' ? String(Math.round(a.size)) : Math.round(av[k]) + '%';
  });
  paintSwatches($('#aColor'), a.color, r.colors);
  $('#arrowHint').textContent = s.canvasLocked ? 'Canvas is locked. Place the arrow with the X / Y sliders.' : 'Drag the arrow on the preview to place it.';
}

/* ---------- image import ---------- */
const collect = () => gc(historyAssetIds());

export async function setSlideImage(file) {
  const dz = $('#dropTitle');
  const old = dz.textContent;
  dz.textContent = 'Processing…';
  try {
    const { id } = await addImage(file);
    const sid = cur().id;
    commit(
      (p) => {
        const sl = p.slides.find((x) => x.id === sid);
        if (sl) Object.assign(sl.media, { asset: id, x: 50, y: 50, zoom: 1 });
      },
      { scope: 'slide', ids: [sid], source: 'media' }
    );
    collect();
  } catch (e) {
    toast(e.message || 'Could not add that image.');
    dz.textContent = old;
  }
}

async function setAvatar(file) {
  try {
    const { id } = await addImage(file);
    commit((p) => (p.brand.avatar = id), { scope: 'global', source: 'media' });
    collect();
  } catch (e) {
    toast(e.message || 'Could not add that image.');
  }
}

/** Circle photo: stored like any asset; switching the circle on (saved corner + styling) if it was Off. */
export async function setCircleImage(file) {
  try {
    const { id } = await addImage(file);
    const sid = cur().id;
    const pr = loadOverlayPrefs().circle;
    commit(
      (p) => {
        const c = p.slides.find((x) => x.id === sid)?.circle;
        if (!c) return;
        if (c.pos === 'off') Object.assign(c, { pos: pr.corner, x: null, y: null, size: pr.size, border: pr.border, ring: pr.ring, zoom: pr.zoom });
        Object.assign(c, { asset: id, px: 50, py: 50 });
      },
      { scope: 'slide', ids: [sid], source: 'media' }
    );
    collect();
  } catch (e) {
    toast(e.message || 'Could not add that image.');
  }
}

/** Read an image straight from the system clipboard (needs HTTPS + a user tap). */
export async function pasteFromClipboard(target = 'main') {
  const run = (TARGETS[target] || TARGETS.main)[1];
  if (!navigator.clipboard || !navigator.clipboard.read) return toast('Clipboard access blocked — allow paste permission or tap Upload');
  let items;
  try {
    items = await navigator.clipboard.read();
  } catch (e) {
    if (e && (e.name === 'NotAllowedError' || e.name === 'SecurityError' || e.name === 'NotSupportedError')) return toast('Clipboard access blocked — allow paste permission or tap Upload');
    return toast('No image in clipboard — copy an image first or tap Upload');
  }
  for (const it of items) {
    const type = it.types.find((t) => t.startsWith('image/'));
    if (!type) continue;
    try {
      const blob = await it.getType(type);
      const ext = type.split('/')[1].replace('jpeg', 'jpg').replace(/[^a-z0-9]/g, '') || 'png';
      await run(new File([blob], `pasted.${ext}`, { type }));
      return;
    } catch {
      return toast('No image in clipboard — copy an image first or tap Upload');
    }
  }
  toast('No image in clipboard — copy an image first or tap Upload');
}

const TARGETS = { main: ['Main photo', (f) => setSlideImage(f)], circle: ['Circle photo', (f) => setCircleImage(f)], avatar: ['Brand avatar', (f) => setAvatar(f)] };

export const pickImage = () => {
  setTab('media');
  $('#file').click();
};

/* ---------- events ---------- */
function bind() {
  // tabs
  $$('.tabs [role=tab]').forEach((t) => (t.onclick = () => setTab(t.dataset.tab)));
  $('.tabs').addEventListener('keydown', (e) => {
    const tabs = $$('.tabs [role=tab]');
    const i = tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true');
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const n = tabs[(i + (e.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
      setTab(n.dataset.tab);
      n.focus();
      e.preventDefault();
    }
  });
  $('#collapse').onclick = () => setOpen($('#insp').dataset.open === '0');

  const panels = $('#panels');

  // slide kind + fields
  panels.addEventListener('click', (e) => {
    const k = e.target.closest('[data-kind]');
    if (k) {
      const kind = k.dataset.kind;
      commit(
        (p) => {
          const s = p.slides[ui.slide];
          s.kind = kind;
          const pre = PRESETS[kind] || {};
          for (const f of KINDS[kind].fields) if (!String(s.fields[f] || '').trim() && pre[f]) s.fields[f] = pre[f]; // never leaves a new type blank, never overwrites text
        },
        { scope: 'slide', ids: [cur().id] }
      );
      return;
    }
    const pal = e.target.closest('[data-pal]');
    if (pal) return commit((p) => ((p.theme.palette = pal.dataset.pal), (p.theme.overrides = {})), { scope: 'global' });
    const tex = e.target.closest('[data-tex]');
    if (tex) return commit((p) => (p.theme.texture = tex.dataset.tex), { scope: 'global' });
    const gr = e.target.closest('[data-grad]');
    if (gr) return commit((p) => (p.theme.gradient = gr.dataset.grad), { scope: 'global' });
    const pr = e.target.closest('[data-pair]');
    if (pr) return commit((p) => ((p.type.pairing = pr.dataset.pair), (p.type.weight = null), (p.type.display = null), (p.type.body = null), (p.type.tracking = null), (p.type.leading = null)), { scope: 'global' });
    const pa = e.target.closest('[data-pa]');
    if (pa && ui.el) {
      const id = cur().id;
      const key = ui.el;
      return commit((p) => {
        const s = p.slides.find((x) => x.id === id);
        s.el[key] = { x: 0, y: 0, a: null, s: 1, ...s.el[key], a: pa.dataset.pa };
      }, { scope: 'slide', ids: [id] });
    }
    const va = e.target.closest('[data-va]');
    if (va) {
      const id = cur().id;
      return commit((p) => (p.slides.find((x) => x.id === id).valign = va.dataset.va === 'auto' ? null : va.dataset.va), { scope: 'slide', ids: [id] });
    }
    const sg = e.target.closest('[data-seg] button');
    if (sg) return commit((p) => setPath(p, sg.closest('[data-seg]').dataset.seg, sg.dataset.v), { scope: 'global' });
    const cm = e.target.closest('[data-cm]');
    if (cm) {
      ui.circleMode = cm.dataset.cm;
      paintCircleMode();
      syncInspector();
      return;
    }
    const cp = e.target.closest('[data-cp]');
    if (cp) {
      const id = cur().id;
      const pos = cp.dataset.cp;
      const pr = loadOverlayPrefs().circle;
      commit(
        (p) => {
          const c = p.slides.find((x) => x.id === id).circle;
          const wasOff = c.pos === 'off';
          c.pos = pos;
          if (pos !== 'off') {
            c.x = c.y = null; // a corner preset snaps back to the corner and drops any custom spot
            if (wasOff) Object.assign(c, { size: pr.size, border: pr.border, ring: pr.ring, zoom: pr.zoom });
          }
        },
        { scope: 'slide', ids: [id] }
      );
      if (pos !== 'off') rememberPrefs({ circle: { corner: pos } });
      return;
    }
    const sw = e.target.closest('[data-sw]');
    if (sw) {
      const id = cur().id;
      const circle = !!sw.closest('#cRing');
      const v = sw.dataset.sw;
      commit((p) => (circle ? (p.slides.find((x) => x.id === id).circle.ring = v) : (p.slides.find((x) => x.id === id).arrow.color = v)), { scope: 'slide', ids: [id] });
      rememberPrefs(circle ? { circle: { ring: v } } : { arrow: { color: v } });
      return;
    }
    const ms = e.target.closest('[data-mseg] button');
    if (ms) {
      const id = cur().id;
      return commit((p) => (p.slides.find((x) => x.id === id).media[ms.closest('[data-mseg]').dataset.mseg] = ms.dataset.v), { scope: 'slide', ids: [id] });
    }
  });

  panels.addEventListener('input', (e) => {
    const el = e.target;
    if (el.dataset.sf) {
      const id = cur().id;
      const f = el.dataset.sf;
      commit((p) => (p.slides.find((x) => x.id === id).fields[f] = el.value), { key: `sf:${id}:${f}`, scope: 'slide', ids: [id], source: 'sidebar' });
    } else if (el.dataset.bind) {
      const path = el.dataset.bind;
      const v = el.type === 'checkbox' ? el.checked : el.type === 'range' ? parseFloat(el.value) : el.value;
      commit((p) => setPath(p, path, v), { key: 'b:' + path, scope: 'global', source: 'sidebar' });
    } else if (el.dataset.pos && ui.el) {
      const id = cur().id;
      const key = ui.el;
      const ax = el.dataset.pos;
      commit((p) => {
        const s = p.slides.find((x) => x.id === id);
        const o = (s.el[key] = { x: 0, y: 0, a: null, s: 1, ...s.el[key], [ax]: parseFloat(el.value) });
        if (!o.x && !o.y && !o.a && (o.s ?? 1) === 1) delete s.el[key];
      }, { key: `el:${id}:${key}:${ax}`, scope: 'slide', ids: [id], source: 'sidebar' });
    } else if (el.dataset.gon !== undefined) {
      commit((p) => (p.theme.grad.on = el.checked), { scope: 'global' });
    } else if (el.dataset.gcol) {
      commit((p) => (p.theme.grad[el.dataset.gcol] = el.value), { key: 'g:' + el.dataset.gcol, scope: 'global', source: 'sidebar' });
    } else if (el.dataset.gang !== undefined) {
      commit((p) => (p.theme.grad.angle = parseFloat(el.value)), { key: 'g:angle', scope: 'global', source: 'sidebar' });
    } else if (el.dataset.font) {
      commit((p) => (p.type[el.dataset.font] = el.value), { scope: 'global' });
    } else if (el.dataset.color) {
      const k = el.dataset.color;
      commit((p) => (p.theme.overrides[k] = el.value), { key: 'c:' + k, scope: 'global', source: 'sidebar' });
    } else if (el.dataset.c) {
      const id = cur().id;
      const k = el.dataset.c;
      const v = parseFloat(el.value);
      commit(
        (p) => {
          const c = p.slides.find((x) => x.id === id).circle;
          if (k === 'cx' || k === 'cy') {
            const [W, H] = RATIOS[p.ratio];
            const ctr = circleCenter(c, W, H);
            c.x = k === 'cx' ? v / 100 : ctr.x / 100;
            c.y = k === 'cy' ? v / 100 : ctr.y / 100;
          } else c[k] = k === 'zoom' ? v / 100 : v;
        },
        { key: `c:${id}:${k}`, scope: 'slide', ids: [id], source: 'sidebar' }
      );
      if (k === 'size' || k === 'border') rememberPrefs({ circle: { [k]: v } });
      else if (k === 'zoom') rememberPrefs({ circle: { zoom: v / 100 } });
    } else if (el.dataset.a) {
      const id = cur().id;
      const k = el.dataset.a;
      const v = parseFloat(el.value);
      commit((p) => (p.slides.find((x) => x.id === id).arrow[k] = k === 'x' || k === 'y' ? v / 100 : v), { key: `a:${id}:${k}`, scope: 'slide', ids: [id], source: 'sidebar' });
      if (k === 'size' || k === 'rot') rememberPrefs({ arrow: { [k]: v } });
    } else if (el.dataset.swc) {
      const id = cur().id;
      const circle = el.dataset.swc === 'circle';
      const v = el.value;
      commit((p) => (circle ? (p.slides.find((x) => x.id === id).circle.ring = v) : (p.slides.find((x) => x.id === id).arrow.color = v)), { key: `swc:${id}:${el.dataset.swc}`, scope: 'slide', ids: [id], source: 'sidebar' });
      rememberPrefs(circle ? { circle: { ring: v } } : { arrow: { color: v } });
    } else if (el.id === 'aStyle') {
      const id = cur().id;
      const v = el.value;
      const pr = loadOverlayPrefs().arrow;
      commit(
        (p) => {
          const a = p.slides.find((x) => x.id === id).arrow;
          if (a.style === 'off' && v !== 'off') Object.assign(a, { size: pr.size, rot: pr.rot, color: pr.color }); // saved styling, still Off until chosen
          a.style = v;
        },
        { scope: 'slide', ids: [id], source: 'sidebar' }
      );
    } else if (el.dataset.m) {
      const id = cur().id;
      const k = el.dataset.m;
      commit((p) => (p.slides.find((x) => x.id === id).media[k] = parseFloat(el.value)), { key: `m:${id}:${k}`, scope: 'slide', ids: [id], source: 'sidebar' });
    }
  });

  $('#colorReset').onclick = () => commit((p) => (p.theme.overrides = {}), { scope: 'global' });
  $('#designReset').onclick = () =>
    commit(
      (p) => {
        p.theme = { ...p.theme, palette: null, overrides: {}, texture: null, gradient: null, grad: { ...p.theme.grad, on: false } };
        p.type = { ...p.type, pairing: null, display: null, body: null, tracking: null, leading: null, weight: null, scale: 1, align: 'auto', caps: 'auto' };
        p.shape = { radius: null, pad: null, gap: null };
      },
      { scope: 'global' }
    );
  $('#tplBtn').onclick = () => hooks.openGallery();
  $('#posReset').onclick = () => {
    const id = cur().id;
    const key = ui.el;
    if (key) commit((p) => delete p.slides.find((x) => x.id === id).el[key], { scope: 'slide', ids: [id] });
  };

  // media
  const file = $('#file');
  const drop = $('#drop');
  drop.onclick = () => file.click();
  drop.onkeydown = (e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), file.click());
  file.onchange = () => {
    if (file.files[0]) setSlideImage(file.files[0]);
    file.value = '';
  };
  $('#mRemove').onclick = () => {
    const id = cur().id;
    commit((p) => (p.slides.find((x) => x.id === id).media.asset = null), { scope: 'slide', ids: [id] });
    collect();
  };
  const af = $('#avatarFile');
  $('#avatarBtn').onclick = () => af.click();
  af.onchange = () => {
    if (af.files[0]) setAvatar(af.files[0]);
    af.value = '';
  };
  $('#avatarClear').onclick = () => {
    commit((p) => (p.brand.avatar = null), { scope: 'global' });
    collect();
  };

  // circle photo
  const cf = $('#cFile');
  $('#cBtn').onclick = () => cf.click();
  cf.onchange = () => {
    if (cf.files[0]) setCircleImage(cf.files[0]);
    cf.value = '';
  };
  $('#cClear').onclick = () => {
    const id = cur().id;
    commit((p) => (p.slides.find((x) => x.id === id).circle.asset = null), { scope: 'slide', ids: [id] });
    collect();
  };
  // one-tap Paste for each image slot (async Clipboard API: works on phones, where there is no Ctrl+V)
  $('#pasteMain').onclick = () => pasteFromClipboard('main');
  $('#cPaste').onclick = () => pasteFromClipboard('circle');
  $('#avatarPaste').onclick = () => pasteFromClipboard('avatar');
  // Ctrl/Cmd+V goes to whichever slot you last touched: the Circle section, the Brand avatar, otherwise the main photo
  panels.addEventListener('focusin', (e) => {
    ui.pasteTo = e.target.closest('#circleGroup') ? 'circle' : e.target.closest('#avatarField') ? 'avatar' : 'main';
  });

  // block selector: reposition any block from the panel, even on a locked canvas
  $('#elSel').onchange = (e) => selectEl(e.target.value || null);

  // highlight selected words in a heading / subheading
  let lastHl = 'heading';
  panels.addEventListener('focusin', (e) => {
    const f = e.target.dataset && e.target.dataset.sf;
    if (f && FIELDS[f].hl) lastHl = f;
  });
  const hi = $('#hiBtn');
  hi.setAttribute('aria-live', 'polite');
  hi.addEventListener('mousedown', (e) => e.preventDefault()); // keep the text selection alive
  let hiTimer = 0;
  const hiMsg = (m) => {
    $('#hiLbl').textContent = m;
    clearTimeout(hiTimer);
    hiTimer = setTimeout(() => ($('#hiLbl').textContent = 'Highlight selected text'), 1600);
  };
  hi.onclick = () => {
    const act = document.activeElement;
    const onCanvas = act && act.isContentEditable && act.closest('#host') && act.dataset.f && FIELDS[act.dataset.f].hl;
    let field = onCanvas ? act.dataset.f : lastHl;
    let a;
    let b;
    let value;
    if (onCanvas) {
      const sel = getSelection();
      if (!sel.rangeCount || sel.isCollapsed || !act.contains(sel.anchorNode)) return hiMsg('Select some words first');
      const r = sel.getRangeAt(0);
      const pre = document.createRange();
      pre.selectNodeContents(act);
      pre.setEnd(r.startContainer, r.startOffset);
      a = pre.toString().length;
      b = a + r.toString().length;
      value = act.textContent;
    } else {
      const ta = $('#sf-' + field);
      if (!ta || ta.hidden || ta.closest('[hidden]')) field = ['heading', 'sub'].find((k) => $('#sf-' + k) && !$('#sf-' + k).closest('[hidden]'));
      const t = $('#sf-' + field);
      if (!t || t.selectionStart === t.selectionEnd) return hiMsg('Select some words first');
      [a, b, value] = [t.selectionStart, t.selectionEnd, t.value];
    }
    const out = toggleStars(value, a, b);
    if (!out) return hiMsg('Select some words first');
    const id = cur().id;
    if (onCanvas) {
      act.textContent = out.v;
      const rng = document.createRange();
      rng.setStart(act.firstChild, out.a);
      rng.setEnd(act.firstChild, out.b);
      const s2 = getSelection();
      s2.removeAllRanges();
      s2.addRange(rng);
      commit((p) => (p.slides.find((x) => x.id === id).fields[field] = out.v), { key: `f:${id}:${field}`, scope: 'slide', ids: [id], source: 'inline' });
    } else {
      const t = $('#sf-' + field);
      t.value = out.v;
      t.setSelectionRange(out.a, out.b);
      commit((p) => (p.slides.find((x) => x.id === id).fields[field] = out.v), { key: `sf:${id}:${field}`, scope: 'slide', ids: [id], source: 'sidebar' });
    }
  };

  // drag & drop and paste anywhere
  const isImg = (dt) => dt && [...dt.items].some((i) => i.kind === 'file' && i.type.startsWith('image/'));
  window.addEventListener('dragover', (e) => {
    if (!isImg(e.dataTransfer)) return;
    e.preventDefault();
    drop.classList.toggle('over', !!e.target.closest?.('#drop'));
  });
  window.addEventListener('dragleave', (e) => !e.relatedTarget && drop.classList.remove('over'));
  window.addEventListener('drop', (e) => {
    drop.classList.remove('over');
    const f = e.dataTransfer && [...e.dataTransfer.files].find((x) => x.type.startsWith('image/'));
    if (!f) return;
    e.preventDefault();
    setSlideImage(f);
    setTab('media');
  });
  window.addEventListener('paste', (e) => {
    if (e.target.closest?.('input,textarea,[contenteditable]')) return;
    const f = [...(e.clipboardData?.files || [])].find((x) => x.type.startsWith('image/'));
    if (!f) return;
    e.preventDefault();
    const [label, run] = TARGETS[ui.pasteTo] || TARGETS.main;
    run(f);
  });

  $('#projName').addEventListener('input', (e) => commit((p) => (p.name = e.target.value), { key: 'name', scope: 'meta', source: 'sidebar' }));
}

/** Wrap / unwrap the selected words in *stars*. Returns the new text and selection, or null when nothing is selected. */
export function toggleStars(v, a, b) {
  const sel = v.slice(a, b);
  if (!sel.trim()) return null;
  if (sel.includes('*')) {
    const clean = sel.replace(/\*/g, '');
    return { v: v.slice(0, a) + clean + v.slice(b), a, b: a + clean.length };
  }
  if (v[a - 1] === '*' && v[b] === '*') return { v: v.slice(0, a - 1) + sel + v.slice(b + 1), a: a - 1, b: b - 1 }; // already highlighted: unwrap
  const wrapped = sel
    .split('\n')
    .map((line) => (line.trim() ? line.replace(/^(\s*)(\S(?:.*\S)?)(\s*)$/, '$1*$2*$3') : line))
    .join('\n');
  return { v: v.slice(0, a) + wrapped + v.slice(b), a, b: a + wrapped.length };
}

export function initInspector(h) {
  hooks = { ...hooks, ...h };
  build();
  bind();
  setTab('slide');
}

export { TEMPLATES };
