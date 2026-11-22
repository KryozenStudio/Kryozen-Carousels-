import { u } from './_u.js';

export default {
  id: 'checklist',
  name: 'Action Checklist',
  category: 'Educational',
  tags: ['checklist', 'cheat sheet', 'save', 'tips', 'educational', 'rows', 'light'],
  blurb: 'Check-badge rows, marker highlights and a notebook margin: built to be saved and reused.',
  palette: 'slate',
  pairing: 'swiss',
  radius: 1.8,
  pad: 6,
  media: 'none',
  deco: () => `<i style="position:absolute;left:${u(3)};top:0;bottom:0;width:1px;background:color-mix(in srgb,var(--accent) 38%,transparent)"></i><i style="position:absolute;left:0;right:0;top:0;height:${u(1.4)};background:var(--accent)"></i>`,
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .inner { padding-left: ${u(8)}; }
& .tag { border-radius: ${u(1)}; letter-spacing: 0.1em; }
& .num { display: block; font-size: ${u(2.4)}; font-weight: 800; color: var(--muted); letter-spacing: 0.08em; }
& .num::before { content: 'TIP '; }
& .h { font-weight: 800; line-height: 1; }
& .hl { color: var(--text); background: linear-gradient(transparent 60%, color-mix(in srgb, var(--accent) 30%, transparent) 60%); }
& [data-kind='cover'] .h { --h: 13; }
& .sub { font-weight: 600; font-size: ${u(4)}; }
& .body { padding-left: ${u(3)}; border-left: ${u(0.7)} solid var(--accent); }
& .stat { color: var(--accent); padding: ${u(1)} 0; }
& .q { font-weight: 800; font-size: ${u(7.4)}; }
& .q p::before { color: var(--accent); }
& .items { gap: ${u(1.6)}; }
& .items li { align-items: center; padding: ${u(2.4)} ${u(3)}; background: var(--surface); border: 1px solid color-mix(in srgb, var(--text) 14%, transparent); border-radius: ${u(1.8)}; box-shadow: 0 ${u(0.5)} 0 color-mix(in srgb, var(--text) 8%, transparent); font-weight: 700; font-size: ${u(3.9)}; }
& .items .n { position: relative; display: block; width: ${u(5.6)}; height: ${u(5.6)}; border-radius: ${u(1.3)}; background: var(--accent); font-size: 0; }
& .items .n::after { content: ''; position: absolute; left: ${u(1.5)}; top: ${u(1.5)}; width: ${u(2.7)}; height: ${u(1.4)}; border-left: ${u(0.7)} solid #fff; border-bottom: ${u(0.7)} solid #fff; transform: rotate(-45deg); }
& .cbtn { border-radius: ${u(1.8)}; background: var(--text); color: var(--bg); }
& .ft { padding-top: ${u(2.4)}; }
& .sw { border-radius: ${u(1.2)}; background: var(--accent); color: #fff; }
`,
};
