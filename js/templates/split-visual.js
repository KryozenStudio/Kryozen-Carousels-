import { u } from './_u.js';

export default {
  id: 'split-visual',
  name: 'Clean Split-Screen',
  category: 'Photo',
  tags: ['photo', 'split', 'half', 'sage', 'clean'],
  blurb: 'Edge-to-edge image on one half, a calm colour field with serif type on the other.',
  palette: 'sage',
  pairing: 'classic',
  radius: 0,
  pad: 6.2,
  media: 'frame',
  css: `
& { --mn-top: 0; --mn-bot: 1; }
& [data-mm='frame'] .inner { padding: 0; row-gap: 0; grid-template-rows: minmax(0, 1fr) minmax(0, 1fr); grid-template-areas: 'md' 'mn'; }
& [data-mm='frame'][data-kind='visual'] .inner { grid-template-rows: minmax(0, 1.5fr) minmax(0, 1fr); }
& [data-mm='frame'] .inner > .media { border-radius: 0; }
& [data-mm='frame'] .mn { padding: ${u(6.2)} ${u(6.2)} ${u(15)}; background: var(--surface); }
& [data-mm='frame'] .hd { position: absolute; top: ${u(5)}; left: ${u(5.6)}; right: ${u(5.6)}; z-index: 3; }
& [data-mm='frame'] .ft { position: absolute; bottom: ${u(5)}; left: ${u(6.2)}; right: ${u(6.2)}; z-index: 3; }
@container (min-aspect-ratio: 5/4) {
  & [data-mm='frame'] .inner { grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); grid-template-rows: minmax(0, 1fr); grid-template-areas: 'md mn'; column-gap: 0; }
}
& [data-mm='none'] .hd { padding-bottom: ${u(2)}; }
& .tag { background: var(--text); color: var(--bg); font-size: ${u(2.1)}; }
& [data-mm='frame'] .tag { background: var(--surface); color: var(--text); }
& .num { display: block; font-family: var(--fd); font-size: ${u(5)}; font-weight: 500; color: var(--accent); }
& [data-mm='frame'] .num { color: #fff; text-shadow: 0 0 ${u(2)} rgb(0 0 0 / 0.5); }
& .h { font-weight: 600; }
& .hl { color: var(--hl, var(--accent)); font-style: italic; }
& [data-kind='cover'] .h { --h: 10.4; }
& [data-kind='content'] .h { --h: 8.4; }
& [data-kind='visual'] .h { --h: 7.2; }
& [data-kind='cta'] .h { --h: 9.6; }
& .sub { font-size: ${u(3.5)}; margin-top: ${u(1.6)}; }
& .body { font-size: ${u(3.3)}; }
& .stat { font-size: ${u(22)}; }
& .q { font-size: ${u(7)}; font-weight: 500; }
& .q p::before { color: var(--accent); }
& .items li { font-size: ${u(3.8)}; }
& .cbtn { background: var(--text); color: var(--bg); border-radius: ${u(1.2)}; }
& .sw { background: var(--text); color: var(--bg); }
& [data-mm='frame'] .brand { color: var(--text); }
`,
};
