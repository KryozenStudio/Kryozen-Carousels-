import { u } from './_u.js';

export default {
  id: 'step-guide',
  name: 'Step-by-Step Playbook',
  category: 'Structured',
  tags: ['steps', 'tutorial', 'how-to', 'guide', 'progress', 'green'],
  blurb: 'Progress rail, oversized step numbers and a timeline for how-tos.',
  palette: 'forest',
  pairing: 'studio',
  radius: 2,
  pad: 6.2,
  media: 'frame',
  deco: ({ i, n }) => {
    let seg = '';
    for (let k = 0; k < n; k++) seg += `<i style="flex:1;height:100%;border-radius:999px;background:${k <= i ? 'var(--accent)' : 'color-mix(in srgb,var(--text) 18%,transparent)'}"></i>`;
    return `<div style="position:absolute;left:${u(6.2)};right:${u(6.2)};top:${u(4)};height:${u(0.9)};display:flex;gap:${u(1)}">${seg}</div>`;
  },
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .inner { padding-top: ${u(9.4)}; }
& .hd { justify-content: flex-start; gap: ${u(2.4)}; flex-direction: row-reverse; justify-content: flex-end; }
& .tag { background: none; color: var(--accent); padding: 0; font-size: ${u(2.6)}; letter-spacing: 0.14em; }
& .num { display: block; font-family: var(--fd); font-weight: var(--hw); font-size: ${u(7.6)}; line-height: 0.9; color: var(--text); padding-right: ${u(2.4)}; border-right: 2px solid var(--accent); letter-spacing: -0.03em; }
& .h { line-height: 1.04; }
& [data-kind='cover'] .h { --h: 13; }
& [data-kind='content'] .h { --h: 9.6; }
& .sub { font-size: ${u(3.8)}; }
& .stat { font-size: ${u(26)}; }
& .q { font-size: ${u(7.4)}; }
& .q p::before { color: var(--accent); }
& .items { position: relative; gap: ${u(3.2)}; padding-left: ${u(1)}; }
& .items::before { content: ''; position: absolute; left: ${u(3.35)}; top: ${u(2)}; bottom: ${u(2)}; width: 2px; background: color-mix(in srgb, var(--text) 22%, transparent); }
& .items li { position: relative; grid-template-columns: ${u(6.8)} minmax(0, 1fr); align-items: center; column-gap: ${u(2.8)}; font-size: ${u(4)}; }
& .items .n { position: relative; z-index: 1; width: ${u(6.8)}; height: ${u(6.8)}; border-radius: 50%; display: grid; place-items: center; background: var(--accent); color: var(--on-accent); font-size: ${u(2.5)}; letter-spacing: 0; }
& .inner > .media { border-radius: ${u(2.6)}; }
& .cbtn { background: var(--accent); }
& .ft { padding-top: ${u(2.2)}; border-top: 1px solid color-mix(in srgb, var(--text) 20%, transparent); }
`,
};
