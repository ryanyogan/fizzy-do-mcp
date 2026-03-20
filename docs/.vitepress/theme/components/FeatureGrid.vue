<script setup lang="ts">
interface Props {
  columns?: 2 | 3 | 4;
}

withDefaults(defineProps<Props>(), {
  columns: 2,
});
</script>

<template>
  <div class="feature-grid" :class="`cols-${columns}`">
    <slot />
  </div>
</template>

<style scoped>
.feature-grid {
  display: grid;
  gap: var(--space-4);
  margin: var(--space-8) 0;
}

.feature-grid.cols-2 {
  grid-template-columns: repeat(2, 1fr);
}

.feature-grid.cols-3 {
  grid-template-columns: repeat(3, 1fr);
}

.feature-grid.cols-4 {
  grid-template-columns: repeat(4, 1fr);
}

@media (max-width: 960px) {
  .feature-grid.cols-3,
  .feature-grid.cols-4 {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 640px) {
  .feature-grid.cols-2,
  .feature-grid.cols-3,
  .feature-grid.cols-4 {
    grid-template-columns: 1fr;
  }
}
</style>
