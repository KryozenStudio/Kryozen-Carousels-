// Repo health check: every JS file parses, every relative import / asset reference exists, every template is well-formed.
import { readdir, readFile, access } from 'node:fs/promises';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { execFileSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
let bad = 0;
const fail = (m) => (console.error('✗', m), bad++);
const exists = (p) => access(p).then(() => true, () => false);

async function walk(dir) {
  const out = [];
  for (const e of await readdir(dir, { withFileTypes: true })) {
    if (['node_modules', '.git', 'vendor'].includes(e.name)) continue;
    const p = join(dir, e.name);
    if (e.isDirectory()) out.push(...(await walk(p)));
    else out.push(p);
  }
  return out;
}

const files = await walk(root);
for (const f of files.filter((f) => f.endsWith('.js') || f.endsWith('.mjs'))) {
  try {
    execFileSync(process.execPath, ['--check', f], { stdio: 'pipe' });
  } catch (e) {
    fail(`syntax: ${f}\n${e.stderr}`);
  }
  const src = await readFile(f, 'utf8');
  for (const m of src.matchAll(/from\s+'(\.[^']+)'/g)) if (!(await exists(resolve(dirname(f), m[1])))) fail(`${f}: missing import ${m[1]}`);
}
const html = await readFile(join(root, 'index.html'), 'utf8');
for (const m of html.matchAll(/(?:src|href)="((?!https?:|data:|#)[^"]+)"/g)) if (!(await exists(join(root, m[1])))) fail(`index.html: missing ${m[1]}`);
if (/(?:src|href)=["']\//.test(html)) fail('index.html: absolute path breaks GitHub Pages sub-paths');

const { TEMPLATE_LIST } = await import(pathToFileURL(join(root, 'js/templates/index.js')).href);
const { PALETTES, PAIRINGS } = await import(pathToFileURL(join(root, 'js/schema.js')).href);
const { contrast, onColor } = await import(pathToFileURL(join(root, 'js/util.js')).href);

/* WCAG audit of every slide palette: AAA preferred for body text, AA is the hard floor. */
const pids = new Set();
for (const p of PALETTES) {
  if (pids.has(p.id)) fail(`duplicate palette id ${p.id}`);
  pids.add(p.id);
  for (const k of ['bg', 'surface', 'text', 'muted', 'accent', 'accent2']) if (!/^#[0-9a-f]{6}$/i.test(p[k] || '')) fail(`palette ${p.id}: ${k} must be #rrggbb`);
  const need = (label, a, b, min) => {
    const c = contrast(a, b);
    if (c < min) fail(`palette ${p.id}: ${label} ${c.toFixed(2)}:1 < ${min}:1`);
  };
  need('text/bg', p.text, p.bg, 7);
  need('text/surface', p.text, p.surface, 7);
  need('muted/bg', p.muted, p.bg, 4.5);
  need('muted/surface', p.muted, p.surface, 4.5);
  need('accent/bg', p.accent, p.bg, 3);
  need('accent label (onColor)', p.accent, onColor(p.accent), 4.5);
  need('accent2 label (onColor)', p.accent2, onColor(p.accent2), 4.5);
}
if (PALETTES.length < 20) fail(`expected a rich palette set, found ${PALETTES.length}`);

const seen = new Set();
for (const t of TEMPLATE_LIST) {
  for (const k of ['id', 'name', 'category', 'blurb', 'palette', 'pairing', 'css']) if (!t[k]) fail(`template ${t.id}: missing ${k}`);
  if (seen.has(t.id)) fail(`duplicate template id ${t.id}`);
  seen.add(t.id);
  if (!PALETTES.some((p) => p.id === t.palette)) fail(`template ${t.id}: unknown palette ${t.palette}`);
  if (!PAIRINGS.some((p) => p.id === t.pairing)) fail(`template ${t.id}: unknown pairing ${t.pairing}`);
}
console.log(bad ? `\n${bad} problem(s)` : `OK: ${files.length} files, ${TEMPLATE_LIST.length} templates, ${PALETTES.length} palettes (all WCAG AA+)`);
process.exit(bad ? 1 : 0);
