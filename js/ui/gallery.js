// Template gallery: category filter + search, live previews rendered with the user's own content.
import { getProject, ui, commit, undo } from '../state.js';
import { TEMPLATE_LIST, CATEGORIES } from '../templates/index.js';
import { PAIRINGS, RATIOS } from '../schema.js';
import { slideMarkup, invalidateFit } from '../render.js';
import { toast } from './toast.js';
import { $, debounce, esc } from '../util.js';

let cat = 'All';
let q = '';
let token = 0;
let fontsDone = false;

async function loadAllFonts() {
  if (fontsDone) return;
  const names = new Set();
  TEMPLATE_LIST.forEach((t) => {
    const pr = PAIRINGS.find((x) => x.id === t.pairing);
    if (pr) {
      names.add(`${pr.hw} 40px "${pr.display}"`);
      names.add(`400 20px "${pr.body}"`);
      names.add(`700 20px "${pr.body}"`);
    }
  });
  names.add('500 20px "JetBrains Mono"');
  await Promise.all([...names].map((f) => document.fonts.load(f).catch(() => [])));
  fontsDone = true;
  invalidateFit();
}

/** The project as it would look in template `t`. */
function preview(t, keepLook) {
  const p = getProject();
  if (keepLook) return { ...p, template: t.id };
  return {
    ...p,
    template: t.id,
    theme: { ...p.theme, palette: null, overrides: {}, texture: null, gradient: null, grad: { ...p.theme.grad, on: false } },
    type: { ...p.type, pairing: null, weight: null, display: null, body: null, tracking: null, leading: null },
    shape: { radius: null, pad: null, gap: null },
  };
}

const matches = (t) => {
  if (cat !== 'All' && t.category !== cat) return false;
  if (!q) return true;
  const hay = [t.name, t.category, t.blurb, ...(t.tags || [])].join(' ').toLowerCase();
  return q
    .toLowerCase()
    .split(/\s+/)
    .every((w) => hay.includes(w));
};

async function paint() {
  const my = ++token;
  const grid = $('#galGrid');
  const p = getProject();
  const keep = $('#keepLook').checked;
  const list = TEMPLATE_LIST.filter(matches);
  const ar = RATIOS[p.ratio].join('/');
  grid.innerHTML = list.length
    ? list
        .map((t) => `<button class="card" data-tpl="${t.id}" aria-current="${t.id === p.template}"><div class="pv" style="--ar:${ar}"><div class="cwrap"></div></div><b>${esc(t.name)}</b><span>${esc(t.blurb)}</span></button>`)
        .join('')
    : '<p class="empty">No templates match that search.</p>';
  await loadAllFonts();
  if (my !== token) return;
  const cards = [...grid.querySelectorAll('.card')];
  // fill in small batches per frame so the dialog opens instantly and never blocks input
  for (let i = 0; i < cards.length; i += 3) {
    if (my !== token) return;
    cards.slice(i, i + 3).forEach((c) => {
      const t = TEMPLATE_LIST.find((x) => x.id === c.dataset.tpl);
      c.querySelector('.cwrap').innerHTML = slideMarkup(preview(t, keep), Math.min(ui.slide, p.slides.length - 1), 'static');
    });
    await new Promise((r) => requestAnimationFrame(r));
  }
}

export function applyTemplate(id, keepLook) {
  const t = TEMPLATE_LIST.find((x) => x.id === id);
  if (!t) return;
  const changed = commit(
    (p) => {
      p.template = id;
      if (!keepLook) {
        p.theme = { ...p.theme, palette: null, overrides: {}, texture: null, gradient: null, grad: { ...p.theme.grad, on: false } };
        Object.assign(p.type, { pairing: null, weight: null, display: null, body: null, tracking: null, leading: null });
        p.shape = { radius: null, pad: null, gap: null };
      }
    },
    { scope: 'structure' }
  );
  if (changed) toast(`Template: ${t.name}`, { action: 'Undo', onAction: undo });
}

export function openGallery() {
  const dlg = $('#gallery');
  if (!dlg.open) dlg.showModal();
  $('#galSearch').value = q = '';
  cat = 'All';
  renderCats();
  paint();
}

function renderCats() {
  $('#galCats').innerHTML = CATEGORIES.map((c) => `<button class="chip" role="tab" aria-selected="${c === cat}" data-cat="${esc(c)}">${esc(c)}</button>`).join('');
}

export function initGallery() {
  const dlg = $('#gallery');
  $('#galCats').addEventListener('click', (e) => {
    const b = e.target.closest('[data-cat]');
    if (!b) return;
    cat = b.dataset.cat;
    renderCats();
    paint();
  });
  const search = debounce(() => {
    q = $('#galSearch').value.trim();
    paint();
  }, 90);
  $('#galSearch').addEventListener('input', search);
  $('#keepLook').addEventListener('change', paint);
  $('#galGrid').addEventListener('click', (e) => {
    const c = e.target.closest('[data-tpl]');
    if (!c) return;
    applyTemplate(c.dataset.tpl, $('#keepLook').checked);
    dlg.close();
  });
  dlg.addEventListener('click', (e) => e.target === dlg && dlg.close());
  dlg.addEventListener('close', () => {
    token++;
    $('#galGrid').replaceChildren();
  });
}
