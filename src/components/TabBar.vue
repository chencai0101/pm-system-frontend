<template>
  <nav class="tab-bar">
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
</template>

<script setup lang="ts">
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
.tab-bar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 22px;
  background: var(--bg);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
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
</style>
