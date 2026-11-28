# Carousel Studio

Browser-based Instagram carousel designer. Pick a template, edit on canvas, export 2x PNG / ZIP / PDF. No build step, no backend, no tracking. Runs on GitHub Pages as-is.

## 1. Overview & features

- **20 curated templates**: Dark Editorial, Bold Hook, Swiss Breakdown, Notes Thread, Cinematic Photo, Versus Card, Big Stat, Step-by-Step Playbook, Magazine Quote, Split-Screen, Minimal Editorial, Breaking News, plus Glass Card, Gallery Poster, Bento Grid, Action Checklist, Broadsheet Column, Monolith Luxe, Case Study Card and Duotone Studio.
- **WCAG-checked palettes**: 24 palettes (dark creator, light editorial, refined accent); `npm run check` fails if any text/muted/accent pairing drops below AA (body text targets AAA).
- **Circle photo + arrow overlays** on every slide (off by default; last-used styling is remembered).
- **Per-slide canvas lock** (`L`): blocks hand-editing on the canvas; the inspector, Block selector and X/Y sliders keep working. Starter slides can be edited and reordered but not deleted (duplicate them for a removable copy).
- **Canvas**: 4:5 (1080x1350) default; instant 1:1, 9:16, 16:9. Slides are real DOM, so stage, filmstrip, gallery and export render identically.
- **Full control**: drag any text block on canvas, X/Y nudge sliders, align (left/centre/right, top/middle/bottom), padding, element spacing. Inline text editing + sidebar fields.
- **Type**: 16 fonts, independent heading/body pickers, size, weight, letter-spacing, line-height, alignment, text case.
- **Colour**: independent pickers for background, surface, headline, body, accent, tag/badge, footer. 17 palettes, custom gradient, grain/grid textures.
- **Images**: per-slide upload, drag, pinch/wheel zoom, opacity, scrim. Large images auto-downscaled. Stored in IndexedDB.
- **Slides**: add, duplicate, delete, drag-reorder, undo/redo (Ctrl/Cmd+Z), zero-loss template switching.
- **Brand bar**: name, handle, avatar, slide counter, swipe arrow toggles.
- **Custom controls**: Studio select sheets/popovers (live font previews), a colour picker (SV pad, hue, hex, swatches), switches, one-tap clipboard Paste per image slot, a compact ratio menu and a full-screen swipe Preview. No native selects, colour dialogs or checkboxes.
- **Highlight colour** (Design → Colours → Highlight) overrides the template's `*word*` colour.
- **Studio UI**: dark only. Slide palettes (light or dark) are unaffected.
- **Export**: PNG (2x), ZIP of all slides, PDF; project JSON save/load. Autosave to browser.
- Respects `prefers-reduced-motion`.

## 2. Local setup

Needs any static server. No install step.

```bash
# Node 18+
npm start            # http://localhost:5173

# or Python
python3 -m http.server 8077

npm run check        # syntax, imports, html refs, template schema
```

ES modules need `http://`; opening `index.html` via `file://` will not work.

## 3. Deploy to GitHub Pages

1. Create a GitHub repo, e.g. `carousel-studio`.
2. Push this folder to the `main` branch:
   ```bash
   git init && git add . && git commit -m "Carousel Studio"
   git branch -M main
   git remote add origin https://github.com/<you>/carousel-studio.git
   git push -u origin main
   ```
3. Repo **Settings → Pages → Build and deployment → Source: GitHub Actions**.
4. The included workflow (`.github/workflows/deploy.yml`) validates, then deploys. Watch the **Actions** tab.
5. Site goes live at `https://<you>.github.io/carousel-studio/`.

Alternative without Actions: Settings → Pages → Source **Deploy from a branch** → `main` / `/ (root)`.

All paths are relative, so project sites under a sub-path work. `.nojekyll` is included.

## 4. Folder structure

```
index.html            app shell
css/
  studio.css          editor chrome, dark/light tokens
  slide.css           shared slide skeleton (regions: .hd .media .mn .ft)
js/
  main.js             boot, render scheduler, shortcuts, canvas lock, export dialog
  schema.js           fonts, palettes, pairings, project shape, normalizeProject
  state.js            project store, commit(), undo/redo, autosave
  render.js           slide -> HTML, style injection, auto-fit
  ui/controls.js      select / colour-picker / switch components
  ui/sheet.js         bottom sheet + popover primitive
  ui/preview.js       swipe preview
  overlays.js         circle photo + arrow markup / geometry (DOM + SVG)
  export.js           PNG / ZIP / PDF
  assets.js           image store (IndexedDB), downscale, GC
  util.js
  ui/                 stage, filmstrip, inspector, gallery, toast
  templates/          one file per template + index.js
fonts/                self-hosted woff2
vendor/               html-to-image, jszip, jspdf (+ licenses)
scripts/              serve.mjs, validate.mjs
.github/workflows/    Pages deploy
```

## 5. Add a template

1. Create `js/templates/my-template.js`:

   ```js
   import { u } from './_u.js';

   export default {
     id: 'my-template',            // unique, kebab-case
     name: 'My Template',
     category: 'Editorial',        // gallery filter group
     tags: ['search', 'words'],
     blurb: 'One line shown in the gallery.',
     palette: 'ink',               // id from PALETTES in schema.js
     pairing: 'grotesk',           // id from PAIRINGS in schema.js
     radius: 2,                    // corner radius, in u
     pad: 6,                       // slide padding, in u
     media: 'frame',               // image treatment
     css: `
   & { --mn-top: 1; --mn-bot: 0; }
   & .h { font-weight: 700; }
   & [data-kind='cover'] .h { --h: 13; }
   & .tag { background: var(--accent); color: var(--on-accent); }
   `,
     };
   ```

2. Register it in `js/templates/index.js` (import + add to the `TEMPLATES` list).
3. `npm run check`, then open the gallery.

Rules:
- `&` is the slide root. Scope rules to it.
- **Never use px.** Size with `u(n)` (= `calc(var(--u) * n)`; 1u = 1% of slide width, capped by height). That keeps every ratio and export pixel-identical.
- Colour via tokens: `--bg --surface --text --accent --muted --on-accent --hc --bc`. User overrides (headline, body, tag, footer) are applied by the base skeleton.
- Slide kinds: `cover`, `title`, `body`, `list`, `stat`, `quote`, `cta`. Target with `[data-kind='...']`.
- Hooks: `data-el="tag|heading|sub|body|stat|statl|quote|by|items|btn|brand"` blocks accept user x/y/align offsets (`slide.el[key] = {x, y, a}`, in u). Do not set `translate` on them.
- List rows split on `|` into `.c1` / `.c2` (see `versus.js`).
- Vertical anchoring: `--mn-top` / `--mn-bot` flex spacers; users can override via the Slide tab.
