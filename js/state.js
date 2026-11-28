// Project store: immutable-style commits, coalesced undo/redo, debounced autosave.
import { defaultProject, normalizeProject, assetIdsOf } from './schema.js';
import { debounce } from './util.js';

const KEY = 'carousel-studio:project:v1';
const MAX_HISTORY = 100;
const COALESCE_MS = 800;

let project = defaultProject();
let past = [];
let future = [];
let lastKey = null;
let lastAt = 0;
const listeners = new Set();
let templateIds = [];

/* ui: transient editor state, never saved. circleMode = what dragging the circle moves; pasteTo = where a pasted image goes. */
export const ui = { slide: 0, el: null, circleMode: 'circle', pasteTo: 'main' };

export const getProject = () => project;
export const setTemplateIds = (ids) => (templateIds = ids);
export const canUndo = () => past.length > 0;
export const canRedo = () => future.length > 0;
export const historyAssetIds = () => {
  const set = new Set(assetIdsOf(project));
  for (const p of past) assetIdsOf(p).forEach((a) => set.add(a));
  for (const p of future) assetIdsOf(p).forEach((a) => set.add(a));
  return set;
};

export const subscribe = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
const emit = (meta) => listeners.forEach((fn) => fn(project, meta));

export const clampSlide = () => {
  ui.slide = Math.max(0, Math.min(ui.slide, project.slides.length - 1));
};

/**
 * Apply a mutation to a copy of the project.
 * opts.key      – consecutive commits with the same key inside 800ms share one undo step (typing, sliders)
 * opts.scope    – 'slide' (opts.ids) | 'global' | 'structure'; tells the UI what to repaint
 */
export function commit(mutate, opts = {}) {
  const next = structuredClone(project);
  mutate(next);
  if (JSON.stringify(next) === JSON.stringify(project)) return false;
  const now = performance.now();
  if (!(opts.key && opts.key === lastKey && now - lastAt < COALESCE_MS)) {
    past.push(project);
    if (past.length > MAX_HISTORY) past.shift();
  }
  future = [];
  lastKey = opts.key || null;
  lastAt = now;
  project = next;
  clampSlide();
  save();
  emit({ scope: opts.scope || 'global', ids: opts.ids || null, source: opts.source || null, silent: !!opts.silent });
  return true;
}

export function undo() {
  if (!past.length) return false;
  future.push(project);
  project = past.pop();
  lastKey = null;
  clampSlide();
  save();
  emit({ scope: 'structure', ids: null, source: 'history' });
  return true;
}
export function redo() {
  if (!future.length) return false;
  past.push(project);
  project = future.pop();
  lastKey = null;
  clampSlide();
  save();
  emit({ scope: 'structure', ids: null, source: 'history' });
  return true;
}

/** Replace the whole project (import / reset). Clears history. */
export function replaceProject(raw, { keepHistory = false } = {}) {
  const next = normalizeProject(raw, templateIds);
  if (keepHistory) past.push(project);
  else past = [];
  future = [];
  project = next;
  lastKey = null;
  ui.slide = 0;
  ui.el = null;
  save();
  emit({ scope: 'structure', ids: null, source: 'replace' });
}

export function selectEl(k) {
  if (ui.el === k) return;
  ui.el = k;
  emit({ scope: 'sel', ids: null, source: 'sel' });
}

export function selectSlide(i) {
  const n = Math.max(0, Math.min(i, project.slides.length - 1));
  if (n === ui.slide) return;
  ui.slide = n;
  ui.el = null;
  try {
    localStorage.setItem(KEY + ':slide', String(n));
  } catch {
    /* storage may be unavailable */
  }
  emit({ scope: 'select', ids: null, source: 'select' });
}

/* ---------- persistence ---------- */
let onSaveError = () => {};
export const setSaveErrorHandler = (fn) => (onSaveError = fn);
let warned = false;
const write = () => {
  try {
    localStorage.setItem(KEY, JSON.stringify(project));
  } catch (e) {
    if (!warned) {
      warned = true;
      onSaveError(e);
    }
  }
};
const save = debounce(write, 250);
export const flushSave = () => save.flush();
if (typeof window !== 'undefined') {
  window.addEventListener('pagehide', () => save.flush());
  document.addEventListener('visibilitychange', () => document.visibilityState === 'hidden' && save.flush());
}

export function loadSaved() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return false;
    project = normalizeProject(JSON.parse(raw), templateIds);
    const s = parseInt(localStorage.getItem(KEY + ':slide') || '0', 10);
    ui.slide = Number.isFinite(s) ? s : 0;
    clampSlide();
    return true;
  } catch {
    return false;
  }
}

export function resetProject() {
  try {
    localStorage.removeItem(KEY);
  } catch {
    /* ignore */
  }
  replaceProject(defaultProject(), { keepHistory: true });
}
