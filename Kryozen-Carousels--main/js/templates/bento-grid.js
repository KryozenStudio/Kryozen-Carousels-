import { u } from './_u.js';

export default {
  id: 'bento-grid',
  name: 'Bento Grid',
  category: 'Structured',
  tags: ['bento', 'grid', 'cards', 'modular', 'tiles', 'dark', 'product'],
  blurb: 'Every element becomes a crisp surface tile: modular, scannable, sharp hierarchy.',
  palette: 'obsidian',
  pairing: 'grotesk',
  radius: 2.6,
  pad: 5,
  media: 'frame',
  css: `
& { --mn-top: 0; --mn-bot: 0; }
& .mn { flex-direction: row; flex-wrap: wrap; align-items: stretch; align-content: flex-start; gap: ${u(1.8)}; }
& .mn::before, & .mn::after { display: none; }
& .mn > * { margin: 0; padding: ${u(3.4)}; background: var(--surface); border: 1px solid rgb(255 255 255 / 0.07); border-radius: ${u(2.6)}; min-width: 0; }
& .h { flex: 1 1 100%; font-weight: 700; line-height: 1.02; }
& .sub, & .body { flex: 1 1 42%; font-size: ${u(3.5)}; }
& .sub { color: var(--muted); }
& [data-kind='cover'] .h { --h: 11.6; background: var(--accent); color: var(--on-accent); padding: ${u(4.4)}; }
& [data-kind='cover'] .h .hl, & [data-kind='cta'] .h .hl { color: inherit; text-decoration: underline; text-decoration-color: var(--hl, currentColor); text-decoration-thickness: 0.07em; text-underline-offset: 0.12em; }
& [data-kind='cta'] .h { background: var(--accent); color: var(--on-accent); }
& .stat { flex: 1 1 54%; font-size: ${u(20)}; }
& .statl { flex: 1 1 30%; font-size: ${u(3.4)}; color: var(--muted); font-weight: 500; }
& .stat ~ .h { margin-top: 0; }
& .q { flex: 1 1 100%; font-size: ${u(6.6)}; font-weight: 600; padding: ${u(4.4)}; }
& .q p::before { color: var(--accent); }
& .by { flex: 1 1 100%; flex-direction: row; align-items: baseline; gap: ${u(2)}; }
& .items { flex: 1 1 100%; padding: 0; background: none; border: 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: ${u(1.8)}; }
& .items li { display: flex; flex-direction: column; gap: ${u(1.6)}; padding: ${u(3.2)}; background: var(--surface); border: 1px solid rgb(255 255 255 / 0.07); border-radius: ${u(2.6)}; font-weight: 600; font-size: ${u(3.5)}; }
& .items .n { align-self: flex-start; padding: ${u(0.5)} ${u(1.3)}; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: ${u(2.2)}; }
& .cbtn { flex: 0 0 auto; background: var(--accent); border: 0; font-size: ${u(3.4)}; padding: ${u(2.4)} ${u(4.4)}; }
& .tag { border-radius: ${u(1.2)}; letter-spacing: 0.1em; }
& .inner > .media { border-radius: ${u(2.6)}; }
& .ft { padding: 0 ${u(1)}; }
& .sw { border-radius: ${u(1.2)}; }
`,
};
