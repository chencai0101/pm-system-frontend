<template>
  <header class="header">
    <div class="header-left">
      <div class="header-logo">
        <div class="header-logo-icon">☰</div>
        <div class="header-brand">
          <span class="header-title">数智管理事业部</span>
          <span class="header-subtitle">Project Management</span>
        </div>
      </div>
    </div>

    <nav class="header-tabs">
      <button
        class="tab"
        :class="{ active: currentTab === 'dashboard' }"
        @click="$emit('click:dashboard')"
      >
        <span class="tab-icon">📊</span>
        部门看板
      </button>
      <button
        class="tab"
        :class="{ active: currentTab === 'project' }"
        :disabled="!projectId"
        @click="$emit('click:project')"
      >
        <span class="tab-icon">📋</span>
        项目详情
        <span v-if="projectId" class="tab-project-id">{{ projectId }}</span>
      </button>
    </nav>

    <div class="header-right">
      <ThemeToggle />
    </div>
  </header>
</template>

<script setup lang="ts">
import ThemeToggle from './ThemeToggle.vue'

defineProps<{
  currentTab: 'dashboard' | 'project'
  projectId: string
}>()

defineEmits<{
  'click:dashboard': []
  'click:project': []
}>()
</script>

<style scoped>
.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 24px;
  height: 56px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
  transition: background var(--duration-normal), border-color var(--duration-normal);
  gap: 24px;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 14px;
}

.header-logo {
  display: flex;
  align-items: center;
  gap: 10px;
}

.header-logo-icon {
  width: 32px;
  height: 32px;
  background: var(--accent);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;
  color: #fff;
  font-weight: 700;
  flex-shrink: 0;
}

.header-brand {
  display: flex;
  flex-direction: column;
}

.header-title {
  font-size: 15px;
  font-weight: 700;
  letter-spacing: 0.04em;
  color: var(--text-strong);
  line-height: 1.2;
}

.header-subtitle {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  font-weight: 500;
}

.header-tabs {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text);
  cursor: pointer;
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  background: var(--card);
  transition: all var(--duration-normal);
  line-height: 1;
}

.tab:hover:not(:disabled) {
  background: var(--bg-accent);
  border-color: var(--border-strong);
}

.tab.active {
  color: #fff;
  background: var(--accent);
  border-color: var(--accent);
}

.tab.active:hover {
  background: var(--accent-hover);
  border-color: var(--accent-hover);
}

.tab:disabled {
  opacity: 0.45;
  cursor: not-allowed;
}

.tab-icon {
  font-size: 13px;
}

.tab-project-id {
  font-size: 10px;
  font-family: "JetBrains Mono", monospace;
  opacity: 0.75;
  margin-left: 2px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 12px;
}
</style>
