<script setup lang="ts">
import DefaultTheme from 'vitepress/theme';

const { Layout } = DefaultTheme;
</script>

<template>
  <Layout>
    <template #home-hero-before>
      <slot name="home-hero-before" />
    </template>

    <template #home-hero-info>
      <slot name="home-hero-info" />
    </template>

    <template #home-hero-after>
      <slot name="home-hero-after" />
    </template>

    <template #home-features-before>
      <slot name="home-features-before" />
    </template>

    <template #home-features-after>
      <slot name="home-features-after" />
    </template>

    <template #doc-footer-before>
      <slot name="doc-footer-before" />
    </template>

    <template #doc-after>
      <slot name="doc-after" />
    </template>

    <template #aside-outline-before>
      <slot name="aside-outline-before" />
    </template>
  </Layout>
</template>
