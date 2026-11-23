import { u } from './_u.js';

export default {
  id: 'editorial',
  name: 'Minimal Editorial',
  category: 'Editorial',
  tags: ['serif', 'minimal', 'magazine', 'light', 'elegant'],
  blurb: 'Warm paper, hairline rules, a high-contrast serif with italic emphasis.',
  palette: 'paper',
  pairing: 'editorial',
  radius: 0,
  pad: 6.4,
  italic: true,
  media: 'frame',
  deco: () => `<i style="position:absolute;left:${u(6.4)};right:${u(6.4)};bottom:${u(6.4 + 9.6)};height:1px;background:color-mix(in srgb,var(--text) 22%,transparent)"></i>`,
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .hd { padding-bottom: ${u(2.4)}; border-bottom: 1px solid var(--text); }
& .tag { background: none; color: var(--accent); padding: 0; letter-spacing: 0.2em; font-size: ${u(2.3)}; font-weight: 600; }
& .num { display: block; font-size: ${u(2.3)}; letter-spacing: 0.2em; font-weight: 600; text-transform: uppercase; }
& .num::before { content: 'No. '; }
& .h { font-weight: 400; line-height: 1.02; }
& .hl { font-style: italic; color: var(--hl, var(--accent)); }
& [data-kind='cover'] .h { --h: 15.5; }
& [data-kind='content'] .h { --h: 11.5; }
& [data-kind='cta'] .h { --h: 13; }
& .sub { font-family: var(--fd); font-style: italic; font-size: ${u(5.4)}; line-height: 1.15; color: var(--muted); font-weight: 400; margin-top: ${u(2.6)}; }
& .body { max-width: 88%; font-size: ${u(3.5)}; }
& .stat { font-style: italic; color: var(--accent); font-size: ${u(34)}; line-height: 0.9; }
& .statl { font-weight: 500; font-size: ${u(3.6)}; max-width: 70%; }
& .q { font-size: ${u(9.4)}; line-height: 1.05; font-weight: 400; }
& .q p::before { content: '\\201C'; display: block; font-size: 2.4em; line-height: 0.62; color: var(--accent); margin-bottom: 0.12em; }
& .q p::after { content: ''; }
& .by { flex-direction: row; gap: ${u(2)}; align-items: baseline; font-size: ${u(3.2)}; text-transform: uppercase; letter-spacing: 0.12em; }
& .by b::after { content: ' —'; }
& .items { gap: 0; }
& .items li { padding: ${u(2.4)} 0; border-top: 1px solid color-mix(in srgb, var(--text) 24%, transparent); font-size: ${u(4.2)}; }
& .items li:last-child { border-bottom: 1px solid color-mix(in srgb, var(--text) 24%, transparent); }
& .items .n { font-family: var(--fd); font-style: italic; font-weight: 400; font-size: 1.1em; letter-spacing: 0; }
& .inner > .media { border-radius: 0; }
& .cbtn { border-radius: 0; background: var(--text); color: var(--bg); letter-spacing: 0.14em; text-transform: uppercase; font-size: ${u(2.8)}; padding: ${u(2.2)} ${u(4.4)}; }
& .ft { padding-top: ${u(2.6)}; }
& .sw { background: none; color: var(--text); border: 1px solid var(--text); }
`,
};
