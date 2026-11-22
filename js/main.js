// Boot + wiring. Owns the render scheduler: every state change funnels through one rAF-coalesced flush.
import * as S from './state.js';
import { RATIOS, KINDS, PRESETS, newSlide, assetIdsOf, VERSION } from './schema.js';
import { TEMPLATES } from './templates/index.js';
import { injectStyles, ensureFonts, usedFamilies, invalidateFit, resolve } from './render.js';
import * as A from './assets.js';
import { exportPNG, exportZIP, exportPDF, disposeStage } from './export.js';
import { initStage, renderStage, refit, setZoom, getZoom, layout, blurEditing, markSel } from './ui/stage.js';
import { initFilmstrip, renderStrip, markSelected, updateThumbs, moveSlide, paintBadges } from './ui/filmstrip.js';
import { initInspector, syncInspector, setTab, pickImage } from './ui/inspector.js';
import { initGallery, openGallery } from './ui/gallery.js';
import { toast } from './ui/toast.js';
import { $, $$, download, slug, uid } from './util.js';

const MAX_SLIDES = 40;
const { getProject: P, ui } = S;

/* ---------- fonts: re-measure once the real faces are in ---------- */
const fontsSeen = new Set();
function ensureFontsFor(p) {
  const r = resolve(p);
  const key = usedFamilies(p).join('|') + r.weight;
  if (fontsSeen.has(key)) return;
  fontsSeen.add(key);
  ensureFonts(p)
    .catch(() => {})
    .then(() => {
      invalidateFit();
      need.stage = true;
      need.strip = 'all';
      schedule();
    });
}

/* ---------- chrome ---------- */
function updateChrome() {
  const p = P();
  $('#undo').disabled = !S.canUndo();
  $('#redo').disabled = !S.canRedo();
  const nm = $('#projName');
  if (nm !== document.activeElement && nm.value !== p.name) nm.value = p.name;
  $$('#ratioSeg button').forEach((b) => b.setAttribute('aria-checked', b.dataset.ratio === p.ratio ? 'true' : 'false'));
  $('#count').textContent = `Slide ${ui.slide + 1} of ${p.slides.length}`;
  $('#prev').disabled = ui.slide === 0;
  $('#next').disabled = ui.slide === p.slides.length - 1;
  const cs = p.slides[ui.slide];
  const del = $('#delBtn');
  del.disabled = p.slides.length <= 1;
  // starter slides stay put: aria-disabled keeps the button focusable so a click can explain why
  del.setAttribute('aria-disabled', cs.lockedDefault ? 'true' : 'false');
  del.title = cs.lockedDefault ? 'Default slide is locked — duplicate it to create a removable copy' : 'Delete (Del)';
  del.setAttribute('aria-label', cs.lockedDefault ? 'Delete slide (unavailable: default slide is locked)' : 'Delete slide');
  $('#dupBtn').disabled = p.slides.length >= MAX_SLIDES;
  const lk = $('#lockCanvasBtn');
  const on = !!cs.canvasLocked;
  lk.setAttribute('aria-pressed', on ? 'true' : 'false');
  const lkText = on ? 'Unlock canvas hand-editing' : 'Lock canvas hand-editing';
  lk.title = lkText;
  lk.setAttribute('aria-label', lkText);
  lk.querySelector('use').setAttribute('href', on ? '#i-lock' : '#i-unlock');
  paintBadges();
  const z = getZoom();
  $('#zFit').textContent = z === 1 ? 'Fit' : Math.round(z * 100) + '%';
  document.title = `${p.name || 'Untitled'} · Carousel Studio`;
}

/* ---------- render scheduler ---------- */
const need = { stage: false, strip: null, thumbs: null, inspector: false, chrome: true };
let raf = 0;
function schedule() {
  if (raf) return;
  raf = requestAnimationFrame(() => {
    raf = 0;
    if (need.stage) renderStage();
    if (need.strip === 'rebuild') renderStrip({ rebuild: true });
    else if (need.strip === 'all') updateThumbs(null);
    else if (need.thumbs) updateThumbs([...need.thumbs]);
    if (need.inspector) syncInspector();
    if (need.chrome) updateChrome();
    need.stage = false;
    need.strip = null;
    need.thumbs = null;
    need.inspector = false;
    need.chrome = false;
  });
}

S.subscribe((p, meta) => {
  ensureFontsFor(p);
  need.chrome = true;
  need.inspector = true;
  switch (meta.scope) {
    case 'select':
      need.stage = true;
      markSelected();
      break;
    case 'sel':
      markSel();
      break;
    case 'slide':
      if (meta.source === 'inline') {
        need.thumbs = (need.thumbs || new Set()).add(meta.ids[0]);
        refit();
      } else {
        need.stage = true;
        need.thumbs = new Set([...(need.thumbs || []), ...(meta.ids || [])]);
      }
      break;
    case 'meta':
      need.inspector = false;
      break;
    case 'structure':
      need.stage = true;
      need.strip = 'rebuild';
      break;
    default:
      need.stage = true;
      if (need.strip !== 'rebuild') need.strip = 'all';
  }
  schedule();
});
S.setSaveErrorHandler(() => toast('Autosave failed (storage full or blocked). Export the project as JSON to keep your work.', { ms: 8000 }));

/* ---------- slide actions ---------- */
function addSlide(kind) {
  if (P().slides.length >= MAX_SLIDES) return toast(`Limit of ${MAX_SLIDES} slides reached.`);
  blurEditing();
  const at = ui.slide + 1;
  ui.slide = at;
  S.commit((p) => p.slides.splice(at, 0, newSlide(kind, PRESETS[kind])), { scope: 'structure' });
}
function duplicate() {
  if (P().slides.length >= MAX_SLIDES) return toast(`Limit of ${MAX_SLIDES} slides reached.`);
  blurEditing();
  const at = ui.slide + 1;
  const src = ui.slide;
  ui.slide = at;
  S.commit(
    (p) => {
      const c = structuredClone(p.slides[src]);
      c.id = uid();
      c.lockedDefault = false; // a copy of a starter slide can always be deleted
      p.slides.splice(at, 0, c);
    },
    { scope: 'structure' }
  );
}
function remove() {
  const p = P();
  if (p.slides[ui.slide].lockedDefault) return toast('Default slide is locked — duplicate it to create a removable copy.');
  if (p.slides.length <= 1) return toast('A carousel needs at least one slide.');
  blurEditing();
  const at = ui.slide;
  S.commit((d) => d.slides.splice(at, 1), { scope: 'structure' });
  A.gc(S.historyAssetIds());
  toast('Slide deleted', { action: 'Undo', onAction: doUndo });
}
function toggleLock() {
  blurEditing();
  const sl = P().slides[ui.slide];
  const id = sl.id;
  const next = !sl.canvasLocked;
  S.commit((p) => (p.slides.find((x) => x.id === id).canvasLocked = next), { scope: 'slide', ids: [id] });
  const b = $('#lockCanvasBtn');
  b.classList.remove('pop');
  void b.offsetWidth; // restart the tiny press animation
  b.classList.add('pop');
  toast(next ? 'Canvas locked' : 'Canvas unlocked', { ms: 1800 });
}
const doUndo = () => {
  blurEditing();
  S.undo();
};
const doRedo = () => {
  blurEditing();
  S.redo();
};

/* ---------- popovers ---------- */
let openPop = null;
function closePop() {
  if (!openPop) return;
  openPop.el.hidden = true;
  openPop.btn.setAttribute('aria-expanded', 'false');
  openPop = null;
}
function showPop(el, btn, above) {
  closePop();
  el.hidden = false;
  const r = btn.getBoundingClientRect();
  const w = el.offsetWidth;
  const h = el.offsetHeight;
  const left = Math.max(8, Math.min(innerWidth - w - 8, r.right - w + (above ? w - r.width : 0)));
  const top = above && r.top - h - 8 > 8 ? r.top - h - 6 : Math.min(innerHeight - h - 8, r.bottom + 6);
  el.style.left = (above ? Math.max(8, Math.min(innerWidth - w - 8, r.left)) : left) + 'px';
  el.style.top = Math.max(8, top) + 'px';
  el.style.setProperty('--oy', top < r.top ? '100%' : '0%');
  btn.setAttribute('aria-expanded', 'true');
  openPop = { el, btn };
  el.querySelector('button')?.focus();
}
document.addEventListener('pointerdown', (e) => {
  if (openPop && !openPop.el.contains(e.target) && !openPop.btn.contains(e.target)) closePop();
});
document.addEventListener('keydown', (e) => {
  if (!openPop) return;
  if (e.key === 'Escape') {
    const b = openPop.btn;
    closePop();
    b.focus();
  } else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
    const items = $$('button', openPop.el);
    const i = items.indexOf(document.activeElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : items.length - 1)) % items.length].focus();
    e.preventDefault();
  }
});

/* ---------- project JSON ---------- */
async function exportJSON() {
  const p = P();
  try {
    const assets = await A.exportAssets(assetIdsOf(p));
    const blob = new Blob([JSON.stringify({ app: 'carousel-studio', v: VERSION, project: p, assets })], { type: 'application/json' });
    download(blob, `${slug(p.name)}.carousel.json`);
  } catch {
    toast('Could not export the project.');
  }
}
async function importJSON(file) {
  if (!file) return;
  if (file.size > 120 * 1024 * 1024) return toast('That file is too large to be a project.');
  let data;
  try {
    data = JSON.parse(await file.text());
  } catch {
    return toast('That file is not valid JSON.');
  }
  const proj = data && data.app === 'carousel-studio' ? data.project : data && data.slides ? data : null;
  if (!proj) return toast('That file is not a Carousel Studio project.');
  blurEditing();
  await A.importAssets(data.assets);
  S.replaceProject(proj, { keepHistory: true });
  await healAssets();
  A.gc(S.historyAssetIds());
  toast('Project imported', { action: 'Undo', onAction: doUndo });
}
/** Load every image the project references; clear references that cannot be restored. */
async function healAssets() {
  const p = P();
  const missing = await A.loadMany(assetIdsOf(p));
  if (!missing.length) return;
  const gone = new Set(missing);
  S.commit(
    (d) => {
      if (gone.has(d.brand.avatar)) d.brand.avatar = null;
      d.slides.forEach((s) => {
        if (gone.has(s.media.asset)) s.media.asset = null;
        if (s.circle && gone.has(s.circle.asset)) s.circle.asset = null;
      });
    },
    { scope: 'structure', silent: true }
  );
  toast(`${missing.length} image${missing.length > 1 ? 's' : ''} could not be restored.`);
}

/* ---------- export dialog ---------- */
const exp = { fmt: 'png', scale: 2, busy: false, ctl: null };
function paintExport() {
  const [W, H] = RATIOS[P().ratio];
  $$('#expFmt button').forEach((b) => b.setAttribute('aria-checked', b.dataset.v === exp.fmt ? 'true' : 'false'));
  $$('#expScale button').forEach((b) => b.setAttribute('aria-checked', b.dataset.v === String(exp.scale) ? 'true' : 'false'));
  $$('[data-px]').forEach((s) => (s.textContent = `${W * s.dataset.px}×${H * s.dataset.px}`));
}
function openExport() {
  blurEditing();
  S.flushSave();
  const d = $('#exportDlg');
  $('#expProg').hidden = true;
  $('#expErr').hidden = true;
  exp.busy = false;
  $('#expGo').disabled = false;
  paintExport();
  if (!d.open) d.showModal();
}
async function runExport() {
  const p = P();
  exp.busy = true;
  exp.ctl = new AbortController();
  $('#expGo').disabled = true;
  $('#expErr').hidden = true;
  $('#expProg').hidden = false;
  const prog = (v, msg) => {
    $('#expBar').parentElement.style.setProperty('--p', v);
    $('#expBar').style.setProperty('--p', v);
    $('#expMsg').textContent = msg;
  };
  try {
    if (exp.fmt === 'png') await exportPNG(p, ui.slide, exp.scale, prog);
    else if (exp.fmt === 'zip') await exportZIP(p, exp.scale, prog, exp.ctl.signal);
    else await exportPDF(p, exp.scale, prog, exp.ctl.signal);
    $('#exportDlg').close();
    toast('Export ready');
  } catch (e) {
    if (e.name === 'AbortError') $('#expMsg').textContent = 'Cancelled';
    else {
      $('#expErr').textContent = e.message || 'Export failed.';
      $('#expErr').hidden = false;
    }
  } finally {
    exp.busy = false;
    $('#expGo').disabled = false;
    disposeStage();
  }
}

/* ---------- keyboard ---------- */
document.addEventListener('keydown', (e) => {
  if (document.querySelector('dialog[open]')) return;
  const t = e.target;
  const typing = !!t.closest?.('textarea,[contenteditable],input[type=text],input[type=search]');
  const formish = typing || !!t.closest?.('input,select');
  const mod = e.ctrlKey || e.metaKey;
  const k = e.key.toLowerCase();
  if (mod && k === 'z') {
    if (typing) return;
    e.preventDefault();
    e.shiftKey ? doRedo() : doUndo();
  } else if (mod && k === 'y') {
    if (typing) return;
    e.preventDefault();
    doRedo();
  } else if (mod && k === 'd') {
    e.preventDefault();
    duplicate();
  } else if (mod && k === 'e') {
    e.preventDefault();
    openExport();
  } else if (mod && (k === '=' || k === '+')) {
    e.preventDefault();
    setZoom(getZoom() * 1.2);
    need.chrome = true;
    schedule();
  } else if (mod && k === '-') {
    e.preventDefault();
    setZoom(getZoom() / 1.2);
    need.chrome = true;
    schedule();
  } else if (mod && k === '0') {
    e.preventDefault();
    setZoom(1);
    need.chrome = true;
    schedule();
  } else if (!mod && !formish) {
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      e.altKey ? moveSlide(-1) : S.selectSlide(ui.slide - 1);
    } else if (e.key === 'ArrowRight') {
      e.preventDefault();
      e.altKey ? moveSlide(1) : S.selectSlide(ui.slide + 1);
    } else if (e.key === 'Delete' || e.key === 'Backspace') {
      if (t.closest('button,a')) return;
      e.preventDefault();
      remove();
    } else if (k === 'l') {
      e.preventDefault();
      toggleLock();
    } else if (k === 't') {
      e.preventDefault();
      openGallery();
    } else if (e.key === '?') {
      $('#helpDlg').showModal();
    }
  }
});

/* ---------- wiring ---------- */
function wire() {
  $('#undo').onclick = doUndo;
  $('#redo').onclick = doRedo;
  $('#openGallery').onclick = openGallery;
  $('#exportBtn').onclick = openExport;
  $('#prev').onclick = () => S.selectSlide(ui.slide - 1);
  $('#next').onclick = () => S.selectSlide(ui.slide + 1);
  $('#dupBtn').onclick = duplicate;
  $('#delBtn').onclick = remove;
  $('#lockCanvasBtn').onclick = toggleLock;
  $('#lockBadge').onclick = toggleLock;
  $('#mvL').onclick = () => moveSlide(-1);
  $('#mvR').onclick = () => moveSlide(1);
  const zoomTo = (z) => {
    setZoom(z);
    need.chrome = true;
    schedule();
  };
  $('#zIn').onclick = () => zoomTo(getZoom() * 1.2);
  $('#zOut').onclick = () => zoomTo(getZoom() / 1.2);
  $('#zFit').onclick = () => zoomTo(1);

  $('#ratioSeg').addEventListener('click', (e) => {
    const b = e.target.closest('[data-ratio]');
    if (b) {
      zoomTo(1);
      S.commit((p) => (p.ratio = b.dataset.ratio), { scope: 'structure' });
    }
  });

  // add-slide menu
  const am = $('#addMenu');
  am.innerHTML = Object.entries(KINDS)
    .map(([k, v]) => `<button role="menuitem" data-add="${k}"><svg class="i"><use href="#i-plus"/></svg>${v.label}</button>`)
    .join('');
  $('#addBtn').onclick = () => (openPop && openPop.el === am ? closePop() : showPop(am, $('#addBtn'), true));
  am.addEventListener('click', (e) => {
    const b = e.target.closest('[data-add]');
    if (!b) return;
    closePop();
    addSlide(b.dataset.add);
  });

  // project menu
  const pm = $('#projMenu');
  $('#menuBtn').onclick = () => (openPop && openPop.el === pm ? closePop() : showPop(pm, $('#menuBtn'), false));
  pm.addEventListener('click', (e) => {
    const b = e.target.closest('[data-act]');
    if (!b) return;
    closePop();
    const a = b.dataset.act;
    if (a === 'export-json') exportJSON();
    else if (a === 'import-json') $('#importFile').click();
    else if (a === 'help') $('#helpDlg').showModal();
    else if (a === 'reset') $('#confirmDlg').showModal();
  });
  $('#importFile').onchange = (e) => {
    importJSON(e.target.files[0]);
    e.target.value = '';
  };
  $('#cfGo').onclick = () => {
    $('#confirmDlg').close();
    blurEditing();
    S.resetProject();
    A.gc(S.historyAssetIds());
    toast('Project reset', { action: 'Undo', onAction: doUndo });
  };

  // dialogs
  $$('dialog').forEach((d) => {
    d.addEventListener('click', (e) => e.target === d && !exp.busy && d.close());
    $$('[data-close]', d).forEach((b) => (b.onclick = () => d.close()));
  });
  $('#exportDlg').addEventListener('close', () => exp.ctl && exp.busy && exp.ctl.abort());
  $('#expFmt').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && !exp.busy) ((exp.fmt = b.dataset.v), paintExport());
  });
  $('#expScale').addEventListener('click', (e) => {
    const b = e.target.closest('button');
    if (b && !exp.busy) ((exp.scale = +b.dataset.v), paintExport());
  });
  $('#expGo').onclick = runExport;
  $('#expCancel').onclick = () => {
    if (exp.busy) exp.ctl.abort();
    else $('#exportDlg').close();
  };
}

/* ---------- boot ---------- */
async function boot() {
  injectStyles();
  S.setTemplateIds(Object.keys(TEMPLATES));
  const restored = S.loadSaved();
  try {
    await healAssets();
  } catch {
    /* storage unavailable: project still opens */
  }
  A.prune(assetIdsOf(P()));
  try {
    await ensureFonts(P());
  } catch {
    /* fonts fall back gracefully */
  }
  fontsSeen.add(usedFamilies(P()).join('|') + resolve(P()).weight);

  initStage({ onPickImage: pickImage, onZoom: () => ((need.chrome = true), schedule()) });
  initFilmstrip();
  initInspector({ openGallery });
  initGallery();
  wire();
  layout();
  renderStage();
  renderStrip({ rebuild: true });
  syncInspector();
  updateChrome();
  $('#app').classList.add('ready');
  if (!restored) toast('Welcome! Pick a template or just start typing on the slide.', { ms: 5000 });

  if (new URLSearchParams(location.search).has('debug')) window.__cs = { S, A, P, ui, setTab, openExport, runExport, exp, addSlide, duplicate, remove, doUndo, doRedo };
}
boot();
