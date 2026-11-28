// Studio-styled replacements for the browser's raw controls:
//  - <select>            -> custom Select (bottom sheet on phones, anchored popover on desktop)
//  - <input type=color>  -> custom Colour picker (2D saturation/brightness pad, hue, hex, swatches)
//  - checkboxes          -> switches (CSS + role="switch")
// The native elements stay in the DOM as the state holders so the existing inspector wiring keeps working; they are visually hidden.
import { openSheet, isSheetMode } from './sheet.js';
import { FONTS, fontStack } from '../schema.js';
import { clamp, normHex, rafThrottle } from '../util.js';

const CHECK = '<svg class="i chk" aria-hidden="true"><use href="#i-check"/></svg>';
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);

/* ---------- generic option list ---------- */
/** items: [{ value, label, sub?, group?, font? }] */
export function openOptions({ title, anchor, items, value, onPick, width = 260 }) {
  return openSheet({
    title,
    anchor,
    width,
    className: 'opts',
    build(body, api) {
      const list = document.createElement('div');
      list.className = 'opt-list';
      list.setAttribute('role', 'listbox');
      list.setAttribute('aria-label', title);
      let group = null;
      let html = '';
      for (const it of items) {
        if (it.group && it.group !== group) {
          group = it.group;
          html += `<div class="opt-group" role="presentation">${esc(group)}</div>`;
        }
        const on = String(it.value) === String(value);
        html += `<button type="button" class="opt" role="option" aria-selected="${on}" data-v="${esc(it.value)}" tabindex="${on ? 0 : -1}"${it.font ? ` style="font-family:${esc(fontStack(it.font))}"` : ''}><span class="opt-l">${esc(it.label)}${it.sub ? `<small>${esc(it.sub)}</small>` : ''}</span>${CHECK}</button>`;
      }
      list.innerHTML = html;
      body.appendChild(list);
      const opts = () => [...list.querySelectorAll('.opt')];
      const pick = (b) => {
        api.close();
        onPick(b.dataset.v);
      };
      list.addEventListener('click', (e) => {
        const b = e.target.closest('.opt');
        if (b) pick(b);
      });
      list.addEventListener('keydown', (e) => {
        const o = opts();
        const i = o.indexOf(document.activeElement);
        let n = -1;
        if (e.key === 'ArrowDown') n = Math.min(o.length - 1, i + 1);
        else if (e.key === 'ArrowUp') n = Math.max(0, i - 1);
        else if (e.key === 'Home') n = 0;
        else if (e.key === 'End') n = o.length - 1;
        else if (e.key === 'Enter' || e.key === ' ') {
          if (i >= 0) (e.preventDefault(), pick(o[i]));
          return;
        } else return;
        e.preventDefault();
        o.forEach((x) => (x.tabIndex = -1));
        o[n].tabIndex = 0;
        o[n].focus();
      });
      const sel = opts().find((b) => b.getAttribute('aria-selected') === 'true') || opts()[0];
      if (sel) {
        sel.tabIndex = 0;
        setTimeout(() => sel.scrollIntoView({ block: 'center' }), 0);
      }
      if (items.some((i) => i.font)) {
        // make sure every bundled face is loaded so each row previews its real typeface
        items.forEach((i) => i.font && FONTS[i.font] && document.fonts && document.fonts.load(`16px "${i.font}"`).catch(() => {}));
      }
      return sel;
    },
  });
}

/* ---------- <select> enhancement ---------- */
const selects = [];
let uid = 0;

function itemsOf(sel) {
  const out = [];
  for (const n of sel.children) {
    if (n.tagName === 'OPTGROUP') for (const o of n.children) out.push({ value: o.value, label: o.textContent, group: n.label });
    else if (n.tagName === 'OPTION' && (n.value !== '' || sel.hasAttribute('data-allow-empty'))) out.push({ value: n.value, label: n.textContent });
  }
  return out;
}

function enhanceSelect(sel) {
  if (sel.dataset.enhanced) return;
  sel.dataset.enhanced = '1';
  const id = sel.id || 'sel' + ++uid;
  const label = document.querySelector(`label[for="${sel.id}"]`);
  const title = (label && label.textContent.trim()) || sel.getAttribute('aria-label') || 'Choose';
  const btn = document.createElement('button');
  btn.type = 'button';
  btn.className = 'sel-btn';
  btn.id = id + '-btn';
  btn.setAttribute('aria-haspopup', 'listbox');
  btn.setAttribute('aria-expanded', 'false');
  btn.innerHTML = '<span class="sel-v"></span><svg class="i" aria-hidden="true"><use href="#i-chev"/></svg>';
  sel.after(btn);
  sel.classList.add('sel-native');
  sel.tabIndex = -1;
  sel.setAttribute('aria-hidden', 'true');
  if (label) label.htmlFor = btn.id;
  btn.addEventListener('click', () => {
    btn.setAttribute('aria-expanded', 'true');
    const fontKind = sel.dataset.font ? true : false;
    const items = itemsOf(sel).map((i) => (fontKind ? { ...i, font: i.value } : i));
    openOptions({
      title,
      anchor: btn,
      items,
      value: sel.value,
      width: Math.max(btn.offsetWidth, 240),
      onPick: (v) => {
        if (v !== sel.value) {
          sel.value = v;
          sel.dispatchEvent(new Event('input', { bubbles: true }));
          sel.dispatchEvent(new Event('change', { bubbles: true }));
        }
        paint();
      },
    });
    setTimeout(() => btn.setAttribute('aria-expanded', 'false'), 0);
  });
  const paint = () => {
    const o = sel.selectedOptions && sel.selectedOptions[0];
    const t = o && o.value !== '' ? o.textContent : sel.options[0]?.textContent || '';
    const span = btn.firstElementChild;
    if (span.textContent !== t) span.textContent = t;
    btn.disabled = sel.disabled;
    if (sel.dataset.font) span.style.fontFamily = o ? fontStack(o.value) : '';
  };
  selects.push({ sel, paint });
  paint();
}

/* colour inputs: the browser swatch is replaced by a painted one; the real input sits invisibly on top as the focus / hit target */
function wrapColorInputs() {
  document.querySelectorAll('input[type="color"]').forEach((i) => {
    if (i.closest('.cin') || i.closest('.cs')) return;
    const w = document.createElement('span');
    w.className = 'cin';
    w.innerHTML = '<span class="cswatch" aria-hidden="true"></span>';
    i.before(w);
    w.appendChild(i);
  });
}
const paintSwatchesNow = () =>
  document.querySelectorAll('.cin').forEach((w) => {
    const i = w.querySelector('input');
    w.style.setProperty('--c', i.value);
    w.classList.toggle('off', i.disabled);
  });

/** Re-read every enhanced select's value / options (call after the inspector syncs). */
export function refreshControls() {
  wrapColorInputs();
  paintSwatchesNow();
  document.querySelectorAll('select:not([data-enhanced])').forEach(enhanceSelect);
  selects.forEach((s) => s.paint());
}

/* ---------- colour picker ---------- */
const hex2 = (n) => Math.round(n).toString(16).padStart(2, '0');
function hsv2hex(h, s, v) {
  const f = (n) => {
    const k = (n + h / 60) % 6;
    return v - v * s * Math.max(0, Math.min(k, 4 - k, 1));
  };
  return '#' + [f(5), f(3), f(1)].map((x) => hex2(x * 255)).join('');
}
function hex2hsv(hex) {
  const n = parseInt(hex.slice(1), 16);
  const r = ((n >> 16) & 255) / 255;
  const g = ((n >> 8) & 255) / 255;
  const b = (n & 255) / 255;
  const max = Math.max(r, g, b);
  const d = max - Math.min(r, g, b);
  let h = 0;
  if (d) h = max === r ? ((g - b) / d + 6) % 6 : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return { h: h * 60, s: max ? d / max : 0, v: max };
}
const NEUTRALS = ['#ffffff', '#f2f2f2', '#c8ccd2', '#8a8f98', '#4a4f57', '#1b1d21', '#0b0b0e', '#000000'];

/** getSwatches() -> [hex,...] supplies the current slide palette (kept lazy so it reflects the live project). */
let swatchSource = () => [];
export const setSwatchSource = (fn) => (swatchSource = fn);

export function openColorPicker(input) {
  const start = normHex(input.value, '#000000');
  const hsv = hex2hsv(start);
  let cur = start;
  const title = (input.closest('label')?.textContent || input.getAttribute('aria-label') || 'Colour').trim() || 'Colour';
  return openSheet({
    title,
    anchor: input.closest('label') || input,
    width: 280,
    className: 'cpick',
    build(body, api) {
      const pal = [...new Set(swatchSource().map((c) => normHex(c, null)).filter(Boolean))];
      body.innerHTML = `
        <div class="cp-sv" role="slider" tabindex="0" aria-label="Saturation and brightness" aria-valuetext=""><canvas></canvas><i class="cp-knob"></i></div>
        <div class="cp-hue" role="slider" tabindex="0" aria-label="Hue" aria-valuemin="0" aria-valuemax="360"><i class="cp-hknob"></i></div>
        <div class="cp-row"><span class="cp-chip" aria-hidden="true"><i class="cp-old"></i><i class="cp-new"></i></span><label class="cp-hexl"><span class="sr">Hex colour</span><input class="cp-hex" type="text" inputmode="text" maxlength="7" spellcheck="false" autocomplete="off" aria-label="Hex colour"></label><button type="button" class="btn sm primary cp-done">Done</button></div>
        ${pal.length ? `<div class="cp-lbl">This slide</div><div class="cp-sw">${pal.map((c) => `<button type="button" class="cs" style="--c:${c}" data-c="${c}" aria-label="${c}"></button>`).join('')}</div>` : ''}
        <div class="cp-lbl">Neutrals</div><div class="cp-sw">${NEUTRALS.map((c) => `<button type="button" class="cs" style="--c:${c}" data-c="${c}" aria-label="${c}"></button>`).join('')}</div>`;
      const sv = body.querySelector('.cp-sv');
      const cv = sv.querySelector('canvas');
      const knob = sv.querySelector('.cp-knob');
      const hue = body.querySelector('.cp-hue');
      const hk = body.querySelector('.cp-hknob');
      const hexIn = body.querySelector('.cp-hex');
      const chipOld = body.querySelector('.cp-old');
      const chipNew = body.querySelector('.cp-new');
      chipOld.style.background = start;
      let W = 0;
      let H = 0;

      const drawSV = () => {
        const dpr = window.devicePixelRatio || 1;
        W = sv.clientWidth;
        H = sv.clientHeight;
        cv.width = Math.round(W * dpr);
        cv.height = Math.round(H * dpr);
        const g = cv.getContext('2d');
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        g.fillStyle = hsv2hex(hsv.h, 1, 1);
        g.fillRect(0, 0, W, H);
        const w = g.createLinearGradient(0, 0, W, 0);
        w.addColorStop(0, '#fff');
        w.addColorStop(1, 'rgba(255,255,255,0)');
        g.fillStyle = w;
        g.fillRect(0, 0, W, H);
        const k = g.createLinearGradient(0, 0, 0, H);
        k.addColorStop(0, 'rgba(0,0,0,0)');
        k.addColorStop(1, '#000');
        g.fillStyle = k;
        g.fillRect(0, 0, W, H);
      };
      const place = () => {
        knob.style.transform = `translate(${hsv.s * W}px, ${(1 - hsv.v) * H}px)`;
        hk.style.transform = `translateX(${(hsv.h / 360) * hue.clientWidth}px)`;
        cur = hsv2hex(hsv.h, hsv.s, hsv.v);
        knob.style.background = cur;
        chipNew.style.background = cur;
        if (document.activeElement !== hexIn) hexIn.value = cur;
        sv.setAttribute('aria-valuetext', `saturation ${Math.round(hsv.s * 100)}%, brightness ${Math.round(hsv.v * 100)}%`);
        hue.setAttribute('aria-valuenow', Math.round(hsv.h));
      };
      // live updates are coalesced per frame; the inspector's own commit key keeps undo history to one step per drag
      const emit = rafThrottle(() => {
        if (input.value === cur) return;
        input.value = cur;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      });
      const apply = (redraw) => {
        if (redraw) drawSV();
        place();
        emit();
      };
      const drag = (el, fn) => {
        el.addEventListener('pointerdown', (e) => {
          el.setPointerCapture(e.pointerId);
          fn(e);
          const mv = (ev) => fn(ev);
          const up = () => (el.removeEventListener('pointermove', mv), el.removeEventListener('pointerup', up), el.removeEventListener('pointercancel', up));
          el.addEventListener('pointermove', mv);
          el.addEventListener('pointerup', up);
          el.addEventListener('pointercancel', up);
          e.preventDefault();
        });
      };
      drag(sv, (e) => {
        const r = sv.getBoundingClientRect();
        hsv.s = clamp((e.clientX - r.left) / r.width, 0, 1);
        hsv.v = 1 - clamp((e.clientY - r.top) / r.height, 0, 1);
        apply(false);
      });
      drag(hue, (e) => {
        const r = hue.getBoundingClientRect();
        hsv.h = clamp((e.clientX - r.left) / r.width, 0, 1) * 360;
        apply(true);
      });
      const keys = (el, step) =>
        el.addEventListener('keydown', (e) => {
          const d = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, 1], ArrowDown: [0, -1] }[e.key];
          if (!d) return;
          e.preventDefault();
          step(d, e.shiftKey ? 10 : 1);
        });
      keys(sv, ([dx, dy], m) => ((hsv.s = clamp(hsv.s + dx * 0.01 * m, 0, 1)), (hsv.v = clamp(hsv.v + dy * 0.01 * m, 0, 1)), apply(false)));
      keys(hue, ([dx, dy], m) => ((hsv.h = clamp(hsv.h + (dx + dy) * 2 * m, 0, 360)), apply(true)));
      hexIn.addEventListener('input', () => {
        let v = hexIn.value.trim();
        if (/^[0-9a-f]{6}$/i.test(v)) v = '#' + v;
        const h = /^#[0-9a-f]{6}$/i.test(v) ? v.toLowerCase() : null;
        if (!h) return;
        const n = hex2hsv(h);
        hsv.s = n.s;
        hsv.v = n.v;
        if (n.s > 0.02 && n.v > 0.02) hsv.h = n.h;
        apply(true);
      });
      hexIn.addEventListener('keydown', (e) => e.key === 'Enter' && api.close());
      body.addEventListener('click', (e) => {
        const c = e.target.closest('[data-c]');
        if (!c) return;
        const n = hex2hsv(c.dataset.c);
        Object.assign(hsv, { s: n.s, v: n.v });
        if (n.s > 0.02 && n.v > 0.02) hsv.h = n.h;
        apply(true);
      });
      body.querySelector('.cp-done').addEventListener('click', () => api.close());
      requestAnimationFrame(() => {
        drawSV();
        place();
      });
      new ResizeObserver(() => {
        if (sv.clientWidth !== W) (drawSV(), place());
      }).observe(sv);
      return sv;
    },
  });
}

/** Colour inputs never open the browser dialog: clicks and Space/Enter open the Studio picker instead. */
function interceptColorInputs() {
  document.addEventListener(
    'click',
    (e) => {
      const i = e.target.closest && e.target.closest('input[type="color"]');
      if (!i) return;
      e.preventDefault();
      if (!i.disabled) openColorPicker(i);
    },
    true
  );
  document.addEventListener(
    'keydown',
    (e) => {
      const i = e.target.matches && e.target.matches('input[type="color"]') ? e.target : null;
      if (i && (e.key === 'Enter' || e.key === ' ')) {
        e.preventDefault();
        if (!i.disabled) openColorPicker(i);
      }
    },
    true
  );
}

export function initControls() {
  refreshControls();
  interceptColorInputs();
  document.addEventListener('input', (e) => e.target.matches && e.target.matches('input[type="color"]') && paintSwatchesNow());
  document.querySelectorAll('input[type="checkbox"]').forEach((c) => {
    c.setAttribute('role', 'switch');
    c.classList.add('sw-in');
  });
}
