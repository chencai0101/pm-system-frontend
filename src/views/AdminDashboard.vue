<template>
  <div class="admin-layout">
    <!-- Sidebar — mirrors ProjectTaskDetail sidebar style -->
    <aside class="sidebar">
      <nav class="sidebar-nav">
        <button
          v-for="tab in tabs"
          :key="tab.key"
          class="nav-item"
          :class="{ active: currentTab === tab.key }"
          @click="currentTab = tab.key"
        >
          <span class="nav-icon">{{ tab.icon }}</span>
          <span class="nav-label">{{ tab.label }}</span>
        </button>
      </nav>
    </aside>

    <!-- Main content -->
    <main class="admin-main">
      <MembersPage v-if="currentTab === 'members'" />
      <ProjectsAdminPage v-else-if="currentTab === 'projects'" />
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
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MembersPage from './admin/MembersPage.vue'
import ProjectsAdminPage from './admin/ProjectsAdminPage.vue'

const tabs = [
  { key: 'members', label: '人员管理', icon: '👤' },
  { key: 'projects', label: '项目管理', icon: '📁' },
  { key: 'permissions', label: '权限管理', icon: '🔐' },
  { key: 'tags', label: '标签管理', icon: '🏷️' },
] as const

const currentTab = ref<'members' | 'projects' | 'permissions' | 'tags'>('members')
</script>

<style scoped>
/* Layout — same as ProjectTaskDetail */
.admin-layout {
  display: flex;
  height: 100%;
  overflow: hidden;
}

.sidebar {
  width: 360px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  background: var(--card);
  display: flex;
  flex-direction: column;
  overflow-y: auto;
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 8px;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 14px;
  border: none;
  background: transparent;
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  transition: background 0.15s, color 0.15s;
  text-align: left;
  font-family: inherit;
  border-left: 3px solid transparent;
}

.nav-item:hover {
  background: var(--bg-accent);
  color: var(--text);
}

.nav-item.active {
  background: var(--accent-subtle);
  color: var(--accent);
  border-left-color: var(--accent);
  font-weight: 700;
}

.nav-icon {
  font-size: 14px;
  flex-shrink: 0;
  width: 18px;
  text-align: center;
}

.nav-label {
  flex: 1;
}

/* Content area */
.admin-main {
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
