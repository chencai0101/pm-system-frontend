<template>
  <div class="admin-dashboard">
    <!-- Admin TabBar -->
    <div class="admin-tabs">
      <button
        v-for="tab in tabs"
        :key="tab.key"
        class="admin-tab"
        :class="{ active: currentAdminTab === tab.key }"
        @click="currentAdminTab = tab.key"
      >
        <span class="tab-icon">{{ tab.icon }}</span>
        {{ tab.label }}
      </button>
    </div>

    <!-- Sub-pages (shown/hidden via v-if) -->
    <div class="admin-content">
      <MembersPage v-if="currentAdminTab === 'members'" />
      <PermissionsPage v-else-if="currentAdminTab === 'permissions'" />
      <TagsPage v-else-if="currentAdminTab === 'tags'" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import MembersPage from './admin/MembersPage.vue'
import PermissionsPage from './admin/PermissionsPage.vue'
import TagsPage from './admin/TagsPage.vue'

const tabs = [
  { key: 'members', label: '人员管理', icon: '👤' },
  { key: 'permissions', label: '权限管理', icon: '🔐' },
  { key: 'tags', label: '标签管理', icon: '🏷️' },
] as const

const currentAdminTab = ref<'members' | 'permissions' | 'tags'>('members')
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
  padding: 7px 18px;
  font-size: 13px;
  font-weight: 600;
  font-family: inherit;
  color: var(--muted);
  cursor: pointer;
  border: 1px solid transparent;
  border-radius: var(--radius-sm);
  background: none;
  transition: all var(--duration-normal);
}
.admin-tab:hover {
  color: var(--text);
  background: var(--bg-accent);
}
.admin-tab.active {
  color: var(--accent);
  background: var(--accent-subtle);
  border-color: rgba(255, 92, 92, 0.2);
}

.admin-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* Placeholder for tabs not yet implemented */
.placeholder-page {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  gap: 12px;
  color: var(--muted);
}
.placeholder-icon { font-size: 48px; opacity: 0.4; }
.placeholder-page h2 {
  font-size: 20px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0;
}
.placeholder-page p {
  font-size: 14px;
  margin: 0;
}
</style>
