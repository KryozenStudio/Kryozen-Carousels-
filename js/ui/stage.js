// Live canvas: renders the current slide in edit mode, handles fit/zoom, inline text editing,
// image drag/pinch, swipe and scroll navigation. All per-frame work goes through requestAnimationFrame.
import { getProject, ui, commit, selectSlide, selectEl } from '../state.js';
import { RATIOS, FIELDS, saveOverlayPrefs } from '../schema.js';
import { slideMarkup, measureFitInfo } from '../render.js';
import { circleCenter } from '../overlays.js';
import { infoOf } from '../assets.js';
import { clamp, rafThrottle } from '../util.js';
import { toast } from './toast.js';

const stage = () => document.getElementById('stage');
const host = () => document.getElementById('host');

let zoom = 1;
let hooks = { onPickImage() {}, onZoom() {} };
let editing = false;

export const getZoom = () => zoom;

/* ---------- per-slide canvas lock ----------
   canvasLocked blocks every hand edit on the canvas (typing, dragging blocks, image / circle / arrow gestures).
   Selecting a block, stage zoom and slide navigation stay live; the inspector never checks the flag. */
const curSlide = () => getProject().slides[ui.slide];
export const isLocked = () => !!curSlide()?.canvasLocked;
let lastLockToast = 0;
export function notifyLocked() {
  const now = performance.now();
  if (now - lastLockToast < 3500) return;
  lastLockToast = now;
  toast('Canvas locked — unlock to edit by hand or use the editor panel');
}
/** Reflect the lock on the stage chrome (preview only: lives outside the slide markup, so exports never see it). */
export function paintLock() {
  const on = isLocked();
  host().classList.toggle('locked', on);
  const b = document.getElementById('lockBadge');
  if (b) b.hidden = !on;
}
/** Tell the live slide what dragging the circle moves (drives the dashed guide ring, which is preview-only). */
export function paintCircleMode() {
  const root = host().firstElementChild;
  if (root) root.dataset.cm = ui.circleMode;
}

export function layout() {
  const p = getProject();
  const st = stage();
  const [W, H] = RATIOS[p.ratio];
  const pad = st.clientWidth < 600 ? 24 : 48;
  const aw = Math.max(80, st.clientWidth - pad);
  const ah = Math.max(80, st.clientHeight - pad);
  const k = Math.min(aw / W, ah / H) * zoom;
  const h = host();
  h.style.width = Math.max(40, Math.round(W * k)) + 'px';
  h.style.height = Math.max(40, Math.round(H * k)) + 'px';
}

export function setZoom(z) {
  zoom = clamp(z, 0.4, 3);
  layout();
  hooks.onZoom(zoom);
}

export function renderStage() {
  if (editing) return false;
  const p = getProject();
  layout();
  host().innerHTML = slideMarkup(p, ui.slide, 'edit');
  prepEditable();
  markSel();
  paintCircleMode();
  paintLock();
  return true;
}

/** Update only the fit scale (used while typing so the caret never moves). */
export const refit = rafThrottle(() => {
  const root = host().firstElementChild;
  if (!root) return;
  const { fit, ow } = measureFitInfo(getProject(), ui.slide);
  root.style.setProperty('--fit', fit.toFixed(4));
  root.style.setProperty('--ow', ow ? 'anywhere' : 'normal');
});

export function blurEditing() {
  const a = document.activeElement;
  if (a && host().contains(a)) a.blur();
}

export function markSel() {
  host().querySelectorAll('[data-el].sel').forEach((e) => e.classList.remove('sel'));
  if (ui.el) host().querySelector(`[data-el="${ui.el}"]`)?.classList.add('sel');
}

function prepEditable() {
  const locked = isLocked();
  host()
    .querySelectorAll('[data-f]')
    .forEach((el) => {
      if (!locked) el.tabIndex = 0; // becomes editable on click / focus; dragging moves the block instead. Locked: not focusable at all.
      el.setAttribute('spellcheck', 'false');
      el.setAttribute('aria-label', FIELDS[el.dataset.f].label);
      el.setAttribute('enterkeyhint', FIELDS[el.dataset.f].kind === 'line' ? 'done' : 'enter');
    });
}

/* ---------- inline text editing ---------- */
function placeCaretAtEnd(el) {
  const r = document.createRange();
  r.selectNodeContents(el);
  r.collapse(false);
  const s = getSelection();
  s.removeAllRanges();
  s.addRange(r);
}

function bindInline(h) {
  h.addEventListener('focusin', (e) => {
    const el = e.target.closest?.('[data-f]');
    if (!el) return;
    if (isLocked()) {
      el.blur(); // keyboard / programmatic focus must not open inline editing on a locked canvas
      notifyLocked();
      return;
    }
    editing = true;
    if (el.contentEditable !== 'true') {
      el.contentEditable = 'true';
      el.setAttribute('role', 'textbox');
    }
    const f = el.dataset.f;
    const raw = getProject().slides[ui.slide].fields[f];
    el.style.whiteSpace = 'pre-wrap';
    if (el.textContent !== raw) {
      el.textContent = raw; // show the raw *markup* while editing
      placeCaretAtEnd(el);
    }
  });
  h.addEventListener('input', (e) => {
    const el = e.target.closest?.('[data-f]');
    if (!el) return;
    const f = el.dataset.f;
    const spec = FIELDS[f];
    let v = el.innerText.replace(/ /g, ' ');
    if (spec.kind === 'line') v = v.replace(/\s*\n+\s*/g, ' ');
    else v = v.replace(/\n{3,}/g, '\n\n');
    v = v.replace(/\n$/, '');
    if (v.length > spec.max) {
      v = v.slice(0, spec.max);
      el.textContent = v;
      placeCaretAtEnd(el);
    }
    const id = getProject().slides[ui.slide].id;
    commit((p) => (p.slides[ui.slide].fields[f] = v), { key: `f:${id}:${f}`, scope: 'slide', ids: [id], source: 'inline' });
    refit();
  });
  h.addEventListener('focusout', (e) => {
    if (!e.target.closest?.('[data-f]')) return;
    const next = e.relatedTarget && e.relatedTarget.closest && e.relatedTarget.closest('[data-f]');
    if (next && h.contains(next)) return; // focus moves to another field: keep the caret alive
    editing = false;
    renderStage();
  });
  h.addEventListener('keydown', (e) => {
    const el = e.target.closest?.('[data-f]');
    if (!el) return;
    if (e.key === 'Escape') {
      el.blur();
    } else if (e.key === 'Enter' && FIELDS[el.dataset.f].kind === 'line') {
      e.preventDefault();
      el.blur();
    }
  });
  h.addEventListener('paste', (e) => {
    const el = e.target.closest?.('[data-f]');
    if (!el) return;
    e.preventDefault();
    const text = (e.clipboardData || window.clipboardData).getData('text/plain');
    document.execCommand('insertText', false, text);
  });
  h.addEventListener('drop', (e) => {
    if (e.target.closest?.('[data-f]')) e.preventDefault();
  });
}

/* ---------- image drag / pinch / wheel ---------- */
function bindMedia(h) {
  const pts = new Map();
  let drag = null;
  let pinch = null;

  const dims = (box, m) => {
    const info = infoOf(m.asset);
    if (!info) return null;
    const bw = box.clientWidth;
    const bh = box.clientHeight;
    const s = m.fit === 'cover' ? Math.max(bw / info.w, bh / info.h) : Math.min(bw / info.w, bh / info.h);
    return { bw, bh, dw: info.w * s * m.zoom, dh: info.h * s * m.zoom };
  };

  const apply = rafThrottle(() => {
    if (!drag) return;
    const img = drag.box.querySelector('img');
    if (!img) return;
    img.style.objectPosition = `${drag.x}% ${drag.y}%`;
    img.style.transformOrigin = `${drag.x}% ${drag.y}%`;
    img.style.transform = `scale(${drag.zoom})`;
  });

  const finish = (e) => {
    if (e && pts.has(e.pointerId)) pts.delete(e.pointerId);
    if (pts.size >= 1 && pinch) {
      pinch = null;
      const [only] = pts.values();
      if (drag) Object.assign(drag, { sx: only.x, sy: only.y, bx: drag.x, by: drag.y });
      return;
    }
    if (pts.size) return;
    if (drag) {
      const d = drag;
      drag = null;
      d.box.classList.remove('dragging');
      if (d.moved) {
        const id = d.id;
        commit(
          (p) => {
            const m = p.slides.find((s) => s.id === id)?.media;
            if (m) Object.assign(m, { x: +d.x.toFixed(2), y: +d.y.toFixed(2), zoom: +d.zoom.toFixed(3) });
          },
          { key: `m:${id}:drag`, scope: 'slide', ids: [id], source: 'stage' }
        );
      } else if (d.placeholder) hooks.onPickImage();
    }
  };

  h.addEventListener('pointerdown', (e) => {
    const box = e.target.closest?.('[data-media]');
    if (!box || e.button > 0 || isLocked()) return;
    const s = getProject().slides[ui.slide];
    const ph = box.classList.contains('ph');
    if (pts.size === 0) {
      drag = { box, id: s.id, sx: e.clientX, sy: e.clientY, bx: s.media.x, by: s.media.y, x: s.media.x, y: s.media.y, zoom: s.media.zoom, moved: false, placeholder: ph };
      box.classList.add('dragging');
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      box.setPointerCapture(e.pointerId);
    } catch {
      /* pointer may already be gone */
    }
    if (pts.size === 2 && drag && !ph) {
      const [a, b] = [...pts.values()];
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, z0: drag.zoom };
    }
  });
  h.addEventListener('pointermove', (e) => {
    if (!pts.has(e.pointerId) || !drag) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      drag.zoom = clamp((pinch.z0 * Math.hypot(a.x - b.x, a.y - b.y)) / pinch.d0, 1, 4);
      drag.moved = true;
      apply();
      return;
    }
    if (pts.size > 1) return;
    const dx = e.clientX - drag.sx;
    const dy = e.clientY - drag.sy;
    if (!drag.moved && Math.hypot(dx, dy) < 4) return;
    drag.moved = true;
    if (drag.placeholder) return;
    const m = getProject().slides.find((s) => s.id === drag.id)?.media;
    const dm = m && dims(drag.box, { ...m, zoom: drag.zoom });
    if (dm) {
      const ox = dm.dw - dm.bw;
      const oy = dm.dh - dm.bh;
      if (ox > 1) drag.x = clamp(drag.bx - (dx / ox) * 100, 0, 100);
      if (oy > 1) drag.y = clamp(drag.by - (dy / oy) * 100, 0, 100);
    }
    apply();
  });
  h.addEventListener('pointerup', finish);
  h.addEventListener('pointercancel', finish);
  h.addEventListener('lostpointercapture', finish);
  window.addEventListener('blur', () => {
    pts.clear();
    pinch = null;
    finish(null);
  });

  h.addEventListener(
    'wheel',
    (e) => {
      const box = e.target.closest?.('[data-media]');
      if (!box || !(e.ctrlKey || e.metaKey) || box.classList.contains('ph') || isLocked()) return; // locked: falls through to stage zoom
      e.preventDefault();
      e.stopPropagation(); // zoom the image only, not the stage as well
      const s = getProject().slides[ui.slide];
      const z = clamp(s.media.zoom * Math.exp(-e.deltaY * 0.004), 1, 4);
      commit((p) => (p.slides[ui.slide].media.zoom = +z.toFixed(3)), { key: `m:${s.id}:zoom`, scope: 'slide', ids: [s.id], source: 'stage' });
    },
    { passive: false }
  );
}

/* ---------- swipe + scroll navigation ---------- */
function bindNav(st) {
  let t = null;
  st.addEventListener('pointerdown', (e) => {
    if (e.pointerType === 'mouse' || e.target.closest('[data-media],[data-f],[data-ov],button')) return;
    t = { id: e.pointerId, x: e.clientX, y: e.clientY };
  });
  const up = (e) => {
    if (!t || e.pointerId !== t.id) return;
    const dx = e.clientX - t.x;
    const dy = e.clientY - t.y;
    t = null;
    if (e.type === 'pointerup' && Math.abs(dx) > 56 && Math.abs(dy) < 44) selectSlide(ui.slide + (dx < 0 ? 1 : -1));
  };
  st.addEventListener('pointerup', up);
  st.addEventListener('pointercancel', up);

  let lock = 0;
  st.addEventListener(
    'wheel',
    (e) => {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        setZoom(zoom * Math.exp(-e.deltaY * 0.0025));
        return;
      }
      if (zoom > 1 || Math.abs(e.deltaX) < Math.abs(e.deltaY) * 1.4 || Math.abs(e.deltaX) < 14) return;
      e.preventDefault();
      const now = performance.now();
      if (now - lock < 260) return;
      lock = now;
      selectSlide(ui.slide + (e.deltaX > 0 ? 1 : -1));
    },
    { passive: false }
  );
}

/* ---------- drag blocks around the slide ---------- */
function bindElDrag(h) {
  let d = null;
  const uPx = () => {
    const r = h.getBoundingClientRect();
    return Math.min(r.width / 100, r.height * 0.008);
  };
  const paint = rafThrottle(() => {
    if (d) d.node.style.translate = `calc(var(--u) * ${d.x}) calc(var(--u) * ${d.y})`;
  });
  h.addEventListener('pointerdown', (e) => {
    if (e.button > 0 || editing) return;
    const node = e.target.closest?.('[data-el]');
    if (!node) {
      if (!e.target.closest('[data-media],[data-ov]')) selectEl(null), markSel();
      return;
    }
    if (document.activeElement === node && node.isContentEditable) return;
    const key = node.dataset.el;
    selectEl(key);
    markSel();
    if (isLocked()) return; // selecting is fine (it feeds the inspector); moving is not
    const cur = getProject().slides[ui.slide].el[key] || { x: 0, y: 0 };
    d = { node, key, id: getProject().slides[ui.slide].id, sx: e.clientX, sy: e.clientY, x0: cur.x, y0: cur.y, x: cur.x, y: cur.y, moved: false, pid: e.pointerId, u: uPx() };
    try {
      node.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });
  h.addEventListener('pointermove', (e) => {
    if (!d || e.pointerId !== d.pid) return;
    const dx = e.clientX - d.sx;
    const dy = e.clientY - d.sy;
    if (!d.moved && Math.hypot(dx, dy) < 5) return;
    if (!d.moved) {
      d.moved = true;
      d.node.classList.add('moving');
    }
    d.x = clamp(+(d.x0 + dx / d.u).toFixed(2), -80, 80);
    d.y = clamp(+(d.y0 + dy / d.u).toFixed(2), -80, 80);
    if (Math.abs(d.x) < 0.8) d.x = 0; // soft snap back to the layout position
    if (Math.abs(d.y) < 0.8) d.y = 0;
    paint();
  });
  const end = (e) => {
    if (!d || e.pointerId !== d.pid) return;
    const g = d;
    d = null;
    g.node.classList.remove('moving');
    if (g.moved && e.type === 'pointerup') {
      commit(
        (p) => {
          const s = p.slides.find((x) => x.id === g.id);
          if (!s) return;
          const o = s.el[g.key] || { x: 0, y: 0, a: null };
          s.el[g.key] = { ...o, x: g.x, y: g.y };
          if (!s.el[g.key].x && !s.el[g.key].y && !s.el[g.key].a) delete s.el[g.key];
        },
        { scope: 'slide', ids: [g.id], source: 'stage' }
      );
    } else if (g.moved) paint(), (g.node.style.translate = '');
    else if (g.node.dataset.f && e.type === 'pointerup') g.node.focus();
  };
  h.addEventListener('pointerup', end);
  h.addEventListener('pointercancel', end);
}

/* ---------- locked canvas: explain, don't fail silently ---------- */
function bindLockGuard(h) {
  let t = null;
  h.addEventListener(
    'pointerdown',
    (e) => {
      if (!isLocked() || e.button > 0) return;
      const hit = e.target.closest?.('[data-media],[data-f],[data-ov],[data-el]');
      if (!hit) return;
      // a plain click only counts as an attempt on things that would normally open for typing / picking
      t = { id: e.pointerId, x: e.clientX, y: e.clientY, click: !!e.target.closest('[data-f]') || !!e.target.closest('.ph') };
    },
    true
  );
  h.addEventListener('pointermove', (e) => {
    if (t && e.pointerId === t.id && Math.hypot(e.clientX - t.x, e.clientY - t.y) > 5) {
      t = null;
      notifyLocked();
    }
  });
  h.addEventListener('pointerup', (e) => {
    if (t && e.pointerId === t.id && t.click) notifyLocked();
    t = null;
  });
  h.addEventListener('pointercancel', () => (t = null));
}

/* ---------- circle photo + arrow: drag, pinch, ctrl/cmd-wheel ----------
   Per frame only compositor-friendly properties change (translate / scale on the overlay, transform on the photo);
   the real values are committed once, when the gesture ends. */
function bindOverlays(h) {
  const pts = new Map();
  let g = null;
  let pinch = null;

  const slideOf = () => getProject().slides[ui.slide];
  const hostRect = () => host().getBoundingClientRect();

  const photoDims = (box, c, zoom) => {
    const info = infoOf(c.asset);
    if (!info) return null;
    const bw = box.clientWidth;
    const bh = box.clientHeight;
    const k = Math.max(bw / info.w, bh / info.h);
    return { bw, bh, dw: info.w * k * zoom, dh: info.h * k * zoom };
  };

  const paint = rafThrottle(() => {
    if (!g) return;
    if (g.kind === 'move') g.node.style.translate = `${g.tx}px ${g.ty}px`;
    if (g.kind === 'photo') {
      const img = g.node.querySelector('img');
      if (img) {
        img.style.objectPosition = `${g.px}% ${g.py}%`;
        img.style.transformOrigin = `${g.px}% ${g.py}%`;
        img.style.transform = `scale(${g.zoom})`;
      }
    }
    if (g.scale !== 1 && g.kind !== 'photo') g.node.style.scale = String(g.scale);
  });

  const begin = (e, node) => {
    const s = slideOf();
    const which = node.dataset.ov;
    const [W, H] = RATIOS[getProject().ratio];
    const rect = hostRect();
    let kind = 'move';
    let x0 = 0;
    let y0 = 0;
    if (which === 'arrow') {
      x0 = s.arrow.x;
      y0 = s.arrow.y;
    } else {
      const c = circleCenter(s.circle, W, H);
      x0 = c.x / 100;
      y0 = c.y / 100;
      if (ui.circleMode === 'photo') kind = 'photo';
    }
    g = { node, which, kind, id: s.id, sx: e.clientX, sy: e.clientY, x0, y0, fx: x0, fy: y0, tx: 0, ty: 0, rect, moved: false, scale: 1, px: s.circle.px, py: s.circle.py, bx: s.circle.px, by: s.circle.py, zoom: s.circle.zoom, size: which === 'arrow' ? s.arrow.size : s.circle.size, c: s.circle };
    node.classList.add('moving');
  };

  const reset = () => {
    if (!g) return;
    const { node } = g;
    node.classList.remove('moving');
    node.style.translate = '';
    node.style.scale = '';
    g = null;
    pinch = null;
    pts.clear();
  };

  const commitGesture = () => {
    const d = g;
    if (!d || !d.moved) return;
    const id = d.id;
    commit(
      (p) => {
        const sl = p.slides.find((x) => x.id === id);
        if (!sl) return;
        if (d.which === 'arrow') {
          if (d.scale !== 1) sl.arrow.size = Math.round(clamp(d.size * d.scale, 120, 700));
          if (d.kind === 'move' && (d.tx || d.ty)) Object.assign(sl.arrow, { x: +d.fx.toFixed(4), y: +d.fy.toFixed(4) });
        } else if (d.kind === 'photo') {
          Object.assign(sl.circle, { px: +d.px.toFixed(2), py: +d.py.toFixed(2), zoom: +d.zoom.toFixed(3) });
        } else {
          if (d.scale !== 1) sl.circle.size = +clamp(d.size * d.scale, 15, 80).toFixed(1);
          if (d.tx || d.ty) Object.assign(sl.circle, { x: +d.fx.toFixed(4), y: +d.fy.toFixed(4) });
        }
      },
      { key: `ov:${id}:${d.which}:gesture`, scope: 'slide', ids: [id], source: 'stage' }
    );
    const after = slideOf();
    if (d.which === 'arrow') saveOverlayPrefs({ arrow: { size: after.arrow.size } });
    else saveOverlayPrefs({ circle: { size: after.circle.size, zoom: after.circle.zoom } });
  };

  const finish = (e) => {
    if (!g) return;
    if (e && pts.has(e.pointerId)) pts.delete(e.pointerId);
    if (pts.size >= 1 && pinch) {
      // one finger lifted mid-pinch: keep going as a drag from the current position
      pinch = null;
      const [only] = pts.values();
      Object.assign(g, { sx: only.x, sy: only.y, x0: g.fx, y0: g.fy, bx: g.px, by: g.py, tx: 0, ty: 0 });
      return;
    }
    if (pts.size) return;
    const cancelled = e && e.type === 'pointercancel';
    if (!cancelled) commitGesture();
    reset();
  };

  h.addEventListener('pointerdown', (e) => {
    const node = e.target.closest?.('[data-ov]');
    if (!node || e.button > 0 || isLocked()) return;
    if (!g) begin(e, node);
    else if (g.node !== node) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    try {
      node.setPointerCapture(e.pointerId);
    } catch {
      /* pointer may already be gone */
    }
    e.preventDefault();
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      pinch = { d0: Math.hypot(a.x - b.x, a.y - b.y) || 1, zoom0: g.zoom, size0: g.size };
    }
  });

  h.addEventListener('pointermove', (e) => {
    if (!g || !pts.has(e.pointerId)) return;
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pinch && pts.size >= 2) {
      const [a, b] = [...pts.values()];
      const k = Math.hypot(a.x - b.x, a.y - b.y) / pinch.d0;
      g.moved = true;
      if (g.which !== 'arrow' && g.kind === 'photo') g.zoom = clamp(pinch.zoom0 * k, 1, 4);
      else {
        const [lo, hi] = g.which === 'arrow' ? [120, 700] : [15, 80];
        g.scale = clamp(pinch.size0 * k, lo, hi) / pinch.size0;
      }
      paint();
      return;
    }
    if (pts.size > 1) return;
    const dx = e.clientX - g.sx;
    const dy = e.clientY - g.sy;
    if (!g.moved && Math.hypot(dx, dy) < 4) return;
    g.moved = true;
    if (g.kind === 'photo') {
      const dm = photoDims(g.node.querySelector('.cir-p') || g.node, g.c, g.zoom);
      if (dm) {
        const ox = dm.dw - dm.bw;
        const oy = dm.dh - dm.bh;
        if (ox > 1) g.px = clamp(g.bx - (dx / ox) * 100, 0, 100);
        if (oy > 1) g.py = clamp(g.by - (dy / oy) * 100, 0, 100);
      }
    } else {
      g.fx = clamp(g.x0 + dx / g.rect.width, -0.2, 1.2);
      g.fy = clamp(g.y0 + dy / g.rect.height, -0.2, 1.2);
      g.tx = (g.fx - g.x0) * g.rect.width;
      g.ty = (g.fy - g.y0) * g.rect.height;
    }
    paint();
  });

  h.addEventListener('pointerup', finish);
  h.addEventListener('pointercancel', finish);
  h.addEventListener('lostpointercapture', (e) => {
    if (g && pts.has(e.pointerId)) finish(e);
  });
  window.addEventListener('blur', () => {
    if (g) reset();
  });

  // ctrl/cmd + wheel over an overlay: circle size / photo zoom / arrow size (locked slides fall through to stage zoom)
  h.addEventListener(
    'wheel',
    (e) => {
      const node = e.target.closest?.('[data-ov]');
      if (!node || !(e.ctrlKey || e.metaKey) || isLocked()) return;
      e.preventDefault();
      e.stopPropagation();
      const s = slideOf();
      const f = Math.exp(-e.deltaY * 0.004);
      const id = s.id;
      if (node.dataset.ov === 'arrow') {
        const v = Math.round(clamp(s.arrow.size * f, 120, 700));
        commit((p) => (p.slides.find((x) => x.id === id).arrow.size = v), { key: `ov:${id}:arrow:size`, scope: 'slide', ids: [id], source: 'stage' });
        saveOverlayPrefs({ arrow: { size: v } });
      } else if (ui.circleMode === 'photo') {
        const v = +clamp(s.circle.zoom * f, 1, 4).toFixed(3);
        commit((p) => (p.slides.find((x) => x.id === id).circle.zoom = v), { key: `ov:${id}:circle:zoom`, scope: 'slide', ids: [id], source: 'stage' });
        saveOverlayPrefs({ circle: { zoom: v } });
      } else {
        const v = +clamp(s.circle.size * f, 15, 80).toFixed(1);
        commit((p) => (p.slides.find((x) => x.id === id).circle.size = v), { key: `ov:${id}:circle:size`, scope: 'slide', ids: [id], source: 'stage' });
        saveOverlayPrefs({ circle: { size: v } });
      }
    },
    { passive: false }
  );
}

export function initStage(h) {
  hooks = { ...hooks, ...h };
  bindInline(host());
  bindMedia(host());
  bindElDrag(host());
  bindOverlays(host());
  bindLockGuard(host());
  bindNav(stage());
  if (window.ResizeObserver) new ResizeObserver(() => layout()).observe(stage());
  else window.addEventListener('resize', layout);
}
