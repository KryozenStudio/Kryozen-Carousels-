// Pixel-accurate export. Each slide is rendered off-screen at its true pixel size (so cqw units resolve exactly),
// fonts are embedded as data URIs, and capture only starts after fonts and every <img> are decoded.
import { RATIOS } from './schema.js';
import { slideMarkup, ensureFonts, usedFamilies, fontFacesFor, measureFit } from './render.js';
import { pad2, slug, download } from './util.js';

const fontCss = new Map();

const toDataURL = async (url) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error('Font file missing: ' + url);
  const blob = await res.blob();
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
};

async function embedCSS(families) {
  let css = '';
  for (const f of fontFacesFor(families)) {
    if (!fontCss.has(f.name)) {
      let rule = `@font-face{font-family:"${f.name}";font-style:normal;font-weight:${f.w[0]} ${f.w[1]};src:url(${await toDataURL(f.url)}) format("woff2")}`;
      if (f.italicUrl) rule += `@font-face{font-family:"${f.name}";font-style:italic;font-weight:${f.w[0]} ${f.w[1]};src:url(${await toDataURL(f.italicUrl)}) format("woff2")}`;
      fontCss.set(f.name, rule);
    }
    css += fontCss.get(f.name);
  }
  return css;
}

let stageEl = null;
function getStage() {
  if (!stageEl) {
    stageEl = document.createElement('div');
    stageEl.setAttribute('aria-hidden', 'true');
    stageEl.style.cssText = 'position:fixed;left:-30000px;top:0;pointer-events:none;contain:layout style;';
    document.body.appendChild(stageEl);
  }
  return stageEl;
}

const frame = () => new Promise((r) => requestAnimationFrame(() => r()));

async function renderNode(p, i) {
  const [W, H] = RATIOS[p.ratio];
  const stage = getStage();
  const wrap = document.createElement('div');
  wrap.className = 'cwrap';
  wrap.style.cssText = `width:${W}px;height:${H}px;`;
  wrap.innerHTML = slideMarkup(p, i, 'static');
  stage.replaceChildren(wrap);
  const imgs = [...wrap.querySelectorAll('img')];
  await Promise.all(imgs.map((im) => im.decode().catch(() => {})));
  await document.fonts.ready;
  await frame();
  return { node: wrap, W, H };
}

/** Capture one slide to a PNG blob. */
export async function slideToBlob(p, i, scale = 2) {
  if (!window.htmlToImage) throw new Error('Export library failed to load. Check your connection and reload.');
  await ensureFonts(p);
  const css = await embedCSS(usedFamilies(p));
  measureFit(p, i);
  const { node, W, H } = await renderNode(p, i);
  const opts = { width: W, height: H, pixelRatio: scale, fontEmbedCSS: css, cacheBust: false, skipAutoScale: true, style: { transform: 'none' } };
  // First call warms the SVG image decode pipeline; browsers occasionally paint images one frame late.
  const blob = await window.htmlToImage.toBlob(node, opts);
  if (!blob) throw new Error('The browser could not render this slide.');
  return blob;
}

const check = (signal) => {
  if (signal && signal.aborted) throw new DOMException('Cancelled', 'AbortError');
};

export async function exportPNG(p, i, scale, onProgress) {
  onProgress?.(0, 'Rendering slide…');
  const blob = await slideToBlob(p, i, scale);
  download(blob, `${slug(p.name)}-${pad2(i + 1)}.png`);
  onProgress?.(1, 'Done');
}

export async function exportZIP(p, scale, onProgress, signal) {
  if (!window.JSZip) throw new Error('ZIP library failed to load. Reload and try again.');
  const zip = new window.JSZip();
  const n = p.slides.length;
  for (let i = 0; i < n; i++) {
    check(signal);
    onProgress?.(i / n, `Rendering slide ${i + 1} of ${n}…`);
    zip.file(`${slug(p.name)}-${pad2(i + 1)}.png`, await slideToBlob(p, i, scale));
  }
  check(signal);
  onProgress?.(0.96, 'Packing ZIP…');
  const out = await zip.generateAsync({ type: 'blob', compression: 'STORE' });
  download(out, `${slug(p.name)}.zip`);
  onProgress?.(1, 'Done');
}

export async function exportPDF(p, scale, onProgress, signal) {
  const J = window.jspdf && window.jspdf.jsPDF;
  if (!J) throw new Error('PDF library failed to load. Reload and try again.');
  const [W, H] = RATIOS[p.ratio];
  const doc = new J({ unit: 'px', format: [W, H], orientation: W >= H ? 'landscape' : 'portrait', compress: true, hotfixes: ['px_scaling'] });
  const n = p.slides.length;
  for (let i = 0; i < n; i++) {
    check(signal);
    onProgress?.(i / n, `Rendering page ${i + 1} of ${n}…`);
    const blob = await slideToBlob(p, i, scale);
    const data = new Uint8Array(await blob.arrayBuffer());
    if (i > 0) doc.addPage([W, H], W >= H ? 'landscape' : 'portrait');
    doc.addImage(data, 'PNG', 0, 0, W, H, undefined, 'FAST');
  }
  check(signal);
  onProgress?.(0.97, 'Writing PDF…');
  download(doc.output('blob'), `${slug(p.name)}.pdf`);
  onProgress?.(1, 'Done');
}

export function disposeStage() {
  if (stageEl) stageEl.replaceChildren();
}
