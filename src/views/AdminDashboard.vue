<template>
  <div class="admin-dashboard">
    <!-- Tab Bar -->
    <div class="admin-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="admin-tab"
        :class="{ active: currentTab === tab.key }"
        @click="currentTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Content -->
    <div class="admin-content">
      <MembersPage v-if="currentTab === 'members'" />
      <div v-else-if="currentTab === 'permissions'" class="placeholder">
        <span class="placeholder-icon">🔐</span>
        <h2>权限管理</h2>
        <p>下一个功能，即将开始</p>
      </div>
      <div v-else-if="currentTab === 'tags'" class="placeholder">
        <span class="placeholder-icon">🏷️</span>
        <h2>标签管理</h2>
        <p>下一个功能，即将开始</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MembersPage from './admin/MembersPage.vue'

const tabs = [
  { key: 'members', label: '人员管理', icon: '👤' },
  { key: 'permissions', label: '权限管理', icon: '🔐' },
  { key: 'tags', label: '标签管理', icon: '🏷️' },
] as const

const currentTab = ref<'members' | 'permissions' | 'tags'>('members')
</script>

<style scoped>
.admin-dashboard {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.admin-tabs {
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 32px;
  background: var(--card);
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.admin-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 16px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  font-family: inherit;
}

.admin-tab:hover {
  background: var(--bg-accent);
  color: var(--text);
}

.admin-tab.active {
  background: var(--accent-subtle);
  color: var(--accent);
}

.tab-icon { font-size: 14px; }

.admin-content {
  flex: 1;
  overflow: hidden;
}

.placeholder {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--muted);
}

.placeholder-icon { font-size: 48px; opacity: 0.3; }

.placeholder h2 {
  margin: 0;
  font-size: 18px;
  font-weight: 700;
  color: var(--text-strong);
}

.placeholder p {
  margin: 0;
  font-size: 14px;
}
</style>
