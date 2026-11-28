import { u } from './_u.js';

// Flagship: the reference's photo-first idea, rebuilt. Full-bleed image, eased scrim, accent-highlighted headline.
export default {
  id: 'cinematic',
  name: 'Cinematic Photo',
  category: 'Photo',
  tags: ['photo', 'dark', 'story', 'headline'],
  blurb: 'Full-bleed photo, eased dark scrim, headline with highlighted words.',
  palette: 'midnight',
  pairing: 'studio',
  radius: 2.4,
  pad: 6.2,
  gradient: 'aurora',
  media: 'bg',
  scrim: 'bottom',
  css: `
& { --mn-top: 1; --mn-bot: 0; }
& .hd { justify-content: flex-start; }
& .tag { box-shadow: 0 ${u(0.4)} ${u(2)} rgb(0 0 0 / 0.25); }
& .h { text-shadow: 0 ${u(0.3)} ${u(3.2)} rgb(0 0 0 / 0.38); }
& .sub { color: color-mix(in srgb, var(--text) 82%, transparent); }
& [data-kind='cover'] .h { --h: 13.8; line-height: 0.98; }
& [data-kind='cover'] .sub { margin-top: ${u(3)}; max-width: 82%; }
& .ft { margin-top: ${u(1)}; padding-top: ${u(2.6)}; border-top: 1px solid color-mix(in srgb, var(--text) 22%, transparent); }
& .stat { text-shadow: 0 ${u(0.3)} ${u(3)} rgb(0 0 0 / 0.3); }
& [data-kind='quote'] .q { --q: 1; }
& .cbtn { box-shadow: 0 ${u(0.8)} ${u(3)} rgb(0 0 0 / 0.3); }
`,
};
