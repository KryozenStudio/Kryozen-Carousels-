// Distraction-free, export-faithful swipe preview (like scrolling the carousel in Instagram).
// Slides render with the same static markup as thumbnails and exports: no selection outlines, dashed guides or lock chrome.
import { getProject, ui, selectSlide } from '../state.js';
import { RATIOS } from '../schema.js';
import { slideMarkup } from '../render.js';
import { toast } from './toast.js';

let open = null;

export function openPreview(opener) {
  if (open) return;
  const p = getProject();
  const [W, H] = RATIOS[p.ratio];
  const n = p.slides.length;
  const el = document.createElement('div');
  el.className = 'pv';
  el.setAttribute('role', 'dialog');
  el.setAttribute('aria-modal', 'true');
  el.setAttribute('aria-label', 'Swipe preview');
  el.style.setProperty('--ar', `${W} / ${H}`);
  el.innerHTML = `<div class="pv-top"><span class="pv-count" aria-live="polite"></span><button type="button" class="pv-x" aria-label="Close preview"><svg class="i"><use href="#i-x"/></svg></button></div>
    <div class="pv-track" tabindex="0" aria-label="Slides: swipe or use arrow keys">${p.slides.map((_, i) => `<div class="pv-page" role="group" aria-label="Slide ${i + 1} of ${n}"><div class="cwrap">${slideMarkup(p, i, 'static')}</div></div>`).join('')}</div>
    <button type="button" class="pv-nav pv-prev" aria-label="Previous slide"><svg class="i"><use href="#i-left"/></svg></button>
    <button type="button" class="pv-nav pv-next" aria-label="Next slide"><svg class="i"><use href="#i-right"/></svg></button>
    <div class="pv-dots" aria-hidden="true">${p.slides.map(() => '<i></i>').join('')}</div>`;
  document.body.appendChild(el);
  const track = el.querySelector('.pv-track');
  const dots = [...el.querySelectorAll('.pv-dots i')];
  const count = el.querySelector('.pv-count');
  const prev = el.querySelector('.pv-prev');
  const next = el.querySelector('.pv-next');
  let idx = ui.slide;
  let raf = 0;

  const paint = () => {
    raf = 0;
    const w = track.clientWidth || 1;
    idx = Math.max(0, Math.min(n - 1, Math.round(track.scrollLeft / w)));
    dots.forEach((d, i) => d.classList.toggle('on', i === idx));
    count.textContent = `${idx + 1} / ${n}`;
    prev.hidden = idx === 0;
    next.hidden = idx === n - 1;
  };
  const go = (i, smooth = true) => track.scrollTo({ left: Math.max(0, Math.min(n - 1, i)) * track.clientWidth, behavior: smooth ? 'smooth' : 'auto' });

  const close = () => {
    if (!open) return;
    open = null;
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('resize', onResize);
    el.classList.remove('open');
    setTimeout(() => el.remove(), 180);
    if (idx !== ui.slide) selectSlide(idx); // land the editor on the slide you stopped at
    opener && opener.isConnected && opener.focus({ preventScroll: true });
  };
  const onKey = (e) => {
    if (e.key === 'Tab') return; // keep focus handling native
    e.stopPropagation(); // nothing else (Delete, undo, ...) may fire behind the preview
    if (e.key === 'Escape') (e.preventDefault(), close());
    else if (e.key === 'ArrowRight' || e.key === 'PageDown') (e.preventDefault(), go(idx + 1));
    else if (e.key === 'ArrowLeft' || e.key === 'PageUp') (e.preventDefault(), go(idx - 1));
    else if (e.key === 'Home') (e.preventDefault(), go(0));
    else if (e.key === 'End') (e.preventDefault(), go(n - 1));
  };
  const onResize = () => go(idx, false);
  document.addEventListener('keydown', onKey, true);
  addEventListener('resize', onResize);
  track.addEventListener('scroll', () => raf || (raf = requestAnimationFrame(paint)), { passive: true });
  el.querySelector('.pv-x').onclick = close;
  prev.onclick = () => go(idx - 1);
  next.onclick = () => go(idx + 1);
  open = { close };
  requestAnimationFrame(() => {
    go(idx, false);
    paint();
    el.classList.add('open');
    track.focus({ preventScroll: true });
  });
  if (n === 1) toast('Add more slides to swipe through them', { ms: 1800 });
}
