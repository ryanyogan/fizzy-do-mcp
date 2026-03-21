<script setup lang="ts">
interface Message {
  role: 'user' | 'ai';
  content: string;
}

interface Props {
  title?: string;
  messages: Message[];
}

withDefaults(defineProps<Props>(), {
  title: 'Conversation',
});
</script>

<template>
  <div class="conversation-terminal">
    <div class="terminal-header">
      <span class="terminal-title">{{ title }}</span>
    </div>
    <div class="terminal-body">
      <div
        v-for="(message, index) in messages"
        :key="index"
        class="message"
        :class="message.role"
      >
        <span class="message-role">{{ message.role === 'user' ? 'You' : 'AI' }}:</span>
        <span class="message-content">{{ message.content }}</span>
      </div>
    </div>
  </div>
</template>

<style scoped>
.conversation-terminal {
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
  border-bottom: 1px solid var(--gray-800);
}

.terminal-title {
  font-family: var(--vp-font-family-mono);
  font-size: 12px;
  color: var(--gray-400);
}

.terminal-body {
  padding: var(--space-4);
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
  line-height: 1.6;
}

.message {
  margin-bottom: var(--space-4);
  word-wrap: break-word;
  overflow-wrap: break-word;
  white-space: pre-wrap;
}

.message:last-child {
  margin-bottom: 0;
}

.message-role {
  font-weight: 600;
  margin-right: var(--space-2);
}

.message.user .message-role {
  color: var(--fizzy-orange);
}

.message.user .message-content {
  color: #e5e5e5;
}

.message.ai .message-role {
  color: var(--fizzy-cyan);
}

.message.ai .message-content {
  color: var(--gray-300);
}

/* Responsive */
@media (max-width: 768px) {
  .terminal-body {
    padding: var(--space-3);
    font-size: 12px;
  }

  .message {
    margin-bottom: var(--space-3);
  }
}
</style>
