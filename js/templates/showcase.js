import { u } from './_u.js';

export default {
  id: 'showcase',
  name: 'Case Study Card',
  category: 'Structured',
  tags: ['case study', 'showcase', 'review', 'teardown', 'breakdown', 'card', 'creator'],
  blurb: 'Framed hero visual on a saturated field with a white takeaway panel underneath.',
  palette: 'cobalt',
  pairing: 'grotesk',
  radius: 2.4,
  pad: 5.4,
  media: 'frame',
  css: `
& { --mn-top: 0; --mn-bot: 0; }
& .tag { letter-spacing: 0.1em; }
& .num { display: block; font-size: ${u(2.4)}; font-weight: 700; letter-spacing: 0.14em; text-transform: uppercase; }
& .num::before { content: 'Case '; opacity: 0.85; }
& .inner > .media { border: ${u(1.2)} solid var(--text); border-radius: ${u(2.4)}; box-shadow: 0 ${u(1.6)} ${u(5)} rgb(0 0 0 / 0.28); }
& .mn { align-self: end; max-height: 100%; padding: ${u(4)} ${u(4.4)}; border-radius: ${u(2.4)}; background: var(--text); box-shadow: 0 ${u(1.6)} ${u(5)} rgb(0 0 0 / 0.22); }
& .mn::before, & .mn::after { display: none; }
& [data-va='top'] .mn { align-self: start; }
& [data-va='middle'] .mn { align-self: center; }
& .h, & .q, & .body, & .statl, & .items li, & .by b { color: var(--bg); }
& .h { font-weight: 800; line-height: 1.14; }
& [data-kind='cover'] .h { --h: 10.6; }
& .hl { background: var(--hlp, var(--accent)); color: var(--hlt, var(--on-accent)); box-shadow: 0.12em 0 0 0 var(--hlp, var(--accent)), -0.12em 0 0 0 var(--hlp, var(--accent)), 0 0 0 0.03em var(--hlp, var(--accent)); border-radius: 0.14em; -webkit-box-decoration-break: clone; box-decoration-break: clone; }
& .sub, & .by span { color: color-mix(in srgb, var(--bg) 72%, #fff); }
& .stat { color: var(--bg); font-size: ${u(20)}; }
& .statl { font-weight: 600; }
& .q { font-weight: 700; font-size: ${u(6.8)}; }
& .q p::before { color: var(--bg); }
& .by { padding-top: ${u(2)}; border-top: 1px solid color-mix(in srgb, var(--bg) 20%, #fff); width: 100%; }
& .items { gap: 0; }
& .items li { padding: ${u(1.8)} 0; border-top: 1px solid color-mix(in srgb, var(--bg) 18%, #fff); font-weight: 700; font-size: ${u(3.6)}; }
& .items li:first-child { border-top: 0; }
& .items .n { color: var(--bg); background: var(--accent); border-radius: 999px; padding: ${u(0.3)} ${u(1.2)}; font-size: ${u(2.2)}; }
& .cbtn { background: var(--bg); color: var(--text); border-radius: ${u(1.6)}; }
& .sw { background: var(--accent); color: var(--on-accent); }
@container (min-aspect-ratio: 5/4) { & .mn { align-self: center; } }
`,
};
