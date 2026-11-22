// Circle photo + arrow overlays. Pure markup / geometry helpers shared by the renderer (stage, filmstrip, export) and the inspector.
// Everything is DOM + inline SVG so html-to-image captures it exactly like the rest of the slide.
// Units: sizes are authored against a 1080px-wide canvas and rendered in cqw, so they scale with every ratio and export size.
import { esc } from './util.js';
import { urlOf } from './assets.js';

export const PX = 100 / 1080; // 1 authored px expressed in cqw
const ARROW_BOX = 1.4; // svg viewBox side, in arrow-length units
const f = (n) => +n.toFixed(4);

/** Where a circle's centre sits, as % of slide width / height, for a given canvas size. Used by the X / Y sliders. */
export function circleCenter(c, W, H) {
  if (c.x != null && c.y != null) return { x: c.x * 100, y: c.y * 100 };
  const R = c.size / 2 + c.border * PX; // outer radius, % of width
  const x = c.pos === 'tl' ? 2.778 + R : 100 - 2.778 - R;
  const y = ((3.148 + R) * W) / H;
  return { x, y };
}

const ARROW_PATHS = {
  curve: [-0.5, 0.25, -0.35, -0.35, 0.05, -0.5, 0.5, -0.15],
  curvedn: [-0.5, -0.25, -0.35, 0.35, 0.05, 0.5, 0.5, 0.15],
  swoop: [-0.5, 0.4, -0.5, -0.5, 0.3, -0.55, 0.5, 0.1],
  straight: [-0.5, 0, -0.17, 0, 0.17, 0, 0.5, 0],
};
const BLOCK = [-0.5, -0.11, 0.08, -0.11, 0.08, -0.3, 0.5, 0, 0.08, 0.3, 0.08, 0.11, -0.5, 0.11];

/** Vector geometry for an arrow style at length 1. Same shapes as the reference canvas arrows. */
export function arrowShapes(style, size) {
  if (style === 'block') {
    const pts = [];
    for (let i = 0; i < BLOCK.length; i += 2) pts.push(`${BLOCK[i]},${BLOCK[i + 1]}`);
    return `<polygon points="${pts.join(' ')}" stroke-width="0.03" stroke-linejoin="round"/>`;
  }
  const q = ARROW_PATHS[style] || ARROW_PATHS.straight;
  const lw = Math.max(0.055, 10 / size);
  const g = Math.atan2(q[7] - q[5], q[6] - q[4]);
  const h = 0.2;
  const line = `M${q[0]} ${q[1]}C${q[2]} ${q[3]} ${q[4]} ${q[5]} ${f(q[6] - h * 0.6 * Math.cos(g))} ${f(q[7] - h * 0.6 * Math.sin(g))}`;
  const head = `M${q[6]} ${q[7]}L${f(q[6] - h * Math.cos(g - 0.5))} ${f(q[7] - h * Math.sin(g - 0.5))}L${f(q[6] - h * Math.cos(g + 0.5))} ${f(q[7] - h * Math.sin(g + 0.5))}Z`;
  return `<path d="${line}" fill="none" stroke-width="${f(lw)}" stroke-linecap="round"/><path d="${head}" stroke-width="${f(lw * 0.5)}" stroke-linejoin="round"/>`;
}

const colorVar = (v) => (v === 'accent' ? 'var(--accent)' : v === 'text' ? 'var(--text)' : v);

export function arrowHTML(a, edit) {
  if (!a || a.style === 'off') return '';
  const hit = edit ? '<circle class="hit" r="0.36" fill="transparent" stroke="none"/>' : '';
  const st = `--ax:${f(a.x)};--ay:${f(a.y)};--as:${a.size};--ar:${a.rot}deg;color:${colorVar(a.color)}`;
  return `<svg class="ov arw" ${edit ? 'data-ov="arrow" ' : ''}viewBox="${-ARROW_BOX / 2} ${-ARROW_BOX / 2} ${ARROW_BOX} ${ARROW_BOX}" fill="currentColor" stroke="currentColor" aria-hidden="true" style="${st}">${hit}${arrowShapes(a.style, a.size)}</svg>`;
}

export function circleHTML(c, edit) {
  if (!c || c.pos === 'off') return '';
  const url = c.asset ? urlOf(c.asset) : '';
  const custom = c.x != null && c.y != null;
  const st = `--cs:${c.size};--cb:${c.border};--cr:${colorVar(c.ring)};--cx:${f(custom ? c.x : 0)};--cy:${f(custom ? c.y : 0)}`;
  const img = url
    ? `<img src="${esc(url)}" alt="" draggable="false" style="object-position:${c.px}% ${c.py}%;transform-origin:${c.px}% ${c.py}%;transform:scale(${c.zoom})">`
    : edit
      ? '<span>Circle photo</span>'
      : '';
  const guide = edit ? '<i class="cir-guide"></i>' : '';
  return `<div class="ov cir" ${edit ? 'data-ov="circle" ' : ''}data-pos="${c.pos}"${custom ? ' data-custom="1"' : ''} style="${st}"><div class="cir-p${url ? '' : ' ph'}">${img}${guide}</div></div>`;
}

export const overlaysHTML = (s, edit) => circleHTML(s.circle, edit) + arrowHTML(s.arrow, edit);
