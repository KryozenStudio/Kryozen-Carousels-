// Single source of truth for the project shape, curated palettes, font pairings and defaults.
import { clamp, num, uid, normHex, esc } from './util.js';

export const VERSION = 1;

export const RATIOS = {
  '4:5': [1080, 1350],
  '1:1': [1080, 1080],
  '9:16': [1080, 1920],
  '16:9': [1920, 1080],
};

/* ---------- slide kinds and the fields each one edits ---------- */
export const KINDS = {
  cover: { label: 'Cover', fields: ['tag', 'heading', 'sub'] },
  content: { label: 'Content', fields: ['tag', 'num', 'heading', 'sub', 'body'] },
  visual: { label: 'Visual', fields: ['tag', 'heading', 'sub'] },
  stats: { label: 'Stats', fields: ['tag', 'stat', 'statLabel', 'heading', 'body'] },
  quote: { label: 'Quote', fields: ['tag', 'quote', 'author', 'role'] },
  list: { label: 'List', fields: ['tag', 'heading', 'items', 'sub'] },
  cta: { label: 'CTA', fields: ['heading', 'sub', 'cta', 'body'] },
};

export const FIELDS = {
  tag: { label: 'Tag / badge', kind: 'line', max: 40, ph: 'e.g. Guide' },
  num: { label: 'Slide number (blank = auto)', kind: 'line', max: 8, ph: 'auto' },
  heading: { label: 'Heading', kind: 'text', max: 600, ph: 'Heading', hl: true },
  sub: { label: 'Subheading', kind: 'text', max: 400, ph: 'Subheading', hl: true },
  body: { label: 'Body', kind: 'text', max: 1500, ph: 'Body text' },
  stat: { label: 'Big number', kind: 'line', max: 14, ph: '82%' },
  statLabel: { label: 'Number caption', kind: 'line', max: 120, ph: 'of readers…' },
  quote: { label: 'Quote', kind: 'text', max: 600, ph: 'A line worth remembering' },
  author: { label: 'Author', kind: 'line', max: 60, ph: 'Name' },
  role: { label: 'Role / source', kind: 'line', max: 60, ph: 'Title' },
  items: { label: 'List items (one per line)', kind: 'text', max: 1500, ph: 'One item per line', rows: 5 },
  cta: { label: 'Button label', kind: 'line', max: 50, ph: 'Follow for more' },
};

/* ---------- fonts (self-hosted woff2, latin subset) ---------- */
export const FONTS = {
  'Instrument Serif': { file: 'instrument-serif-latin-400-normal.woff2', italic: 'instrument-serif-latin-400-italic.woff2', w: [400, 400], fb: 'Georgia, serif' },
  Fraunces: { file: 'fraunces-latin-wght-normal.woff2', w: [100, 900], fb: 'Georgia, serif' },
  'Playfair Display': { file: 'playfair-display-latin-wght-normal.woff2', w: [400, 900], fb: 'Georgia, serif' },
  'Bricolage Grotesque': { file: 'bricolage-grotesque-latin-wght-normal.woff2', w: [200, 800], fb: 'system-ui, sans-serif' },
  Manrope: { file: 'manrope-latin-wght-normal.woff2', w: [200, 800], fb: 'system-ui, sans-serif' },
  Archivo: { file: 'archivo-latin-wght-normal.woff2', w: [100, 900], fb: 'system-ui, sans-serif' },
  Anton: { file: 'anton-latin-400-normal.woff2', w: [400, 400], fb: 'Impact, sans-serif' },
  'Work Sans': { file: 'work-sans-latin-wght-normal.woff2', w: [100, 900], fb: 'system-ui, sans-serif' },
  'Space Grotesk': { file: 'space-grotesk-latin-wght-normal.woff2', w: [300, 700], fb: 'system-ui, sans-serif' },
  Outfit: { file: 'outfit-latin-wght-normal.woff2', w: [100, 900], fb: 'system-ui, sans-serif' },
  'Plus Jakarta Sans': { file: 'plus-jakarta-sans-latin-wght-normal.woff2', w: [200, 800], fb: 'system-ui, sans-serif' },
  Unbounded: { file: 'unbounded-latin-wght-normal.woff2', w: [200, 900], fb: 'system-ui, sans-serif' },
  Syne: { file: 'syne-latin-wght-normal.woff2', w: [400, 800], fb: 'system-ui, sans-serif' },
  'DM Sans': { file: 'dm-sans-latin-wght-normal.woff2', w: [100, 1000], fb: 'system-ui, sans-serif' },
  'JetBrains Mono': { file: 'jetbrains-mono-latin-wght-normal.woff2', w: [100, 800], fb: 'ui-monospace, monospace' },
};

export const FONT_CATS = { 'Instrument Serif':'Serif', Fraunces:'Serif', 'Playfair Display':'Serif', 'Bricolage Grotesque':'Display sans', Unbounded:'Display sans', Syne:'Display sans', 'Space Grotesk':'Display sans', Outfit:'Display sans', Manrope:'Sans', 'DM Sans':'Sans', 'Work Sans':'Sans', 'Plus Jakarta Sans':'Sans', Archivo:'Sans', Anton:'Condensed', 'JetBrains Mono':'Mono' };

/* movable blocks inside a slide (drag on canvas or nudge in the Slide tab) */
export const EL_KEYS = ['tag', 'heading', 'sub', 'body', 'stat', 'statl', 'quote', 'by', 'items', 'btn', 'brand'];
export const EL_LABELS = { tag: 'Tag', heading: 'Heading', sub: 'Subheading', body: 'Body', stat: 'Big number', statl: 'Number caption', quote: 'Quote', by: 'Author', items: 'List', btn: 'Button', brand: 'Branding bar' };

export const fontStack = (name) => `"${name}", ${FONTS[name]?.fb || 'system-ui, sans-serif'}`;

/* hs = headline size factor, tr = tracking (em), lh = headline line-height, hw = default headline weight */
export const PAIRINGS = [
  { id: 'editorial', name: 'Editorial', display: 'Instrument Serif', body: 'DM Sans', hw: 400, hs: 1.22, tr: -0.015, lh: 1.02 },
  { id: 'studio', name: 'Studio', display: 'Bricolage Grotesque', body: 'Manrope', hw: 700, hs: 1, tr: -0.03, lh: 1.04 },
  { id: 'swiss', name: 'Swiss', display: 'Archivo', body: 'Archivo', hw: 800, hs: 1, tr: -0.035, lh: 1.02 },
  { id: 'poster', name: 'Poster', display: 'Anton', body: 'Work Sans', hw: 400, hs: 1.28, tr: 0.005, lh: 1.0 },
  { id: 'grotesk', name: 'Grotesk', display: 'Space Grotesk', body: 'DM Sans', hw: 700, hs: 1, tr: -0.035, lh: 1.04 },
  { id: 'soft', name: 'Soft', display: 'Outfit', body: 'Plus Jakarta Sans', hw: 700, hs: 1.04, tr: -0.025, lh: 1.04 },
  { id: 'classic', name: 'Classic', display: 'Fraunces', body: 'Manrope', hw: 600, hs: 1, tr: -0.025, lh: 1.04 },
  { id: 'bookish', name: 'Bookish', display: 'Playfair Display', body: 'Work Sans', hw: 700, hs: 0.95, tr: -0.02, lh: 1.08 },
  { id: 'wide', name: 'Wide', display: 'Unbounded', body: 'DM Sans', hw: 700, hs: 0.74, tr: -0.035, lh: 1.1 },
  { id: 'quirk', name: 'Quirk', display: 'Syne', body: 'Manrope', hw: 700, hs: 1, tr: -0.03, lh: 1.02 },
];

/* ---------- curated palettes ----------
   Every palette is WCAG-checked by `node scripts/validate.mjs`:
   text on bg/surface >= 7:1 (AAA), muted on bg/surface >= 4.5:1, accent on bg >= 3:1, readable on-accent label >= 4.5:1.
   Groups: dark creator / studio · light editorial / minimal · refined accent editorial. */
export const PALETTES = [
  // dark creator / studio
  { id: 'midnight', name: 'Midnight', bg: '#0e1014', surface: '#1a1d25', text: '#f3f1ec', muted: '#a9abb3', accent: '#ff7a4d', accent2: '#ffc857' },
  { id: 'obsidian', name: 'Obsidian', bg: '#08090b', surface: '#14161a', text: '#f5f5f3', muted: '#a3a7ae', accent: '#c4f25a', accent2: '#f5f5f3' },
  { id: 'charcoal', name: 'Charcoal', bg: '#1a1b1e', surface: '#26282c', text: '#f2f1ee', muted: '#aaacb2', accent: '#6ee0c1', accent2: '#f2c46d' },
  { id: 'ocean', name: 'Deep Ocean', bg: '#0a2540', surface: '#123760', text: '#eaf4ff', muted: '#a6c0dc', accent: '#4fe0cf', accent2: '#8fb0ff' },
  { id: 'forest', name: 'Forest', bg: '#0f2a21', surface: '#173a2e', text: '#eef3e8', muted: '#acc3b4', accent: '#c6f36b', accent2: '#f2b84b' },
  { id: 'espresso', name: 'Espresso', bg: '#1b1310', surface: '#2b211b', text: '#f6eee4', muted: '#bcab9a', accent: '#f0a65c', accent2: '#f6eee4' },
  { id: 'noir', name: 'Noir Gold', bg: '#0b0b0b', surface: '#181714', text: '#f5f0e1', muted: '#b4ad98', accent: '#d9b445', accent2: '#f5f0e1' },
  { id: 'onyx', name: 'Onyx', bg: '#0a0a0a', surface: '#151514', text: '#f1ede6', muted: '#a9a498', accent: '#cdb98a', accent2: '#f1ede6' },
  { id: 'violet', name: 'Violet', bg: '#15102b', surface: '#221a45', text: '#f2efff', muted: '#b8b2de', accent: '#b49cff', accent2: '#f58bc2' },
  { id: 'broadcast', name: 'Broadcast', bg: '#0b0b0c', surface: '#1b1b1e', text: '#ffffff', muted: '#bdbdc2', accent: '#ff7a2e', accent2: '#ffffff' },
  // light editorial / minimal
  { id: 'paper', name: 'Paper', bg: '#f5f1e8', surface: '#ffffff', text: '#16140f', muted: '#5a564b', accent: '#b8341a', accent2: '#1f4d3a' },
  { id: 'chalk', name: 'Chalk', bg: '#ffffff', surface: '#f1f1ef', text: '#0b0b0b', muted: '#55555a', accent: '#d81f17', accent2: '#0b0b0b' },
  { id: 'slate', name: 'Slate', bg: '#e8ebef', surface: '#ffffff', text: '#12151a', muted: '#4a5160', accent: '#1f4fcf', accent2: '#0f6b63' },
  { id: 'clay', name: 'Sand', bg: '#e9dfcf', surface: '#f6efe3', text: '#2a1a12', muted: '#604a3a', accent: '#9c3a14', accent2: '#2f5d50' },
  { id: 'stone', name: 'Stone', bg: '#dedbd5', surface: '#efede9', text: '#1b1a18', muted: '#55524b', accent: '#2d5b4d', accent2: '#9c3a14' },
  { id: 'newsprint', name: 'Newsprint', bg: '#ece6d8', surface: '#f6f1e6', text: '#131210', muted: '#4a463c', accent: '#8f1d14', accent2: '#131210' },
  { id: 'signal', name: 'Social Card', bg: '#f4f4f2', surface: '#ffffff', text: '#0f1419', muted: '#4f5d69', accent: '#0f6fc6', accent2: '#a06908' },
  { id: 'sage', name: 'Sage', bg: '#d9e4d3', surface: '#eef4ea', text: '#14231a', muted: '#42584a', accent: '#1d6a42', accent2: '#b4400d' },
  { id: 'blush', name: 'Blush', bg: '#f9e8e5', surface: '#ffffff', text: '#2b1215', muted: '#744850', accent: '#b8205a', accent2: '#5b36c8' },
  { id: 'butter', name: 'Butter', bg: '#f1e4b3', surface: '#faf3d6', text: '#1a1608', muted: '#575029', accent: '#a52f12', accent2: '#1a1608' },
  // refined accent editorial
  { id: 'cobalt', name: 'Cobalt', bg: '#1530b8', surface: '#2040cf', text: '#ffffff', muted: '#d3dbff', accent: '#ffd84a', accent2: '#ffffff' },
  { id: 'terracotta', name: 'Terracotta', bg: '#8f3016', surface: '#7a2710', text: '#fff3e8', muted: '#f7d6bd', accent: '#ffd9a0', accent2: '#fff3e8' },
  { id: 'plum', name: 'Plum', bg: '#2a1030', surface: '#3a1b42', text: '#fbeff6', muted: '#d6b9cc', accent: '#ff8fb8', accent2: '#ffd27a' },
  { id: 'duotone', name: 'Duotone', bg: '#3322c8', surface: '#4433db', text: '#ffffff', muted: '#dad6ff', accent: '#ff9bd0', accent2: '#ffffff' },
];
export const paletteById = (id) => PALETTES.find((p) => p.id === id) || PALETTES[0];

export const TEXTURES = [
  { id: 'none', name: 'None' },
  { id: 'grain', name: 'Grain' },
  { id: 'dots', name: 'Dots' },
  { id: 'grid', name: 'Grid' },
  { id: 'lines', name: 'Lines' },
];
export const GRADIENTS = [
  { id: 'none', name: 'None' },
  { id: 'soft', name: 'Glow' },
  { id: 'dusk', name: 'Dusk' },
  { id: 'aurora', name: 'Aurora' },
];

/* ---------- defaults ---------- */
export const defaultMedia = () => ({ asset: null, fit: 'cover', x: 50, y: 50, zoom: 1, opacity: 1, scrim: 55 });

/* ---------- circle photo + arrow overlays (one of each per slide, off until switched on) ---------- */
export const ARROW_STYLES = { off: 'Off', curve: 'Curve up', curvedn: 'Curve down', swoop: 'Swoop', straight: 'Straight', block: 'Block' };
export const CIRCLE_POS = { off: 'Off', tr: 'Top right', tl: 'Top left' };
/** Colour swatches shared by the circle outline and the arrow. `v` is a hex or a slide token ('accent' | 'text'). */
export const OVERLAY_SWATCHES = {
  circle: [['#ffffff', 'White'], ['accent', 'Slide accent'], ['text', 'Slide text'], ['#000000', 'Pure black'], ['#e6b84a', 'Warm gold'], ['#c8ccd2', 'Soft silver']],
  arrow: [['#ffffff', 'White'], ['accent', 'Slide accent'], ['text', 'Slide text'], ['#000000', 'Black'], ['#e6b84a', 'Gold'], ['#dc143c', 'Crimson']],
};
export const PREFS_KEY = 'carousel-studio:overlay-prefs:v1';
const PREF_DEFAULTS = { circle: { size: 42, border: 14, ring: '#ffffff', zoom: 1.25, corner: 'tr' }, arrow: { color: '#ffffff', size: 300, rot: 0 } };
const colorOk = (v, d) => (v === 'accent' || v === 'text' ? v : normHex(v, d));

/** Last-used circle / arrow styling (localStorage). Never stores on/off state: overlays always start Off. */
export function loadOverlayPrefs() {
  const out = { circle: { ...PREF_DEFAULTS.circle }, arrow: { ...PREF_DEFAULTS.arrow } };
  try {
    const raw = JSON.parse(localStorage.getItem(PREFS_KEY) || 'null');
    if (raw && typeof raw === 'object') {
      const c = raw.circle || {};
      const a = raw.arrow || {};
      out.circle = { size: num(c.size, 42, 15, 80), border: num(c.border, 14, 0, 40), ring: colorOk(c.ring, '#ffffff'), zoom: num(c.zoom, 1.25, 1, 4), corner: c.corner === 'tl' ? 'tl' : 'tr' };
      out.arrow = { color: colorOk(a.color, '#ffffff'), size: num(a.size, 300, 120, 700), rot: num(a.rot, 0, -180, 180) };
    }
  } catch {
    /* storage unavailable or corrupt: built-in defaults */
  }
  return out;
}
export function saveOverlayPrefs(patch) {
  const cur = loadOverlayPrefs();
  const next = { circle: { ...cur.circle, ...(patch.circle || {}) }, arrow: { ...cur.arrow, ...(patch.arrow || {}) } };
  try {
    localStorage.setItem(PREFS_KEY, JSON.stringify(next));
  } catch {
    /* ignore: prefs are a convenience */
  }
  return next;
}

/** x / y are the centre as a fraction of the slide (null = the corner preset); px / py are the photo pan in % (50 = centred). */
export const defaultCircle = (pr = PREF_DEFAULTS.circle) => ({ pos: 'off', x: null, y: null, asset: null, size: pr.size, border: pr.border, ring: pr.ring, zoom: pr.zoom, px: 50, py: 50 });
export const defaultArrow = (pr = PREF_DEFAULTS.arrow) => ({ style: 'off', x: 0.5, y: 0.3, size: pr.size, rot: pr.rot, color: pr.color });

function normCircle(c, d) {
  c = c && typeof c === 'object' ? c : {};
  const fx = c.x == null || c.y == null ? null : num(c.x, null, -0.2, 1.2);
  const fy = c.x == null || c.y == null ? null : num(c.y, null, -0.2, 1.2);
  return {
    pos: oneOf(c.pos, Object.keys(CIRCLE_POS), 'off'),
    x: fx == null || fy == null ? null : fx,
    y: fx == null || fy == null ? null : fy,
    asset: typeof c.asset === 'string' ? c.asset.slice(0, 40) : null,
    size: num(c.size, d.size, 15, 80),
    border: num(c.border, d.border, 0, 40),
    ring: colorOk(c.ring, d.ring),
    zoom: num(c.zoom, d.zoom, 1, 4),
    px: num(c.px, 50, 0, 100),
    py: num(c.py, 50, 0, 100),
  };
}
function normArrow(a, d) {
  a = a && typeof a === 'object' ? a : {};
  return {
    style: oneOf(a.style, Object.keys(ARROW_STYLES), 'off'),
    x: num(a.x, d.x, -0.2, 1.2),
    y: num(a.y, d.y, -0.2, 1.2),
    size: num(a.size, d.size, 120, 700),
    rot: num(a.rot, d.rot, -180, 180),
    color: colorOk(a.color, d.color),
  };
}

export const newSlide = (kind = 'content', fields = {}) => ({
  id: uid(),
  kind,
  fields: {
    tag: '', num: '', heading: '', sub: '', body: '', stat: '', statLabel: '', quote: '', author: '', role: '', items: '', cta: '',
    ...fields,
  },
  media: defaultMedia(),
  el: {},
  valign: null,
  circle: defaultCircle(loadOverlayPrefs().circle),
  arrow: defaultArrow(loadOverlayPrefs().arrow),
  canvasLocked: false, // per-slide: blocks hand-editing on the canvas (the inspector keeps working)
  lockedDefault: false, // starter slides can be edited and moved but not deleted
});

/** Content a fresh slide of each kind starts with (so a new slide is never an empty void). */
export const PRESETS = {
  cover: { tag: 'New post', heading: 'A headline worth *stopping* for', sub: 'One line that makes the swipe feel obvious' },
  content: { tag: 'Point', heading: 'One idea per *slide*', body: 'Say it plainly. Give the reader a single takeaway they can repeat out loud.' },
  visual: { tag: 'Show it', heading: 'Let the *picture* lead', sub: 'Add an image in the Media tab' },
  stats: { tag: 'The data', stat: '3×', statLabel: 'more saves on posts with a clear next step', heading: 'Numbers make it *believable*', body: 'Pair every big claim with one proof point.' },
  quote: { tag: 'Remember', quote: 'Make it so clear it cannot be misread.', author: 'Your Name', role: 'Role or source' },
  list: { tag: 'Checklist', heading: 'The *short* list', items: 'First thing to do\nSecond thing to do\nThird thing to do\nFourth thing to do' },
  cta: { heading: 'Liked this? *Follow* for more', sub: 'Save it for later and send it to a friend', cta: 'Follow for more' },
};

export function sampleSlides() {
  const slides = [
    newSlide('cover', { tag: 'Creator guide', heading: 'Make carousels people *finish*', sub: 'A 6-slide playbook for posts that earn every swipe' }),
    newSlide('content', { tag: 'Step 1', heading: 'Open with a *promise*', body: 'Slide one has a single job: earn the swipe.\nName the payoff in under ten words, and make it concrete.' }),
    newSlide('stats', { tag: 'The data', stat: '82%', statLabel: 'of readers leave before slide five', heading: 'Front-load the *value*', body: 'Put your strongest idea on slide two, not slide nine.' }),
    newSlide('list', { tag: 'The flow', heading: 'A *four-part* structure', items: 'A hook that names the payoff\nOne idea per slide\nProof: a number, a story, a screenshot\nOne clear next step' }),
    newSlide('quote', { tag: 'Remember', quote: 'Clarity beats cleverness every single time.', author: 'Your Name', role: 'Founder, Your Studio' }),
    newSlide('visual', { tag: 'Show it', heading: 'Let the *picture* do the talking', sub: 'Drop your own image in the Media tab' }),
    newSlide('cta', { heading: 'Ready to *post* yours?', sub: 'Save this, share it, and follow for the next playbook.', cta: 'Follow @yourhandle' }),
  ];
  slides.forEach((s) => (s.lockedDefault = true));
  return slides;
}

export function defaultProject() {
  return {
    v: VERSION,
    name: 'Untitled carousel',
    template: 'cinematic',
    ratio: '4:5',
    theme: { palette: null, overrides: {}, texture: null, gradient: null, grad: { on: false, c1: '#1b2bff', c2: '#ff6a3d', angle: 160 } },
    type: { pairing: null, display: null, body: null, tracking: null, leading: null, scale: 1, weight: null, align: 'auto', caps: 'auto', autofit: true },
    shape: { radius: null, pad: null, gap: null },
    brand: { show: true, name: 'Your Name', handle: '@yourhandle', avatar: null, counter: true, swipe: true, pos: 'bottom', hideCover: false },
    slides: sampleSlides(),
  };
}

/* ---------- validation: anything from localStorage or an imported file passes through here ---------- */
const str = (v, max) => (typeof v === 'string' ? v.slice(0, max) : '');
const oneOf = (v, list, d) => (list.includes(v) ? v : d);

export function normalizeProject(raw, templateIds = []) {
  const d = defaultProject();
  if (!raw || typeof raw !== 'object') return d;
  const p = {
    v: VERSION,
    name: str(raw.name, 80) || d.name,
    template: templateIds.length && !templateIds.includes(raw.template) ? d.template : str(raw.template, 40) || d.template,
    ratio: oneOf(raw.ratio, Object.keys(RATIOS), d.ratio),
    theme: { palette: null, overrides: {}, texture: null, gradient: null, grad: { ...d.theme.grad } },
    type: { ...d.type },
    shape: { radius: null, pad: null, gap: null },
    brand: { ...d.brand },
    slides: [],
  };
  const th = raw.theme || {};
  p.theme.palette = PALETTES.some((x) => x.id === th.palette) ? th.palette : null;
  for (const k of ['bg', 'surface', 'text', 'accent', 'heading', 'body', 'tag', 'footer', 'hl']) {
    const h = th.overrides && normHex(th.overrides[k], null);
    if (h) p.theme.overrides[k] = h;
  }
  p.theme.texture = TEXTURES.some((x) => x.id === th.texture) ? th.texture : null;
  p.theme.gradient = GRADIENTS.some((x) => x.id === th.gradient) ? th.gradient : null;
  const g = th.grad || {};
  p.theme.grad = { on: !!g.on, c1: normHex(g.c1, '#1b2bff'), c2: normHex(g.c2, '#ff6a3d'), angle: num(g.angle, 160, 0, 360) };

  const ty = raw.type || {};
  p.type.pairing = PAIRINGS.some((x) => x.id === ty.pairing) ? ty.pairing : null;
  p.type.display = FONTS[ty.display] ? ty.display : null;
  p.type.body = FONTS[ty.body] ? ty.body : null;
  p.type.tracking = ty.tracking == null ? null : num(ty.tracking, null, -0.1, 0.2);
  p.type.leading = ty.leading == null ? null : num(ty.leading, null, 0.8, 1.7);
  p.type.scale = num(ty.scale, 1, 0.6, 1.6);
  p.type.weight = ty.weight == null ? null : num(ty.weight, null, 100, 900);
  p.type.align = oneOf(ty.align, ['auto', 'left', 'center', 'right'], 'auto');
  p.type.caps = oneOf(ty.caps, ['auto', 'on', 'off'], 'auto');
  p.type.autofit = ty.autofit !== false;

  const sh = raw.shape || {};
  p.shape.radius = sh.radius == null ? null : num(sh.radius, null, 0, 12);
  p.shape.pad = sh.pad == null ? null : num(sh.pad, null, 3, 12);
  p.shape.gap = sh.gap == null ? null : num(sh.gap, null, 0.3, 2.5);

  const b = raw.brand || {};
  p.brand = {
    show: b.show !== false,
    name: str(b.name, 60),
    handle: str(b.handle, 60),
    avatar: typeof b.avatar === 'string' ? b.avatar.slice(0, 40) : null,
    counter: b.counter !== false,
    swipe: b.swipe !== false,
    pos: oneOf(b.pos, ['bottom', 'top'], 'bottom'),
    hideCover: !!b.hideCover,
  };

  const slides = Array.isArray(raw.slides) ? raw.slides.slice(0, 40) : [];
  const seen = new Set();
  for (const s of slides) {
    if (!s || typeof s !== 'object') continue;
    const kind = oneOf(s.kind, Object.keys(KINDS), 'content');
    const base = newSlide(kind);
    for (const k of Object.keys(FIELDS)) base.fields[k] = str(s.fields && s.fields[k], FIELDS[k].max);
    const m = s.media || {};
    base.media = {
      asset: typeof m.asset === 'string' ? m.asset.slice(0, 40) : null,
      fit: oneOf(m.fit, ['cover', 'contain'], 'cover'),
      x: num(m.x, 50, 0, 100),
      y: num(m.y, 50, 0, 100),
      zoom: num(m.zoom, 1, 1, 4),
      opacity: num(m.opacity, 1, 0, 1),
      scrim: num(m.scrim, 55, 0, 100),
    };
    for (const k of EL_KEYS) {
      const e = s.el && s.el[k];
      if (!e || typeof e !== 'object') continue;
      const x = num(e.x, 0, -80, 80);
      const y = num(e.y, 0, -80, 80);
      const a = oneOf(e.a, ['left', 'center', 'right'], null);
      const sc = num(e.s, 1, 0.5, 2);
      if (x || y || a || sc !== 1) base.el[k] = { x, y, a, s: sc };
    }
    base.valign = oneOf(s.valign, ['top', 'middle', 'bottom'], null);
    base.circle = normCircle(s.circle, base.circle);
    base.arrow = normArrow(s.arrow, base.arrow);
    base.canvasLocked = !!s.canvasLocked;
    base.lockedDefault = !!s.lockedDefault;
    let id = typeof s.id === 'string' && s.id ? s.id.slice(0, 20) : base.id;
    while (seen.has(id)) id = uid();
    seen.add(id);
    base.id = id;
    p.slides.push(base);
  }
  if (!p.slides.length) p.slides = sampleSlides().slice(0, 1);
  return p;
}

export const assetIdsOf = (p) => {
  const set = new Set();
  if (p.brand.avatar) set.add(p.brand.avatar);
  for (const s of p.slides) {
    if (s.media.asset) set.add(s.media.asset);
    if (s.circle && s.circle.asset) set.add(s.circle.asset);
  }
  return set;
};

/** Inline `*highlight*` markup → safe HTML. */
export function inlineMarkup(text) {
  return esc(text).replace(/\*([^*\n]+)\*/g, '<span class="hl">$1</span>');
}
