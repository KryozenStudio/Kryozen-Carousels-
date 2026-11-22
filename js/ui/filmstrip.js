// Filmstrip: live thumbnails (same markup as the stage), tap-to-select and pointer-drag reorder.
// While dragging, only `transform` changes, so it stays on the compositor at 60fps.
import { getProject, ui, commit, selectSlide } from '../state.js';
import { RATIOS } from '../schema.js';
import { slideMarkup } from '../render.js';
import { pad2, debounce, rafThrottle, clamp } from '../util.js';

const strip = () => document.getElementById('strip');
const pending = new Set();

const flushThumbs = debounce(() => {
  const p = getProject();
  for (const id of pending) {
    const i = p.slides.findIndex((s) => s.id === id);
    const el = strip().querySelector(`[data-id="${id}"]`);
    if (i >= 0 && el) el.querySelector('.cwrap').innerHTML = slideMarkup(p, i, 'static');
  }
  pending.clear();
}, 160);

/** Refresh the thumbnails for specific slides (debounced), or all of them when ids is null. */
export function updateThumbs(ids) {
  if (!ids) getProject().slides.forEach((s) => pending.add(s.id));
  else ids.forEach((id) => pending.add(id));
  flushThumbs();
}

export function renderStrip({ rebuild = true } = {}) {
  const p = getProject();
  const el = strip();
  el.style.setProperty('--ar', RATIOS[p.ratio].join('/'));
  const sameIds = el.children.length === p.slides.length && p.slides.every((s, i) => el.children[i].dataset.id === s.id);
  if (rebuild || !sameIds) {
    const frag = document.createDocumentFragment();
    p.slides.forEach((s, i) => {
      const d = document.createElement('div');
      d.className = 'th';
      d.dataset.id = s.id;
      d.setAttribute('role', 'option');
      d.setAttribute('aria-label', `Slide ${i + 1}`);
      d.innerHTML = `<div class="cwrap">${slideMarkup(p, i, 'static')}</div><span class="n">${pad2(i + 1)}</span>`;
      frag.appendChild(d);
    });
    el.replaceChildren(frag);
    pending.clear();
  }
  markSelected();
  paintBadges();
}

/** Small corner badges (outside the slide markup, so never in exports): default slide = can't be deleted, accent lock = canvas locked. */
export function paintBadges() {
  const p = getProject();
  const el = strip();
  p.slides.forEach((s, i) => {
    const th = el.children[i];
    if (!th || th.dataset.id !== s.id) return;
    const want = (cls, on, title) => {
      let b = th.querySelector('.bd.' + cls);
      if (!on) return b && b.remove();
      if (!b) {
        b = document.createElement('span');
        b.className = 'bd ' + cls;
        b.setAttribute('role', 'img');
        b.innerHTML = '<svg class="i" aria-hidden="true"><use href="#i-lock"/></svg>';
        th.appendChild(b);
      }
      b.title = title;
      b.setAttribute('aria-label', title);
    };
    want('dflt', s.lockedDefault, 'Default slide: can’t be deleted (duplicate it for a removable copy)');
    want('cl', s.canvasLocked, 'Canvas locked');
  });
}

export function markSelected() {
  const el = strip();
  [...el.children].forEach((c, i) => {
    c.setAttribute('aria-selected', i === ui.slide ? 'true' : 'false');
    const n = c.querySelector('.n');
    if (n) n.textContent = pad2(i + 1);
  });
  const cur = el.children[ui.slide];
  if (cur) {
    const r = cur.getBoundingClientRect();
    const s = el.getBoundingClientRect();
    if (r.left < s.left + 8 || r.right > s.right - 8) el.scrollTo({ left: cur.offsetLeft - el.clientWidth / 2 + cur.offsetWidth / 2, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }
}

export function initFilmstrip() {
  const el = strip();
  let g = null; // gesture

  const reset = () => {
    if (!g) return;
    clearTimeout(g.timer);
    el.classList.remove('sorting');
    if (g.started) {
      g.el.classList.remove('lift');
      [...el.children].forEach((c) => (c.style.transform = ''));
    }
    g = null;
  };

  const begin = () => {
    if (!g || g.started) return;
    g.started = true;
    g.rects = [...el.children].map((c) => ({ l: c.offsetLeft, w: c.offsetWidth }));
    g.gap = g.rects.length > 1 ? g.rects[1].l - (g.rects[0].l + g.rects[0].w) : 10;
    g.scroll0 = el.scrollLeft;
    g.el.classList.add('lift');
    el.classList.add('sorting');
    if (navigator.vibrate && g.touch) navigator.vibrate(8);
  };

  const place = rafThrottle(() => {
    if (!g || !g.started) return;
    const dx = g.dx + (el.scrollLeft - g.scroll0);
    const me = g.rects[g.from];
    const center = me.l + me.w / 2 + dx;
    let to = g.from;
    g.rects.forEach((r, i) => {
      if (i < g.from && center < r.l + r.w / 2) to = Math.min(to, i);
      if (i > g.from && center > r.l + r.w / 2) to = Math.max(to, i);
    });
    g.to = to;
    g.el.style.transform = `translate3d(${dx}px,0,0)`;
    const shift = me.w + g.gap;
    [...el.children].forEach((c, i) => {
      if (i === g.from) return;
      let t = 0;
      if (g.from < to && i > g.from && i <= to) t = -shift;
      if (g.from > to && i < g.from && i >= to) t = shift;
      c.style.transform = t ? `translate3d(${t}px,0,0)` : '';
    });
  });

  // edge auto-scroll while dragging
  let auto = 0;
  const tick = () => {
    auto = 0;
    if (!g || !g.started) return;
    const r = el.getBoundingClientRect();
    const x = g.cx;
    const dir = x < r.left + 40 ? -1 : x > r.right - 40 ? 1 : 0;
    if (dir) {
      el.scrollLeft += dir * 10;
      place();
      auto = requestAnimationFrame(tick);
    }
  };

  el.addEventListener('pointerdown', (e) => {
    if (g || (e.pointerType === 'mouse' && e.button !== 0)) return;
    const t = e.target.closest('.th');
    if (!t) return;
    const from = [...el.children].indexOf(t);
    selectSlide(from);
    g = { id: e.pointerId, el: t, from, to: from, x: e.clientX, cx: e.clientX, dx: 0, started: false, touch: e.pointerType !== 'mouse', timer: 0 };
    if (g.touch) g.timer = setTimeout(begin, 240);
    try {
      el.setPointerCapture(e.pointerId);
    } catch {
      /* ignore */
    }
  });

  el.addEventListener('pointermove', (e) => {
    if (!g || e.pointerId !== g.id) return;
    g.cx = e.clientX;
    const dx = e.clientX - g.x;
    if (!g.started) {
      if (g.touch) {
        if (Math.abs(dx) > 10) {
          clearTimeout(g.timer); // the user is scrolling the strip, not reordering
          g = null;
        }
        return;
      }
      if (Math.abs(dx) < 5) return;
      begin();
    }
    g.dx = dx;
    place();
    if (!auto) auto = requestAnimationFrame(tick);
  });

  const end = (e) => {
    if (!g || e.pointerId !== g.id) return;
    const { started, from, to } = g;
    const cancelled = e.type !== 'pointerup';
    if (started && !cancelled && to !== from) {
      const clone = to;
      reset();
      ui.slide = clone;
      commit(
        (p) => {
          const [m] = p.slides.splice(from, 1);
          p.slides.splice(clone, 0, m);
        },
        { scope: 'structure' }
      );
    } else reset();
  };
  el.addEventListener('pointerup', end);
  el.addEventListener('pointercancel', end);
  el.addEventListener('lostpointercapture', (e) => {
    if (g && e.pointerId === g.id) reset();
  });
  window.addEventListener('blur', reset);
  // Once a long-press reorder is active, stop the browser from scrolling under the finger.
  el.addEventListener(
    'touchmove',
    (e) => {
      if (g && g.started) e.preventDefault();
    },
    { passive: false }
  );
  el.addEventListener('contextmenu', (e) => {
    if (g) e.preventDefault();
  });
  el.addEventListener('dragstart', (e) => e.preventDefault());
  el.addEventListener('wheel', (e) => {
    if (Math.abs(e.deltaY) > Math.abs(e.deltaX) && !e.ctrlKey) {
      el.scrollLeft += e.deltaY;
      e.preventDefault();
    }
  }, { passive: false });
}

export const moveSlide = (d) => {
  const from = ui.slide;
  const to = clamp(from + d, 0, getProject().slides.length - 1);
  if (to === from) return;
  ui.slide = to;
  commit(
    (p) => {
      const [m] = p.slides.splice(from, 1);
      p.slides.splice(to, 0, m);
    },
    { scope: 'structure' }
  );
};
