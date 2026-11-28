// Image assets: downscaled on import, persisted in IndexedDB, exposed as object URLs that are revoked when unreferenced.
import { uid } from './util.js';

const DB = 'carousel-studio';
const STORE = 'assets';
const MAX_SIDE = 2600;
const MAX_FILE = 60 * 1024 * 1024;
export const ACCEPT = 'image/png,image/jpeg,image/webp,image/gif,image/avif';

const mem = new Map(); // id -> { blob, url, w, h, name }
let dbp = null;

function db() {
  if (dbp) return dbp;
  dbp = new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB, 1);
      req.onupgradeneeded = () => req.result.createObjectStore(STORE);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
      req.onblocked = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbp;
}

async function idb(mode, fn) {
  const d = await db();
  if (!d) return undefined;
  return new Promise((resolve) => {
    try {
      const tx = d.transaction(STORE, mode);
      const res = fn(tx.objectStore(STORE));
      tx.oncomplete = () => resolve(res && 'result' in res ? res.result : undefined);
      tx.onerror = tx.onabort = () => resolve(undefined);
    } catch {
      resolve(undefined);
    }
  });
}

export const urlOf = (id) => (id && mem.get(id) ? mem.get(id).url : '');
export const infoOf = (id) => mem.get(id) || null;
export const has = (id) => mem.has(id);

function register(id, blob, w, h, name) {
  const old = mem.get(id);
  if (old) URL.revokeObjectURL(old.url);
  mem.set(id, { blob, url: URL.createObjectURL(blob), w, h, name });
}

async function decode(file) {
  try {
    const bmp = await createImageBitmap(file, { imageOrientation: 'from-image' });
    return { src: bmp, w: bmp.width, h: bmp.height, close: () => bmp.close && bmp.close() };
  } catch {
    // Fallback for browsers that cannot decode this type through createImageBitmap
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return { src: img, w: img.naturalWidth, h: img.naturalHeight, close: () => {} };
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

function hasAlpha(src, w, h) {
  const c = document.createElement('canvas');
  c.width = c.height = 48;
  const g = c.getContext('2d', { willReadFrequently: true });
  g.drawImage(src, 0, 0, w, h, 0, 0, 48, 48);
  const d = g.getImageData(0, 0, 48, 48).data;
  for (let i = 3; i < d.length; i += 4) if (d[i] < 250) return true;
  return false;
}

/** Import a user file. Returns { id } or throws an Error with a user-facing message. */
export async function addImage(file) {
  if (!file || !/^image\/(png|jpe?g|webp|gif|avif)$/.test(file.type)) throw new Error('Use a PNG, JPG, WebP, GIF or AVIF image.');
  if (file.size > MAX_FILE) throw new Error('That image is over 60 MB. Try a smaller export.');
  let img;
  try {
    img = await decode(file);
  } catch {
    throw new Error('That image could not be read.');
  }
  const k = Math.min(1, MAX_SIDE / Math.max(img.w, img.h));
  const w = Math.max(1, Math.round(img.w * k));
  const h = Math.max(1, Math.round(img.h * k));
  let blob = file;
  const needsWork = k < 1 || file.type === 'image/gif' || file.type === 'image/avif' || file.size > 6 * 1024 * 1024;
  if (needsWork) {
    const c = document.createElement('canvas');
    c.width = w;
    c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    const alpha = hasAlpha(img.src, img.w, img.h);
    if (!alpha) {
      g.fillStyle = '#fff';
      g.fillRect(0, 0, w, h);
    }
    g.drawImage(img.src, 0, 0, w, h);
    blob = await new Promise((r) => c.toBlob(r, alpha ? 'image/png' : 'image/jpeg', 0.9));
    if (!blob) throw new Error('That image could not be processed.');
  }
  img.close();
  const id = 'a' + uid();
  register(id, blob, w, h, file.name || 'image');
  idb('readwrite', (s) => s.put({ blob, w, h, name: file.name || 'image' }, id));
  return { id, w, h };
}

/** Load assets referenced by a project (from IndexedDB). Missing ones are reported. */
export async function loadMany(ids) {
  const missing = [];
  await Promise.all(
    [...ids].map(async (id) => {
      if (mem.has(id)) return;
      const rec = await idb('readonly', (s) => s.get(id));
      if (rec && rec.blob) register(id, rec.blob, rec.w, rec.h, rec.name);
      else missing.push(id);
    })
  );
  return missing;
}

/** Revoke object URLs and delete stored blobs nothing references any more (project + undo history). */
export function gc(referenced) {
  for (const id of [...mem.keys()]) {
    if (referenced.has(id)) continue;
    URL.revokeObjectURL(mem.get(id).url);
    mem.delete(id);
    idb('readwrite', (s) => s.delete(id));
  }
}

/* ---------- project import / export helpers ---------- */
export const blobToDataURL = (blob) =>
  new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });

export async function exportAssets(ids) {
  const out = {};
  for (const id of ids) {
    const a = mem.get(id);
    if (a) out[id] = { name: a.name, w: a.w, h: a.h, data: await blobToDataURL(a.blob) };
  }
  return out;
}

/** Re-register assets from an imported file. Returns id remapping-free (ids are kept). */
export async function importAssets(map) {
  if (!map || typeof map !== 'object') return;
  for (const [id, a] of Object.entries(map)) {
    if (!/^[\w-]{1,40}$/.test(id) || !a || typeof a.data !== 'string' || !/^data:image\/(png|jpe?g|webp|gif|avif);base64,/.test(a.data)) continue;
    const blob = await (await fetch(a.data)).blob();
    register(id, blob, a.w | 0, a.h | 0, String(a.name || 'image').slice(0, 80));
    idb('readwrite', (s) => s.put({ blob, w: a.w | 0, h: a.h | 0, name: String(a.name || 'image').slice(0, 80) }, id));
  }
}

/** Delete stored blobs from earlier sessions that the current project no longer references. */
export async function prune(keep) {
  const d = await db();
  if (!d) return;
  await new Promise((resolve) => {
    try {
      const tx = d.transaction(STORE, 'readwrite');
      const st = tx.objectStore(STORE);
      const req = st.getAllKeys();
      req.onsuccess = () => req.result.forEach((k) => !keep.has(k) && st.delete(k));
      tx.oncomplete = tx.onerror = tx.onabort = () => resolve();
    } catch {
      resolve();
    }
  });
}
