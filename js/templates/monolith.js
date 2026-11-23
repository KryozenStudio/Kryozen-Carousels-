import { u } from './_u.js';

export default {
  id: 'monolith',
  name: 'Monolith Luxe',
  category: 'Minimal',
  tags: ['luxury', 'minimal', 'dark', 'monolith', 'brand', 'premium', 'centered'],
  blurb: 'Near-black field, vast negative space, razor-thin framing and quiet champagne accents.',
  palette: 'onyx',
  pairing: 'editorial',
  radius: 0,
  pad: 8.4,
  media: 'frame',
  deco: () => `<i style="position:absolute;inset:${u(3.4)};border:1px solid color-mix(in srgb,var(--accent) 34%,transparent)"></i>`,
  css: `
& { --mn-top: 1; --mn-bot: 1; --ai: center; --ta: center; }
& .hd { justify-content: center; position: relative; }
& .tag { background: none; color: var(--accent); padding: 0; font-size: ${u(2)}; letter-spacing: 0.34em; font-weight: 500; }
& .num { display: block; position: absolute; right: 0; font-size: ${u(2)}; letter-spacing: 0.24em; color: var(--muted); }
& .h { font-weight: 400; line-height: 1.06; letter-spacing: -0.005em; }
& .hl { font-style: italic; color: var(--hl, var(--accent)); }
& [data-kind='cover'] .h { --h: 14; }
& [data-kind='content'] .h { --h: 10; }
& .sub { font-size: ${u(2.6)}; letter-spacing: 0.24em; text-transform: uppercase; color: var(--muted); margin-top: ${u(4)}; max-width: 80%; }
& .body { max-width: 78%; font-size: ${u(3.3)}; line-height: 1.7; color: var(--muted); }
& .stat { font-weight: 400; font-size: ${u(30)}; letter-spacing: -0.02em; }
& .statl { font-size: ${u(2.6)}; letter-spacing: 0.2em; text-transform: uppercase; font-weight: 500; color: var(--muted); }
& .q { font-weight: 400; font-style: italic; font-size: ${u(8.6)}; line-height: 1.14; }
& .q p::before { color: var(--accent); }
& .by { align-items: center; font-size: ${u(2.4)}; letter-spacing: 0.2em; text-transform: uppercase; }
& .by b { font-weight: 500; }
& .items { gap: 0; }
& .items li { grid-template-columns: minmax(0, 1fr); text-align: center; padding: ${u(2.6)} 0; border-top: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); font-family: var(--fd); font-size: ${u(4.8)}; }
& .items li:last-child { border-bottom: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); }
& .items .n { display: none; }
& .inner > .media { margin: ${u(1.4)} ${u(3)}; border-radius: 0; box-shadow: 0 0 0 ${u(1.2)} var(--bg), 0 0 0 calc(${u(1.2)} + 1px) color-mix(in srgb, var(--accent) 45%, transparent); }
& .cbtn { background: none; color: var(--accent); border: 1px solid var(--accent); border-radius: 0; font-weight: 500; font-size: ${u(2.4)}; letter-spacing: 0.26em; text-transform: uppercase; padding: ${u(2.4)} ${u(5.4)}; }
& .ft { justify-content: center; gap: ${u(5)}; color: var(--muted); }
& .sw { display: none; }
& .av { background: none; border: 1px solid var(--accent); color: var(--accent); }
`,
};
