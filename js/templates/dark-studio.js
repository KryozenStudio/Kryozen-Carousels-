import { u } from './_u.js';

const tick = (pos) => `<i style="position:absolute;${pos};width:${u(2.4)};height:${u(2.4)}"></i>`;

export default {
  id: 'dark-studio',
  name: 'Dark Editorial',
  category: 'Structured',
  tags: ['dark', 'premium', 'frame', 'gold', 'tech'],
  blurb: 'Near-black, inset hairline frame, mono labels and a single warm accent.',
  palette: 'noir',
  pairing: 'quirk',
  radius: 1.2,
  pad: 8.2,
  texture: 'grid',
  media: 'frame',
  deco: () =>
    `<b style="position:absolute;inset:${u(3.4)};border:1px solid color-mix(in srgb,var(--text) 20%,transparent)"></b>` +
    `<s style="position:absolute;inset:${u(3.4)};display:block">` +
    ['left:-1px;top:-1px;border-left:2px solid var(--accent);border-top:2px solid var(--accent)', 'right:-1px;top:-1px;border-right:2px solid var(--accent);border-top:2px solid var(--accent)', 'left:-1px;bottom:-1px;border-left:2px solid var(--accent);border-bottom:2px solid var(--accent)', 'right:-1px;bottom:-1px;border-right:2px solid var(--accent);border-bottom:2px solid var(--accent)'].map(tick).join('') +
    `</s>`,
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .tag { background: none; color: var(--accent); padding: 0; font-family: var(--fm); font-size: ${u(2.2)}; font-weight: 500; letter-spacing: 0.14em; }
& .tag::before { content: '[ '; }
& .tag::after { content: ' ]'; }
& .num { display: block; font-family: var(--fm); font-size: ${u(2.2)}; color: var(--muted); letter-spacing: 0.14em; }
& .h { font-weight: 600; line-height: 1.05; }
& [data-kind='cover'] .h { --h: 12; }
& .sub { font-size: ${u(3.8)}; }
& .stat { font-weight: 600; font-size: ${u(30)}; background: linear-gradient(var(--accent), var(--accent)) no-repeat 0 100% / ${u(9)} ${u(0.8)}; padding-bottom: ${u(2.6)}; }
& .statl { font-family: var(--fm); font-size: ${u(3)}; font-weight: 400; letter-spacing: 0.04em; margin-top: ${u(3)}; color: var(--muted); }
& .q { font-weight: 500; font-size: ${u(7.2)}; }
& .q p::before { color: var(--accent); }
& .q p::after { color: var(--accent); }
& .by { font-family: var(--fm); font-size: ${u(2.6)}; letter-spacing: 0.06em; }
& .items li { font-size: ${u(3.8)}; padding-bottom: ${u(2.2)}; border-bottom: 1px solid color-mix(in srgb, var(--text) 14%, transparent); }
& .items .n { font-family: var(--fm); font-weight: 400; }
& .inner > .media { border: 1px solid color-mix(in srgb, var(--text) 24%, transparent); }
& .cbtn { background: none; color: var(--accent); border: 1px solid var(--accent); font-family: var(--fm); font-weight: 500; letter-spacing: 0.1em; text-transform: uppercase; font-size: ${u(2.8)}; border-radius: 0; padding: ${u(2)} ${u(4)}; }
& .ft { font-family: var(--fm); font-size: ${u(2.2)}; letter-spacing: 0.04em; }
& .av { border-radius: ${u(0.8)}; }
& .sw { background: none; color: var(--accent); border: 1px solid var(--accent); border-radius: 0; }
`,
};
