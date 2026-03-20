<script setup lang="ts">
interface Props {
  icon?: string;
  title: string;
  description: string;
  to?: string;
}

defineProps<Props>();
</script>

<template>
  <component :is="to ? 'a' : 'div'" :href="to" class="feature-card" :class="{ clickable: to }">
    <div v-if="icon" class="feature-card-icon">{{ icon }}</div>
    <h3 class="feature-card-title">{{ title }}</h3>
    <p class="feature-card-description">{{ description }}</p>
    <span v-if="to" class="feature-card-arrow">&rarr;</span>
  </component>
</template>

<style scoped>
.feature-card {
  display: block;
  border: 1px solid var(--vp-c-border);
  padding: var(--space-6);
  background-color: var(--vp-c-bg);
  transition:
    border-color 0.2s,
    background-color 0.2s;
  position: relative;
  text-decoration: none;
}

.feature-card.clickable:hover {
  border-color: var(--fizzy-cyan);
  background: var(--vp-c-bg-soft);
}

.feature-card.clickable:hover .feature-card-arrow {
  color: var(--fizzy-cyan);
  transform: translateX(4px);
}

.feature-card-icon {
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  font-weight: 600;
  color: var(--fizzy-cyan);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  margin-bottom: var(--space-3);
}

.feature-card-title {
  font-family: var(--vp-font-family-mono);
  font-size: 1rem;
  font-weight: 600;
  margin: 0 0 var(--space-2);
  color: var(--vp-c-text-1);
  line-height: 1.3;
}

.feature-card-description {
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: 0;
}

.feature-card-arrow {
  position: absolute;
  top: var(--space-6);
  right: var(--space-6);
  font-size: 18px;
  color: var(--vp-c-text-3);
  transition:
    color 0.2s,
    transform 0.2s;
}
</style>
