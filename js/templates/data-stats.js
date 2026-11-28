import { u } from './_u.js';

const ticks = () => {
  let t = '';
  for (let k = 0; k <= 20; k++) t += `<i style="position:absolute;left:${(k / 20) * 100}%;bottom:0;width:1px;height:${k % 5 === 0 ? u(2.2) : u(1.1)};background:color-mix(in srgb,var(--text) ${k % 5 === 0 ? 55 : 30}%,transparent)"></i>`;
  return `<div style="position:absolute;left:0;right:0;bottom:0;height:${u(2.4)}">${t}</div>`;
};

export default {
  id: 'data-stats',
  name: 'Big Stat Spotlight',
  category: 'Structured',
  tags: ['data', 'numbers', 'chart', 'report', 'blue', 'metrics'],
  blurb: 'Instrument-panel look: measurement grid, mono labels, a giant tabular figure.',
  palette: 'ocean',
  pairing: 'grotesk',
  radius: 1,
  pad: 6,
  texture: 'grid',
  media: 'frame',
  deco: ticks,
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .hd { padding-bottom: ${u(2)}; border-bottom: 1px solid color-mix(in srgb, var(--text) 24%, transparent); }
& .tag { background: none; color: var(--accent); padding: 0; font-family: var(--fm); font-size: ${u(2.3)}; letter-spacing: 0.12em; font-weight: 500; }
& .tag::before { content: '\\25A0  '; font-size: 0.8em; }
& .num { display: block; font-family: var(--fm); font-size: ${u(2.3)}; color: var(--muted); letter-spacing: 0.1em; }
& .h { font-weight: 700; line-height: 1.05; }
& [data-kind='cover'] .h { --h: 12.4; }
& .stat { font-size: ${u(34)}; font-weight: 700; line-height: 0.86; letter-spacing: -0.05em; }
& .statl { font-family: var(--fm); font-weight: 400; font-size: ${u(2.8)}; letter-spacing: 0.04em; text-transform: uppercase; margin-top: ${u(2.4)}; padding: ${u(1.2)} 0 ${u(1.2)} ${u(2)}; border-left: ${u(0.5)} solid var(--accent); color: var(--text); }
& .stat ~ .h { --h: 5.8; }
& .q { font-size: ${u(7)}; font-weight: 600; }
& .q p::before { color: var(--accent); }
& .by { font-family: var(--fm); font-size: ${u(2.5)}; }
& .items li { font-size: ${u(3.9)}; padding: ${u(2)} ${u(2.2)}; border: 1px solid color-mix(in srgb, var(--text) 20%, transparent); border-radius: ${u(0.8)}; background: color-mix(in srgb, var(--surface) 70%, transparent); }
& .items .n { font-family: var(--fm); font-weight: 500; }
& .inner > .media { border: 1px solid color-mix(in srgb, var(--text) 24%, transparent); }
& .cbtn { font-family: var(--fm); letter-spacing: 0.06em; text-transform: uppercase; border-radius: ${u(0.8)}; font-size: ${u(2.8)}; }
& .ft { font-family: var(--fm); font-size: ${u(2.2)}; }
& .sw { border-radius: ${u(0.8)}; }
`,
};
