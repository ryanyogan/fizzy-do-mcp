<script setup lang="ts">
interface Link {
  title: string;
  link: string;
  description?: string;
}

interface Props {
  title?: string;
  items: Link[];
}

withDefaults(defineProps<Props>(), {
  title: 'Related',
});
</script>

<template>
  <div class="related-links">
    <h3 class="related-title">{{ title }}</h3>
    <div class="related-grid">
      <a v-for="item in items" :key="item.link" :href="item.link" class="related-item">
        <span class="related-item-title">{{ item.title }}</span>
        <span v-if="item.description" class="related-item-description">
          {{ item.description }}
        </span>
        <span class="related-item-arrow">&rarr;</span>
      </a>
    </div>
  </div>
</template>

<style scoped>
.related-links {
  margin-top: var(--space-12);
  padding-top: var(--space-8);
  border-top: 1px solid var(--vp-c-border);
}

.related-title {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--vp-c-text-3);
  margin: 0 0 var(--space-4);
}

.related-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: var(--space-3);
}

.related-item {
  display: flex;
  flex-direction: column;
  padding: var(--space-4);
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  text-decoration: none;
  transition:
    border-color 0.2s,
    background-color 0.2s;
  position: relative;
}

.related-item:hover {
  border-color: var(--fizzy-cyan);
  background: var(--vp-c-bg-soft);
}

.related-item:hover .related-item-arrow {
  color: var(--fizzy-cyan);
  transform: translateX(4px);
}

.related-item-title {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 500;
  color: var(--vp-c-text-1);
  padding-right: var(--space-6);
}

.related-item-description {
  font-size: 13px;
  color: var(--vp-c-text-3);
  margin-top: var(--space-1);
  line-height: 1.5;
}

.related-item-arrow {
  position: absolute;
  top: var(--space-4);
  right: var(--space-4);
  font-size: 16px;
  color: var(--vp-c-text-3);
  transition:
    color 0.2s,
    transform 0.2s;
}

@media (max-width: 640px) {
  .related-grid {
    grid-template-columns: 1fr;
  }
}
</style>
