<script setup lang="ts">
const terminalLines = [
  { text: '$ npx fizzy-do-mcp@latest configure', class: 'command' },
  { text: '', class: 'output' },
  { text: 'Fizzy MCP Configuration', class: 'output' },
  { text: '', class: 'output' },
  { text: 'Detected editors:', class: 'action' },
  { text: '  - Claude Desktop', class: 'list-item' },
  { text: '  - Cursor', class: 'list-item' },
  { text: '', class: 'output' },
  { text: 'Enter your Fizzy token: ****', class: 'action' },
  { text: '', class: 'output' },
  { text: 'Configuring Claude Desktop... done', class: 'success' },
  { text: 'Configuring Cursor... done', class: 'success' },
  { text: '', class: 'output' },
  { text: 'Configuration saved!', class: 'success' },
  { text: '', class: 'output' },
  { text: 'You can now use Fizzy with your AI assistant.', class: 'output' },
];
</script>

<template>
  <div class="hero-split">
    <div class="hero-content">
      <div class="hero-badge">Model Context Protocol</div>
      <h1 class="hero-title">Fizzy</h1>
      <p class="hero-subtitle">AI-powered task management</p>
      <p class="hero-description">
        Connect your AI assistant directly to Fizzy. Create cards, manage boards, and track progress
        through natural conversation.
      </p>
      <div class="hero-actions">
        <a href="/getting-started/installation" class="hero-button primary"> Get Started </a>
        <a
          href="https://github.com/ryanyogan/fizzy-do-mcp"
          class="hero-button secondary"
          target="_blank"
        >
          GitHub
        </a>
      </div>
    </div>
    <div class="hero-terminal">
      <div class="terminal-window">
        <div class="terminal-header">
          <span class="terminal-title">Terminal</span>
        </div>
        <div class="terminal-body">
          <div
            v-for="(line, index) in terminalLines"
            :key="index"
            :class="['terminal-line', line.class]"
          >
            {{ line.text }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.hero-split {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--space-12);
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
  align-items: center;
}

.hero-content {
  max-width: 520px;
}

.hero-badge {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  font-weight: 500;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  color: var(--fizzy-cyan);
  margin-bottom: var(--space-4);
}

.hero-title {
  font-family: var(--vp-font-family-mono);
  font-size: 4rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--vp-c-text-1);
  margin: 0 0 var(--space-4);
}

.hero-subtitle {
  font-family: var(--vp-font-family-mono);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--vp-c-text-2);
  margin: 0 0 var(--space-4);
  line-height: 1.3;
}

.hero-description {
  font-size: 1.1rem;
  color: var(--vp-c-text-3);
  line-height: 1.7;
  margin: 0 0 var(--space-8);
}

.hero-actions {
  display: flex;
  gap: var(--space-3);
}

.hero-button {
  font-family: var(--vp-font-family-mono);
  font-size: 14px;
  font-weight: 500;
  padding: var(--space-3) var(--space-5);
  text-decoration: none;
  transition: all 0.15s;
  display: inline-block;
}

.hero-button.primary {
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
  border: 1px solid var(--vp-c-text-1);
}

.hero-button.primary:hover {
  opacity: 0.85;
}

.hero-button.secondary {
  background: transparent;
  color: var(--vp-c-text-1);
  border: 1px solid var(--vp-c-border);
}

.hero-button.secondary:hover {
  border-color: var(--vp-c-text-1);
  background: var(--vp-c-bg-soft);
}

/* Terminal */
.hero-terminal {
  display: flex;
  justify-content: center;
}

.terminal-window {
  width: 100%;
  max-width: 480px;
  background: #0a0a0a;
  border: 1px solid var(--vp-c-border);
  overflow: hidden;
}

.terminal-header {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--space-3) var(--space-4);
  background: #111111;
  border-bottom: 1px solid var(--vp-c-border);
}

.terminal-title {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--vp-c-text-3);
}

.terminal-body {
  padding: var(--space-4);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
  min-height: 320px;
  color: var(--gray-400);
}

.terminal-line {
  white-space: pre-wrap;
  min-height: 1.6em;
}

.terminal-line.command {
  color: #e5e5e5;
}

.terminal-line.command::before {
  content: '';
}

.terminal-line.list-item {
  color: var(--gray-400);
}

.terminal-line.success {
  color: #22c55e;
}

.terminal-line.action {
  color: var(--gray-300);
}

.terminal-line.output {
  color: var(--gray-500);
}

/* Responsive */
@media (max-width: 960px) {
  .hero-split {
    grid-template-columns: 1fr;
    gap: var(--space-8);
    padding: var(--space-12) var(--space-4);
  }

  .hero-content {
    max-width: 100%;
    text-align: center;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }

  .hero-actions {
    justify-content: center;
  }

  .terminal-window {
    max-width: 100%;
  }

  .terminal-body {
    min-height: 280px;
    font-size: 12px;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .hero-subtitle {
    font-size: 1.1rem;
  }

  .hero-description {
    font-size: 1rem;
  }

  .hero-actions {
    flex-direction: column;
  }

  .hero-button {
    text-align: center;
  }
}
</style>
