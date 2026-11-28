import { u } from './_u.js';

const frame = () => `<i style="position:absolute;inset:${u(3.2)};border:1px solid color-mix(in srgb,var(--text) 38%,transparent)"></i>`;

export default {
  id: 'gallery-poster',
  name: 'Gallery Poster',
  category: 'Editorial',
  tags: ['gallery', 'frame', 'poster', 'museum', 'portfolio', 'art', 'light'],
  blurb: 'Wide-mat art-print frame, centred serif and museum-label captions for film, culture and portfolio.',
  palette: 'stone',
  pairing: 'classic',
  radius: 0,
  pad: 8.4,
  media: 'frame',
  deco: frame,
  css: `
& { --mn-top: 1; --mn-bot: 1; --ai: center; --ta: center; }
& .hd { justify-content: center; position: relative; }
& .tag { background: none; color: var(--text); padding: 0; font-family: var(--fm); font-size: ${u(2.1)}; letter-spacing: 0.22em; font-weight: 500; }
& .num { display: block; position: absolute; right: 0; font-family: var(--fm); font-size: ${u(2.1)}; letter-spacing: 0.14em; color: var(--muted); }
& .num::before { content: 'FIG. '; }
& .inner > .media { margin: ${u(2.4)}; border-radius: 0; box-shadow: 0 0 0 ${u(2.4)} var(--surface), 0 0 0 calc(${u(2.4)} + 1px) color-mix(in srgb, var(--text) 30%, transparent), 0 ${u(3)} ${u(7)} rgb(0 0 0 / 0.2); }
& .h { font-weight: 400; line-height: 1.04; }
& .hl { font-style: italic; color: var(--hl, var(--accent)); }
& [data-kind='cover'] .h { --h: 13; }
& [data-kind='visual'] .h { --h: 6.6; }
& .sub { font-family: var(--fm); font-size: ${u(2.4)}; letter-spacing: 0.16em; text-transform: uppercase; color: var(--muted); }
& .body { max-width: 86%; font-size: ${u(3.4)}; }
& .stat { font-weight: 400; font-style: italic; font-size: ${u(30)}; }
& .statl { font-family: var(--fm); font-size: ${u(2.4)}; letter-spacing: 0.14em; text-transform: uppercase; font-weight: 500; }
& .q { font-weight: 400; font-style: italic; font-size: ${u(8.4)}; line-height: 1.12; }
& .by { align-items: center; font-family: var(--fm); font-size: ${u(2.3)}; letter-spacing: 0.16em; text-transform: uppercase; }
& .by b::after { content: ''; display: block; width: ${u(6)}; height: 1px; background: var(--text); margin: ${u(1.6)} auto; }
& .items { gap: 0; }
& .items li { grid-template-columns: minmax(0, 1fr); text-align: center; padding: ${u(2.2)} 0; border-top: 1px solid color-mix(in srgb, var(--text) 24%, transparent); font-family: var(--fd); font-size: ${u(4.6)}; }
& .items li:last-child { border-bottom: 1px solid color-mix(in srgb, var(--text) 24%, transparent); }
& .items .n { display: none; }
& .cbtn { border-radius: 0; background: var(--text); color: var(--surface); font-family: var(--fm); font-weight: 500; font-size: ${u(2.4)}; letter-spacing: 0.18em; text-transform: uppercase; padding: ${u(2.2)} ${u(5)}; }
& .ft { justify-content: center; gap: ${u(4)}; }
& .sw { display: none; }
`,
};
