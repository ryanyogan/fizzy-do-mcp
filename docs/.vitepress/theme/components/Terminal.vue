<script setup lang="ts">
import { ref } from 'vue';

interface Props {
  title?: string;
  lines?: string[];
}

const props = withDefaults(defineProps<Props>(), {
  title: 'Terminal',
  lines: () => [],
});

const copied = ref(false);

function getCommandText(): string {
  return props.lines
    .filter((line) => !line.startsWith('#'))
    .map((line) => line.replace(/^\$ /, ''))
    .join('\n');
}

async function copyToClipboard() {
  try {
    await navigator.clipboard.writeText(getCommandText());
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch (err) {
    console.error('Failed to copy:', err);
  }
}

function parseLineType(line: string): 'prompt' | 'output' | 'comment' {
  if (line.startsWith('$ ')) return 'prompt';
  if (line.startsWith('#')) return 'comment';
  return 'output';
}

function formatLine(line: string): string {
  if (line.startsWith('$ ')) return line.slice(2);
  if (line.startsWith('#')) return line;
  return line;
}
</script>

<template>
  <div class="terminal">
    <div class="terminal-header">
      <span class="terminal-title">{{ title }}</span>
      <button class="terminal-copy" @click="copyToClipboard" :title="copied ? 'Copied!' : 'Copy'">
        {{ copied ? 'Copied' : 'Copy' }}
      </button>
    </div>
    <div class="terminal-body">
      <span
        v-for="(line, index) in lines"
        :key="index"
        class="terminal-line"
        :class="parseLineType(line)"
      >
        {{ formatLine(line) }}
      </span>
    </div>
  </div>
</template>

<style scoped>
.terminal {
  border: 1px solid var(--vp-c-border);
  overflow: hidden;
  margin: var(--space-6) 0;
  background-color: #0a0a0a;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: var(--space-3) var(--space-4);
  background-color: #111111;
  border-bottom: 1px solid var(--vp-c-border);
}

.terminal-title {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.terminal-copy {
  background: none;
  border: 1px solid transparent;
  color: var(--vp-c-text-3);
  cursor: pointer;
  padding: var(--space-1) var(--space-2);
  font-family: var(--vp-font-family-mono);
  font-size: 11px;
  transition: all 0.15s;
}

.terminal-copy:hover {
  color: var(--fizzy-cyan);
  border-color: var(--fizzy-cyan);
}

.terminal-body {
  padding: var(--space-4);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  color: #e5e5e5;
}

.terminal-line {
  display: block;
}

.terminal-line.prompt::before {
  content: '$ ';
  color: var(--fizzy-cyan);
}

.terminal-line.output {
  color: var(--gray-400);
}

.terminal-line.comment {
  color: var(--gray-600);
  font-style: italic;
}
</style>
