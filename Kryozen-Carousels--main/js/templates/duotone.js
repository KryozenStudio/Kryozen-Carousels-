import { u } from './_u.js';

const shapes = () =>
  `<i style="position:absolute;right:${u(-16)};top:${u(-14)};width:${u(58)};height:${u(58)};border-radius:50%;background:rgb(255 255 255/.07)"></i>` +
  `<i style="position:absolute;right:${u(-6)};top:${u(-4)};width:${u(38)};height:${u(38)};border-radius:50%;border:1px solid color-mix(in srgb,var(--accent) 55%,transparent)"></i>` +
  `<i style="position:absolute;left:${u(-12)};bottom:${u(-18)};width:${u(44)};height:${u(44)};border-radius:50%;background:color-mix(in srgb,var(--accent) 12%,transparent)"></i>`;

export default {
  id: 'duotone',
  name: 'Duotone Studio',
  category: 'Bold',
  tags: ['duotone', 'gradient', 'agency', 'color', 'pill', 'geometric', 'modern'],
  blurb: 'Indigo-to-plum colour field, geometric circles, clean pill tags and a crisp rounded sans.',
  palette: 'duotone',
  pairing: 'soft',
  radius: 5,
  pad: 6.4,
  media: 'frame',
  deco: shapes,
  css: `
&:not([data-bgi]) { background-image: linear-gradient(150deg, var(--bg) 0%, color-mix(in srgb, var(--bg) 40%, #a3208f) 100%); }
& { --mn-top: 1; --mn-bot: 0; }
& .tag { background: rgb(255 255 255 / 0.16); color: var(--text); border: 1px solid rgb(255 255 255 / 0.38); letter-spacing: 0.1em; }
& .num { display: block; padding: ${u(0.6)} ${u(1.6)}; border-radius: 999px; background: var(--accent); color: var(--on-accent); font-size: ${u(2.2)}; font-weight: 800; }
& .h { font-weight: 800; line-height: 1.02; }
& [data-kind='cover'] .h { --h: 13; }
& .sub { color: color-mix(in srgb, var(--text) 86%, transparent); }
& .stat { font-size: ${u(26)}; }
& .statl { font-weight: 700; }
& .q { font-weight: 700; }
& .q p::before { color: var(--accent); }
& .items { gap: ${u(1.6)}; }
& .items li { align-items: center; padding: ${u(2)} ${u(3.4)} ${u(2)} ${u(2)}; border-radius: 999px; background: rgb(255 255 255 / 0.12); border: 1px solid rgb(255 255 255 / 0.22); font-weight: 600; font-size: ${u(3.7)}; }
& .items .n { display: grid; place-items: center; width: ${u(5.6)}; height: ${u(5.6)}; border-radius: 50%; background: var(--accent); color: var(--on-accent); font-size: ${u(2.3)}; }
& .cbtn { padding: ${u(2.4)} ${u(5)}; box-shadow: 0 ${u(1)} ${u(3)} rgb(0 0 0 / 0.25); }
& .inner > .media { border: 1px solid rgb(255 255 255 / 0.32); box-shadow: 0 ${u(1.6)} ${u(5)} rgb(0 0 0 / 0.3); }
& .sw { background: var(--accent); color: var(--on-accent); }
`,
};
