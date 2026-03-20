<script setup lang="ts">
interface Props {
  title: string;
  description: string;
  to: string;
  badge?: string;
}

defineProps<Props>();
</script>

<template>
  <a :href="to" class="quick-link">
    <div class="quick-link-header">
      <span v-if="badge" class="quick-link-badge">{{ badge }}</span>
      <h3 class="quick-link-title">{{ title }}</h3>
    </div>
    <p class="quick-link-description">{{ description }}</p>
    <span class="quick-link-arrow">&rarr;</span>
  </a>
</template>

<style scoped>
.quick-link {
  display: block;
  padding: var(--space-6);
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  text-decoration: none;
  transition:
    border-color 0.2s,
    background-color 0.2s;
  position: relative;
}

.quick-link:hover {
  border-color: var(--fizzy-cyan);
  background: var(--vp-c-bg-soft);
}

.quick-link:hover .quick-link-arrow {
  color: var(--fizzy-cyan);
  transform: translateX(4px);
}

.quick-link-header {
  margin-bottom: var(--space-2);
}

.quick-link-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 10px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fizzy-cyan);
  display: block;
  margin-bottom: var(--space-2);
}

.quick-link-title {
  font-family: var(--vp-font-family-mono);
  font-size: 1rem;
  font-weight: 600;
  color: var(--vp-c-text-1);
  margin: 0;
  line-height: 1.3;
}

.quick-link-description {
  font-size: 14px;
  color: var(--vp-c-text-2);
  line-height: 1.6;
  margin: var(--space-2) 0 0;
}

.quick-link-arrow {
  position: absolute;
  bottom: var(--space-4);
  right: var(--space-4);
  font-size: 18px;
  color: var(--vp-c-text-3);
  transition:
    color 0.2s,
    transform 0.2s;
}
</style>
