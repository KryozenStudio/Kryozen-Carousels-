import { u } from './_u.js';

// The reference's "Post card": profile row, post text, media in a bordered frame.
export default {
  id: 'social-post',
  name: 'Notes Thread',
  category: 'Social',
  tags: ['post', 'card', 'light', 'profile', 'thread'],
  blurb: 'Profile row, post-style text and a framed image. Looks like a native post.',
  palette: 'signal',
  pairing: 'studio',
  radius: 1.6,
  pad: 5.4,
  gradient: 'soft',
  media: 'frame',
  css: `
& .inner,
& [data-mm='none'] .inner { grid-template-areas: 'ft' 'hd' 'mn'; grid-template-rows: auto auto minmax(0, 1fr); row-gap: ${u(3)}; }
& [data-mm='frame'] .inner { grid-template-areas: 'ft' 'hd' 'mn' 'md'; grid-template-rows: auto auto auto minmax(0, 1fr); }
& .ft { align-items: center; }
& .av { width: ${u(11)}; height: ${u(11)}; font-size: ${u(3.6)}; }
& .brand { gap: ${u(2.6)}; }
& .bn { gap: ${u(0.6)}; }
& .bn b { font-size: ${u(3.9)}; font-weight: 800; }
& .bn i { font-size: ${u(3.2)}; }
& .ct { font-size: ${u(2.8)}; }
& .hd { justify-content: flex-start; }
& .tag { background: transparent; color: var(--accent); padding: 0; font-size: ${u(2.8)}; letter-spacing: 0.06em; }
& .tag::before { content: '#'; }
& .num { display: none; }
& [data-kind] .h { --h: 5.4; font-weight: 650; line-height: 1.22; letter-spacing: -0.01em; text-transform: none; text-wrap: pretty; }
& [data-kind='cover'] .h { --h: 6.4; }
& .sub { font-size: ${u(3.8)}; margin-top: ${u(1.6)}; }
& .body { font-size: ${u(3.8)}; margin-top: ${u(2)}; }
& .inner > .media { border: 1px solid color-mix(in srgb, var(--text) 14%, transparent); border-radius: ${u(2.2)}; }
& .stat { font-size: ${u(17)}; }
& .q { font-size: ${u(6.4)}; font-weight: 600; letter-spacing: -0.015em; text-transform: none; }
& .q p::before, & .q p::after { color: var(--accent); }
& .items li { font-size: ${u(4.2)}; }
& .cbtn { background: var(--text); color: var(--bg); font-size: ${u(3.6)}; padding: ${u(1.7)} ${u(3.6)}; }
`,
};
