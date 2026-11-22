import { u } from './_u.js';

export default {
  id: 'bold-type',
  name: 'Bold Hook',
  category: 'Bold',
  tags: ['type', 'poster', 'loud', 'yellow', 'caps'],
  blurb: 'Oversized wide caps on flat colour. Type is the whole picture.',
  palette: 'butter',
  pairing: 'wide',
  radius: 0,
  pad: 5.6,
  caps: true,
  media: 'frame',
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .hd { justify-content: flex-start; }
& .tag { background: var(--text); color: var(--bg); border-radius: 0; transform: rotate(-2.5deg); font-weight: 800; padding: ${u(1)} ${u(2.2)}; }
& .num { display: none; }
& .h { font-weight: 900; line-height: 0.96; letter-spacing: -0.045em; }
& .hl { color: var(--accent2); }
& [data-kind='cover'] .h { --h: 17.4; }
& [data-kind='content'] .h { --h: 12.4; }
& [data-kind='cta'] .h { --h: 14.6; }
& [data-kind='visual'] .h { --h: 10.4; }
& [data-kind='list'] .h { --h: 9; }
& [data-kind='stats'] .h { --h: 8; }
& .sub { font-weight: 800; text-transform: uppercase; font-size: ${u(3.4)}; letter-spacing: 0.02em; color: var(--text); }
& .body { font-weight: 600; font-size: ${u(3.5)}; }
& .stat { font-size: ${u(38)}; font-weight: 900; line-height: 0.82; letter-spacing: -0.07em; color: var(--text); }
& .statl { text-transform: uppercase; font-weight: 800; font-size: ${u(3.8)}; background: var(--text); color: var(--bg); padding: ${u(0.8)} ${u(1.6)}; }
& .q { font-size: ${u(7.4)}; font-weight: 900; line-height: 1.04; letter-spacing: -0.04em; }
& .q p::before { color: var(--accent2); }
& .by { font-weight: 800; text-transform: uppercase; }
& .items li { font-weight: 900; text-transform: uppercase; font-size: ${u(5)}; letter-spacing: -0.03em; line-height: 1.04; }
& .items .n { color: var(--accent2); font-size: 0.7em; }
& .inner > .media { border-radius: 0; border: ${u(1)} solid var(--text); }
& .cbtn { background: var(--text); color: var(--bg); border-radius: 0; text-transform: uppercase; font-weight: 900; }
& .ft { border-top: ${u(0.8)} solid var(--text); padding-top: ${u(2.2)}; font-weight: 800; }
& .av { background: var(--text); color: var(--bg); }
& .sw { background: var(--text); color: var(--bg); border-radius: 0; }
`,
};
