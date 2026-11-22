import { u } from './_u.js';

const line = (x) => `<i style="position:absolute;top:0;bottom:0;left:${x}%;width:1px;background:color-mix(in srgb,var(--text) 10%,transparent)"></i>`;

export default {
  id: 'swiss',
  name: 'Swiss Breakdown',
  category: 'Structured',
  tags: ['swiss', 'grid', 'modernist', 'red', 'light', 'rules'],
  blurb: 'Strict column grid, thick rules, flush-left heavy grotesk, signal red.',
  palette: 'chalk',
  pairing: 'swiss',
  radius: 0,
  pad: 6,
  media: 'frame',
  deco: () => [25, 50, 75].map(line).join(''),
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .hd { border-top: ${u(1.1)} solid var(--text); padding-top: ${u(2)}; align-items: flex-start; }
& .tag { background: none; color: var(--text); padding: 0; font-size: ${u(2.6)}; font-weight: 800; letter-spacing: 0.02em; text-transform: none; }
& .num { display: block; font-size: ${u(2.6)}; font-weight: 800; color: var(--accent); }
& .h { font-weight: 800; line-height: 0.98; }
& .hl { color: var(--accent); }
& [data-kind='cover'] .h { --h: 14.5; }
& .sub, & .body, & .statl { margin-left: 25%; max-width: 75%; }
& .sub { font-weight: 600; color: var(--text); font-size: ${u(4)}; }
& .body { font-size: ${u(3.5)}; }
& .stat { font-weight: 900; font-size: ${u(36)}; line-height: 0.82; letter-spacing: -0.06em; color: var(--text); }
& .stat ~ .h { --h: 5.8; margin-left: 25%; }
& .statl { color: var(--accent); font-weight: 800; margin-top: ${u(2)}; }
& .q { font-size: ${u(8.2)}; font-weight: 800; line-height: 1.04; margin-left: 25%; max-width: 75%; }
& .q p::before { color: var(--accent); }
& .by { margin-left: 25%; max-width: 75%; font-size: ${u(3)}; }
& .items { gap: 0; }
& .items li { grid-template-columns: 25% minmax(0, 1fr); border-top: 1px solid var(--text); padding: ${u(2.2)} 0; font-size: ${u(4.2)}; font-weight: 700; align-items: start; }
& .items .n { font-size: ${u(3)}; color: var(--accent); }
& .items li:last-child { border-bottom: 1px solid var(--text); }
& .inner > .media { border-radius: 0; margin-left: 25%; }
& .cbtn { margin-left: 25%; max-width: 75%; border-radius: 0; background: var(--accent); color: #fff; font-size: ${u(3.4)}; }
& .ft { border-top: 1px solid var(--text); padding-top: ${u(2)}; font-weight: 700; }
& .av { border-radius: 0; background: var(--text); color: var(--bg); }
& .sw { border-radius: 0; background: var(--accent); color: #fff; }
`,
};
