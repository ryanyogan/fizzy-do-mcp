<script setup lang="ts">
// No terminal needed
</script>

<template>
  <div class="hero-centered">
    <div class="hero-content">
      <div class="hero-title-row">
        <img src="/logo-orange.svg" alt="Fizzy Do" class="hero-logo" />
        <h1 class="hero-title">Fizzy Do</h1>
      </div>
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
  </div>
</template>

<style scoped>
.hero-centered {
  display: flex;
  justify-content: center;
  align-items: center;
  max-width: 1200px;
  margin: 0 auto;
  padding: var(--space-16) var(--space-6);
}

.hero-content {
  max-width: 640px;
  text-align: center;
}

.hero-title-row {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: var(--space-4);
  margin-bottom: var(--space-4);
}

.hero-logo {
  width: 56px;
  height: 56px;
  filter: drop-shadow(0 3px 6px rgba(249, 115, 22, 0.35));
}

.hero-title {
  font-family: var(--vp-font-family-mono);
  font-size: 4rem;
  font-weight: 700;
  letter-spacing: -0.04em;
  line-height: 1;
  color: var(--vp-c-text-1);
  margin: 0;
}

.hero-subtitle {
  font-family: var(--vp-font-family-mono);
  font-size: 1.5rem;
  font-weight: 500;
  color: var(--fizzy-accent-2);
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
  justify-content: center;
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

/* Responsive */
@media (max-width: 960px) {
  .hero-centered {
    padding: var(--space-12) var(--space-4);
  }

  .hero-content {
    max-width: 100%;
  }

  .hero-logo {
    width: 48px;
    height: 48px;
  }

  .hero-title {
    font-size: 3rem;
  }

  .hero-subtitle {
    font-size: 1.25rem;
  }
}

@media (max-width: 640px) {
  .hero-title-row {
    gap: var(--space-3);
  }

  .hero-logo {
    width: 40px;
    height: 40px;
  }

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
