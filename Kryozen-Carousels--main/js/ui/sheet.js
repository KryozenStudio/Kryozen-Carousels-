// One reusable overlay: a dark bottom sheet on phones / coarse pointers, an anchored popover on desktop.
// Only transform + opacity animate. Esc / backdrop / swipe-down close it, and focus returns to whatever opened it.
const mq = window.matchMedia('(max-width: 860px), (pointer: coarse)');
export const isSheetMode = () => mq.matches;

let current = null;

export function closeSheet(immediate = false) {
  if (current) current.close(immediate);
}
export const sheetOpen = () => !!current;

/**
 * openSheet({ title, anchor, build(body, api) -> focusEl?, onClose, width, className })
 * `anchor` is the element that opened it (popover placement + focus return).
 */
export function openSheet({ title = '', anchor = null, build, onClose, width = 288, className = '' }) {
  closeSheet(true);
  const sheetMode = isSheetMode();
  const opener = anchor || document.activeElement;
  const layer = document.createElement('div');
  layer.className = `sheet-layer ${sheetMode ? 'is-sheet' : 'is-pop'} ${className}`;
  layer.innerHTML = `<div class="sheet-bd"></div>
    <div class="sheet" role="dialog" aria-modal="true" aria-label="${title.replace(/"/g, '&quot;')}">
      <div class="sheet-grab" aria-hidden="true"><i></i></div>
      <div class="sheet-head"><h2>${title}</h2><button type="button" class="sheet-x" aria-label="Close"><svg class="i"><use href="#i-x"/></svg></button></div>
      <div class="sheet-body"></div>
    </div>`;
  document.body.appendChild(layer);
  const panel = layer.querySelector('.sheet');
  const body = layer.querySelector('.sheet-body');
  let closed = false;
  let removeT = 0;

  const api = {
    el: panel,
    body,
    close: (imm) => close(imm),
  };

  const place = () => {
    if (sheetMode || !anchor) return;
    const r = anchor.getBoundingClientRect();
    const vw = innerWidth;
    const vh = innerHeight;
    const w = Math.min(width, vw - 16);
    panel.style.width = w + 'px';
    const ph = Math.min(panel.offsetHeight, vh - 16);
    const below = vh - r.bottom - 8;
    const above = r.top - 8;
    const down = below >= Math.min(ph, 280) || below >= above;
    const room = Math.max(160, down ? below : above);
    panel.style.maxHeight = Math.min(room, vh - 16) + 'px';
    const h = Math.min(panel.offsetHeight, room);
    let left = r.left + r.width / 2 - w / 2;
    left = Math.max(8, Math.min(left, vw - w - 8));
    const top = down ? Math.min(r.bottom + 6, vh - h - 8) : Math.max(8, r.top - 6 - h);
    panel.style.left = left + 'px';
    panel.style.top = top + 'px';
    panel.style.transformOrigin = `${Math.round(r.left + r.width / 2 - left)}px ${down ? '0' : '100%'}`;
  };

  function close(immediate) {
    if (closed) return;
    closed = true;
    current = null;
    document.removeEventListener('keydown', onKey, true);
    removeEventListener('resize', place);
    const done = () => {
      layer.remove();
      onClose && onClose();
      if (opener && opener.isConnected && typeof opener.focus === 'function') opener.focus({ preventScroll: true });
    };
    if (immediate) return done();
    layer.classList.remove('open');
    panel.style.transform = '';
    removeT = setTimeout(done, 200);
    panel.addEventListener('transitionend', () => (clearTimeout(removeT), done()), { once: true });
  }
  const onKey = (e) => {
    if (e.key === 'Escape') {
      e.preventDefault();
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      const f = [...panel.querySelectorAll('button:not([disabled]),input:not([disabled]),[tabindex="0"]')].filter((x) => x.offsetParent);
      if (!f.length) return;
      const a = document.activeElement;
      if (e.shiftKey && (a === f[0] || !panel.contains(a))) (e.preventDefault(), f[f.length - 1].focus());
      else if (!e.shiftKey && (a === f[f.length - 1] || !panel.contains(a))) (e.preventDefault(), f[0].focus());
    }
  };
  document.addEventListener('keydown', onKey, true);
  addEventListener('resize', place);
  layer.querySelector('.sheet-bd').addEventListener('pointerdown', () => close());
  layer.querySelector('.sheet-x').addEventListener('click', () => close());

  const focusEl = build(body, api);
  place();
  requestAnimationFrame(() => {
    place();
    layer.classList.add('open');
    (focusEl || layer.querySelector('.sheet-x')).focus?.({ preventScroll: true });
  });

  // swipe down on the grab handle / header to dismiss (phones)
  if (sheetMode) {
    const grip = panel.querySelectorAll('.sheet-grab,.sheet-head');
    let sy = 0;
    let dy = 0;
    let t0 = 0;
    let drag = false;
    let raf = 0;
    const paint = () => ((raf = 0), (panel.style.transform = `translateY(${dy}px)`));
    grip.forEach((g) => {
      g.addEventListener('pointerdown', (e) => {
        if (e.target.closest('.sheet-x')) return;
        drag = true;
        sy = e.clientY;
        dy = 0;
        t0 = performance.now();
        g.setPointerCapture(e.pointerId);
        panel.style.transition = 'none';
      });
      g.addEventListener('pointermove', (e) => {
        if (!drag) return;
        dy = Math.max(0, e.clientY - sy);
        if (!raf) raf = requestAnimationFrame(paint);
      });
      const end = () => {
        if (!drag) return;
        drag = false;
        panel.style.transition = '';
        const v = dy / Math.max(1, performance.now() - t0);
        if (dy > 90 || v > 0.6) close();
        else panel.style.transform = '';
      };
      g.addEventListener('pointerup', end);
      g.addEventListener('pointercancel', end);
    });
  }

  current = api;
  return api;
}
