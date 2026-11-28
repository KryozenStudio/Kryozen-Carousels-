import { u } from './_u.js';

// Comparison card. On List slides, write each row as "Before | After" (one pipe) to get two columns.
export default {
  id: 'versus',
  name: 'Versus Card',
  category: 'Structured',
  tags: ['comparison', 'versus', 'before after', 'vs', 'pros cons', 'pink'],
  blurb: 'Before / after and this-vs-that. Write rows as "Old way | New way" on List slides.',
  palette: 'blush',
  pairing: 'grotesk',
  radius: 2.2,
  pad: 6,
  media: 'frame',
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .hd { justify-content: flex-start; }
& .tag { background: var(--text); color: var(--bg); text-transform: none; letter-spacing: 0.02em; }
& .num { display: none; }
& .h { font-weight: 700; line-height: 1.02; }
& .hl { color: var(--hl, var(--accent)); }
& [data-kind='cover'] .h { --h: 13; }
& .stat { font-size: ${u(28)}; }
& .q { font-size: ${u(7.4)}; }
& .q p::before { color: var(--accent); }
& .items { gap: ${u(2)}; }
& .items li { grid-template-columns: minmax(0, 1fr); font-size: ${u(3.8)}; }
& .items .n { display: none; }
& .items .t { display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: ${u(1.4)}; align-items: stretch; }
& .items .c1, & .items .c2 { display: block; margin: 0; padding: ${u(2.4)} ${u(2.6)}; border-radius: ${u(1.8)}; font-size: 1em; font-weight: 600; line-height: 1.25; }
& .items .c1 { background: color-mix(in srgb, var(--text) 9%, transparent); color: var(--muted); text-decoration: line-through; text-decoration-thickness: 1px; }
& .items .c2 { background: var(--accent); color: var(--on-accent); }
& .items .t > :only-child { grid-column: 1 / -1; background: var(--surface); color: var(--text); text-decoration: none; }
& .inner > .media { border-radius: ${u(2.4)}; }
& .cbtn { background: var(--text); color: var(--bg); }
& .ft { padding-top: ${u(2)}; }
& .sw { background: var(--accent); color: var(--on-accent); }
`,
};
