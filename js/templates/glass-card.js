import { u } from './_u.js';

// Restrained glass: a translucent, hairline-bordered card over a photo or a deep colour field.
// No backdrop-filter on purpose: it does not survive html-to-image, and exports must match the preview.
export default {
  id: 'glass-card',
  name: 'Glass Card',
  category: 'Photo',
  tags: ['glass', 'frosted', 'card', 'photo', 'dark', 'modern'],
  blurb: 'Translucent hairline card over a photo or deep colour field. Quiet, premium, readable.',
  palette: 'charcoal',
  pairing: 'studio',
  radius: 3.2,
  pad: 6,
  gradient: 'aurora',
  media: 'bg',
  scrim: 'bottom',
  css: `
& { --mn-top: 0; --mn-bot: 0; }
& .mn { align-self: end; max-height: 100%; padding: ${u(5)} ${u(5.4)}; border-radius: ${u(3.2)}; border: 1px solid rgb(255 255 255 / 0.22); background: linear-gradient(160deg, rgb(255 255 255 / 0.15), rgb(255 255 255 / 0.04)), rgb(10 12 16 / 0.6); box-shadow: inset 0 1px 0 rgb(255 255 255 / 0.2), 0 ${u(2)} ${u(6)} rgb(0 0 0 / 0.35); }
& .mn::before, & .mn::after { display: none; }
& [data-va='top'] .mn { align-self: start; }
& [data-va='middle'] .mn { align-self: center; }
& .hd { justify-content: flex-start; }
& .tag { background: rgb(255 255 255 / 0.14); color: var(--text); border: 1px solid rgb(255 255 255 / 0.3); letter-spacing: 0.12em; }
& .h { font-weight: 700; line-height: 1.02; }
& [data-kind='cover'] .h { --h: 11.4; }
& [data-kind='content'] .h { --h: 8.2; }
& [data-kind='cta'] .h { --h: 9.6; }
& .sub { color: color-mix(in srgb, var(--text) 80%, transparent); }
& .stat { font-size: ${u(22)}; }
& .q { font-weight: 600; font-size: ${u(7)}; }
& .q p::before { color: var(--accent); }
& .by { padding-top: ${u(2.4)}; border-top: 1px solid rgb(255 255 255 / 0.18); width: 100%; }
& .items li { padding: ${u(1.9)} 0; border-top: 1px solid rgb(255 255 255 / 0.16); }
& .items li:first-child { border-top: 0; }
& .cbtn { box-shadow: 0 ${u(0.8)} ${u(3)} rgb(0 0 0 / 0.3); }
& .ft { padding-top: ${u(1)}; }
@container (min-aspect-ratio: 5/4) { & .mn { max-width: 64%; } }
`,
};
