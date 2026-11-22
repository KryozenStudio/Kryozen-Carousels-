import { u } from './_u.js';

// The reference's "News" layout: condensed all-caps headline, orange tag, lower-third energy.
export default {
  id: 'broadcast',
  name: 'Breaking News',
  category: 'Photo',
  tags: ['news', 'photo', 'condensed', 'headline', 'bold'],
  blurb: 'Condensed all-caps headline, orange tag block, news-desk energy.',
  palette: 'broadcast',
  pairing: 'poster',
  radius: 0,
  pad: 5.6,
  caps: true,
  media: 'bg',
  scrim: 'bottom',
  deco: () => `<i style="position:absolute;left:0;right:0;bottom:0;height:${u(1.8)};background:var(--accent)"></i><i style="position:absolute;left:0;top:0;bottom:${u(1.8)};width:${u(1.1)};background:var(--accent)"></i>`,
  css: `
& { --mn-top: 1; --mn-bot: 0; --ta: left; }
& .inner { padding-left: ${u(8)}; padding-bottom: ${u(6.6)}; }
& .hd { justify-content: flex-start; }
& .tag { border-radius: 0; font-family: var(--fd); font-size: ${u(3.6)}; letter-spacing: 0.08em; padding: ${u(1)} ${u(2.6)}; transform: skewX(-9deg); font-weight: 400; }
& .h { line-height: 0.96; }
& [data-kind='cover'] .h { --h: 17; }
& [data-kind='content'] .h { --h: 12.5; }
& [data-kind='cta'] .h { --h: 15; }
& [data-kind='list'] .h { --h: 11; }
& [data-kind='visual'] .h { --h: 12; }
& [data-kind='stats'] .h { --h: 9.4; }
& .sub { font-weight: 600; font-size: ${u(4)}; color: var(--text); opacity: 0.88; text-transform: none; }
& .body { font-size: ${u(3.6)}; }
& .stat { font-size: ${u(34)}; }
& .statl { font-family: var(--fd); text-transform: uppercase; font-size: ${u(5.4)}; font-weight: 400; letter-spacing: 0.03em; }
& .q { font-weight: 400; font-size: ${u(10)}; line-height: 1.02; text-transform: uppercase; }
& .q p::before { color: var(--accent); }
& .by { font-family: var(--fd); text-transform: uppercase; font-size: ${u(4.4)}; letter-spacing: 0.04em; }
& .by b { font-weight: 400; color: var(--accent); }
& .items li { font-family: var(--fd); text-transform: uppercase; font-size: ${u(6.4)}; line-height: 1.06; }
& .items .n { font-size: 0.62em; background: var(--accent); color: var(--on-accent); padding: 0 ${u(1)}; transform: skewX(-9deg); }
& .cbtn { border-radius: 0; font-family: var(--fd); font-weight: 400; text-transform: uppercase; font-size: ${u(5)}; transform: skewX(-9deg); }
& .ft { font-size: ${u(2.5)}; }
& .av { border-radius: ${u(0.6)}; }
`,
};
