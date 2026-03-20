import DefaultTheme from 'vitepress/theme';
import type { Theme } from 'vitepress';
import './custom.css';

// Import layout wrapper
import Layout from './Layout.vue';

// Import custom components
import Terminal from './components/Terminal.vue';
import FeatureCard from './components/FeatureCard.vue';
import FeatureGrid from './components/FeatureGrid.vue';
import HomeHero from './components/HomeHero.vue';
import QuickLink from './components/QuickLink.vue';
import EditorBadge from './components/EditorBadge.vue';
import RelatedLinks from './components/RelatedLinks.vue';

export default {
  extends: DefaultTheme,
  Layout,
  enhanceApp({ app }) {
    // Register global components
    app.component('Terminal', Terminal);
    app.component('FeatureCard', FeatureCard);
    app.component('FeatureGrid', FeatureGrid);
    app.component('HomeHero', HomeHero);
    app.component('QuickLink', QuickLink);
    app.component('EditorBadge', EditorBadge);
    app.component('RelatedLinks', RelatedLinks);
  },
} satisfies Theme;
