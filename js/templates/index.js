// Template registry. To add a template: create js/templates/<id>.js (copy any file here), import it below, add it to LIST.
import cinematic from './cinematic.js';
import broadcast from './broadcast.js';
import socialPost from './social-post.js';
import editorial from './editorial.js';
import darkStudio from './dark-studio.js';
import swiss from './swiss.js';
import boldType from './bold-type.js';
import splitVisual from './split-visual.js';
import dataStats from './data-stats.js';
import quoteStory from './quote-story.js';
import stepGuide from './step-guide.js';
import versus from './versus.js';
import glassCard from './glass-card.js';
import galleryPoster from './gallery-poster.js';
import bentoGrid from './bento-grid.js';
import checklist from './checklist.js';
import newspaper from './newspaper.js';
import monolith from './monolith.js';
import showcase from './showcase.js';
import duotone from './duotone.js';

const LIST = [cinematic, darkStudio, editorial, boldType, swiss, socialPost, quoteStory, dataStats, stepGuide, versus, splitVisual, broadcast, glassCard, galleryPoster, bentoGrid, checklist, newspaper, monolith, showcase, duotone];

export const TEMPLATES = Object.fromEntries(LIST.map((t) => [t.id, t]));
export const TEMPLATE_LIST = LIST;
export const CATEGORIES = ['All', ...new Set(LIST.map((t) => t.category))];
