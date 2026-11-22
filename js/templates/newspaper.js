import { u } from './_u.js';

export default {
  id: 'newspaper',
  name: 'Broadsheet Column',
  category: 'Editorial',
  tags: ['newspaper', 'broadsheet', 'column', 'serif', 'news', 'press', 'authority'],
  blurb: 'Masthead rules, justified two-column text and a drop cap. High-authority print voice.',
  palette: 'newsprint',
  pairing: 'bookish',
  radius: 0,
  pad: 5.6,
  media: 'frame',
  css: `
& { --mn-top: 0; --mn-bot: 1; }
& .hd { padding: ${u(1.4)} 0; border-top: ${u(1)} solid var(--text); border-bottom: 1px solid var(--text); justify-content: space-between; }
& .tag { background: none; color: var(--accent); padding: 0; font-family: var(--fb); font-size: ${u(2.2)}; letter-spacing: 0.24em; font-weight: 800; }
& .num { display: block; font-family: var(--fb); font-size: ${u(2.2)}; letter-spacing: 0.18em; font-weight: 700; text-transform: uppercase; }
& .num::before { content: 'No. '; }
& .h { font-weight: 900; line-height: 1.02; letter-spacing: -0.02em; }
& .hl { color: var(--accent); font-style: italic; }
& [data-kind='cover'] .h { --h: 13.4; padding-bottom: ${u(2.2)}; border-bottom: 1px solid var(--text); width: 100%; }
& .sub { font-family: var(--fd); font-style: italic; font-size: ${u(4.8)}; line-height: 1.2; color: var(--text); font-weight: 400; }
& .body { text-align: left; hyphens: auto; font-size: ${u(3.4)}; line-height: 1.5; max-width: 100%; }
@container (min-aspect-ratio: 5/4) { & [data-kind='content'] .body { max-width: 72%; } }
& .body p:first-child::first-letter { float: left; font-family: var(--fd); font-weight: 900; font-size: 2.7em; line-height: 0.82; padding: 0.04em 0.08em 0 0; color: var(--accent); }
& .stat { font-weight: 900; font-size: ${u(30)}; letter-spacing: -0.04em; color: var(--text); }
& .statl { font-family: var(--fb); font-weight: 700; letter-spacing: 0.1em; text-transform: uppercase; font-size: ${u(2.8)}; color: var(--accent); border-top: 1px solid var(--text); padding-top: ${u(1.4)}; width: 100%; }
& .q { font-style: italic; font-weight: 700; font-size: ${u(8)}; line-height: 1.1; padding: ${u(3)} 0; border-top: ${u(1)} solid var(--text); border-bottom: 1px solid var(--text); width: 100%; }
& .q p::before { color: var(--accent); }
& .by { flex-direction: row; gap: ${u(2)}; align-items: baseline; text-transform: uppercase; letter-spacing: 0.12em; font-size: ${u(2.6)}; }
& .items { gap: 0; }
& .items li { padding: ${u(2.2)} 0; border-top: 1px solid var(--text); font-family: var(--fd); font-weight: 700; font-size: ${u(4.4)}; }
& .items li:last-child { border-bottom: 1px solid var(--text); }
& .items .n { font-family: var(--fd); color: var(--accent); font-size: 1em; }
& .inner > .media { border-radius: 0; border: 1px solid var(--text); }
& .inner > .media img { filter: grayscale(0.9) contrast(1.06); }
& .cbtn { border-radius: 0; background: var(--text); color: var(--bg); font-family: var(--fb); letter-spacing: 0.16em; text-transform: uppercase; font-size: ${u(2.8)}; }
& .ft { padding-top: ${u(1.6)}; border-top: 1px solid var(--text); }
& .av { border-radius: 0; background: var(--text); color: var(--bg); }
& .sw { border-radius: 0; background: none; color: var(--text); border: 1px solid var(--text); }
`,
};
