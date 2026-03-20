<script setup lang="ts">
interface Props {
  name: string;
  icon: 'claude' | 'claude-code' | 'cursor' | 'opencode' | 'windsurf' | 'continue' | 'vscode';
  to: string;
}

defineProps<Props>();

// SVG icons embedded for reliability
const icons = {
  claude: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/></svg>`,
  'claude-code': `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M9.4 16.6L4.8 12l4.6-4.6L8 6l-6 6 6 6 1.4-1.4zm5.2 0l4.6-4.6-4.6-4.6L16 6l6 6-6 6-1.4-1.4z"/></svg>`,
  cursor: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13.64 21.97C13.14 22.21 12.54 22 12.31 21.5L10.13 16.76L7.62 18.78C7.45 18.92 7.24 19 7.02 19C6.55 19 6.15 18.61 6.15 18.14V5.86C6.15 5.39 6.55 5 7.02 5C7.24 5 7.45 5.08 7.62 5.22L19.78 15.16C20.08 15.4 20.15 15.82 19.95 16.16C19.75 16.5 19.34 16.65 18.95 16.53L14.78 15.26L16.95 20C17.18 20.5 16.97 21.1 16.47 21.34L13.64 21.97Z"/></svg>`,
  opencode: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/></svg>`,
  windsurf: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z"/></svg>`,
  continue: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>`,
  vscode: `<svg viewBox="0 0 24 24" fill="currentColor"><path d="M17.583 2.004L8.528 10.84 4.533 7.712l-1.87 1.024L6.727 12l-4.064 3.264 1.87 1.024 3.995-3.128 9.055 8.836 3.754-1.712V3.716l-3.754-1.712zM17.25 15.29L10.63 12l6.62-3.29v6.58z"/></svg>`,
};
</script>

<template>
  <a :href="to" class="editor-badge">
    <span class="editor-icon" v-html="icons[icon]"></span>
    <span class="editor-name">{{ name }}</span>
  </a>
</template>

<style scoped>
.editor-badge {
  display: inline-flex;
  align-items: center;
  gap: var(--space-2);
  padding: var(--space-3) var(--space-4);
  border: 1px solid var(--vp-c-border);
  background: var(--vp-c-bg);
  text-decoration: none;
  transition:
    border-color 0.2s,
    background-color 0.2s;
}

.editor-badge:hover {
  border-color: var(--fizzy-cyan);
  background: var(--vp-c-bg-soft);
}

.editor-icon {
  width: 20px;
  height: 20px;
  color: var(--vp-c-text-2);
  display: flex;
  align-items: center;
  justify-content: center;
}

.editor-icon :deep(svg) {
  width: 100%;
  height: 100%;
}

.editor-name {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  font-weight: 500;
  color: var(--vp-c-text-1);
}
</style>
