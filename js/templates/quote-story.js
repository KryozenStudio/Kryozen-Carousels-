import { u } from './_u.js';

export default {
  id: 'quote-story',
  name: 'Magazine Quote',
  category: 'Editorial',
  tags: ['quote', 'story', 'serif', 'warm', 'centered', 'testimonial'],
  blurb: 'Centred, warm and literary. Made for quotes, testimonials and short stories.',
  palette: 'clay',
  pairing: 'bookish',
  radius: 2,
  pad: 7.4,
  media: 'frame',
  gradient: 'soft',
  deco: ({ kind }) =>
    `<span style="position:absolute;left:0;right:0;top:${kind === 'quote' ? '4%' : '-3%'};text-align:center;font-family:var(--fd);font-size:${u(kind === 'quote' ? 62 : 40)};line-height:1;color:var(--accent);opacity:${kind === 'quote' ? 0.9 : 0.12}">“</span>`,
  css: `
& { --ta: center; --ai: center; --mn-top: 1; --mn-bot: 1; }
& .hd { justify-content: center; }
& .tag { background: none; color: var(--accent); border: 1px solid var(--accent); }
& .num { display: none; }
& .h { font-weight: 700; line-height: 1.1; }
& .hl { font-style: normal; color: var(--hl, var(--accent)); }
& [data-kind='cover'] .h { --h: 11.6; }
& [data-kind='content'] .h { --h: 8.6; }
& .sub { font-size: ${u(3.8)}; color: var(--text); opacity: 0.78; }
& .body { font-size: ${u(3.6)}; }
& [data-kind='quote'] .mn { --mn-top: 2.2; --mn-bot: 1; }
& .q { font-size: ${u(8.4)}; font-weight: 600; line-height: 1.16; }
& .q p::before, & .q p::after { content: ''; }
& .by { align-items: center; margin-top: ${u(5)}; }
& .by b { font-size: ${u(3.6)}; letter-spacing: 0.1em; text-transform: uppercase; }
& .by b::before { content: ''; display: block; width: ${u(8)}; height: ${u(0.5)}; background: var(--accent); margin: 0 auto ${u(2.4)}; }
& .stat { font-size: ${u(24)}; font-weight: 700; }
& .items { width: auto; }
& .items li { font-size: ${u(4)}; justify-content: center; text-align: center; grid-template-columns: minmax(0, 1fr); row-gap: ${u(0.6)}; }
& .items .n { font-size: ${u(2.6)}; }
& .inner > .media { border-radius: 999px 999px ${u(2)} ${u(2)}; }
& .cbtn { background: var(--text); color: var(--bg); }
& .ft { justify-content: space-between; }
& .sw { background: none; color: var(--text); border: 1px solid color-mix(in srgb, var(--text) 40%, transparent); }
`,
};
