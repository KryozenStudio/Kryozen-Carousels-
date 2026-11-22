// Small, dependency-free helpers shared across modules.

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

export const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
export const num = (v, fallback, lo = -Infinity, hi = Infinity) => {
  const n = typeof v === 'number' ? v : parseFloat(v);
  return Number.isFinite(n) ? clamp(n, lo, hi) : fallback;
};

export const uid = () => Math.random().toString(36).slice(2, 8) + Date.now().toString(36).slice(-3);

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);

export function debounce(fn, ms) {
  let t = 0;
  const d = (...a) => {
    clearTimeout(t);
    t = setTimeout(() => fn(...a), ms);
  };
  d.flush = (...a) => {
    clearTimeout(t);
    fn(...a);
  };
  d.cancel = () => clearTimeout(t);
  return d;
}

/** Run fn at most once per animation frame with the latest arguments. */
export function rafThrottle(fn) {
  let raf = 0;
  let last;
  return (...a) => {
    last = a;
    if (raf) return;
    raf = requestAnimationFrame(() => {
      raf = 0;
      fn(...last);
    });
  };
}

/* ---------- colour ---------- */
export function hexToRgb(hex) {
  const m = /^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(hex).trim());
  if (!m) return null;
  let h = m[1];
  if (h.length === 3) h = [...h].map((c) => c + c).join('');
  const n = parseInt(h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
export const normHex = (v, fallback) => {
  const rgb = hexToRgb(v);
  return rgb ? '#' + rgb.map((x) => x.toString(16).padStart(2, '0')).join('') : fallback;
};
export function luminance(hex) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 0;
  const [r, g, b] = rgb.map((v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
export function contrast(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
/** Readable text colour for a given background. */
export const onColor = (bg) => (contrast(bg, '#111111') >= contrast(bg, '#ffffff') ? '#111111' : '#ffffff');

export const pad2 = (n) => String(n).padStart(2, '0');

export function download(blob, name) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export const slug = (s) =>
  String(s || 'carousel')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 40) || 'carousel';
