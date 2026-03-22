<template>
  <div class="permissions-page">
    <div class="page-header">
      <h1 class="page-title">权限管理</h1>
    </div>

    <!-- Sub tabs -->
    <div class="sub-tabs">
      <button
        class="sub-tab"
        :class="{ active: subTab === 'page' }"
        @click="subTab = 'page'"
      >页面权限</button>
      <button
        class="sub-tab"
        :class="{ active: subTab === 'project' }"
        @click="subTab = 'project'"
      >项目权限</button>
    </div>

    <!-- Page Permissions Tab -->
    <div v-if="subTab === 'page'" class="tab-content">
      <div v-if="loading" class="loading-state">加载中…</div>
      <div v-else-if="error" class="empty-state">⚠️ {{ error }}</div>
      <table v-else class="perm-table">
        <thead>
          <tr>
            <th>成员</th>
            <th>部门级</th>
            <th>项目级</th>
            <th>管理后台</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="perm in pagePermissions" :key="perm.member_id">
            <td class="member-cell">
              <span class="member-name">{{ perm.member_name }}</span>
            </td>
            <td>
              <label class="toggle">
                <input
                  type="checkbox"
                  :checked="perm.pages['department']"
                  @change="onTogglePage(perm, 'department', $event)"
                />
                <span class="toggle-slider" />
              </label>
            </td>
            <td>
              <label class="toggle">
                <input
                  type="checkbox"
                  :checked="perm.pages['project']"
                  @change="onTogglePage(perm, 'project', $event)"
                />
                <span class="toggle-slider" />
              </label>
            </td>
            <td>
              <div class="admin-cell">
                <label class="toggle" :class="{ 'toggle-danger': perm.pages['admin'] }">
                  <input
                    type="checkbox"
                    :checked="perm.pages['admin']"
                    :disabled="isLastAdmin(perm)"
                    @change="onTogglePage(perm, 'admin', $event)"
                  />
                  <span class="toggle-slider" />
                </label>
                <span v-if="perm.pages['admin']" class="admin-warn">⚠️ 将成为系统管理员</span>
              </div>
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <!-- Project Permissions Tab -->
    <div v-if="subTab === 'project'" class="tab-content">
      <div v-if="loading" class="loading-state">加载中…</div>
      <div v-else-if="error" class="empty-state">⚠️ {{ error }}</div>
      <div v-else class="member-list">
        <div
          v-for="perm in projectPermissions"
          :key="perm.member_id"
          class="member-row"
          @click="openProjectDrawer(perm)"
        >
          <div class="member-info">
            <span class="member-name">{{ perm.member_name }}</span>
          </div>
          <div class="member-projects-count">
            管理 {{ perm.projects.length }} 个项目
          </div>
          <span class="row-arrow">›</span>
        </div>
      </div>
    </div>

    <!-- Project Permission Drawer -->
    <div v-if="drawerVisible" class="drawer-overlay" @click.self="drawerVisible = false">
      <div class="drawer">
        <div class="drawer-header">
          <h2 class="drawer-title">{{ currentPerm?.member_name }} — 项目权限</h2>
          <button class="drawer-close" @click="drawerVisible = false">✕</button>
        </div>

        <div class="drawer-body">
          <div v-if="drawerProjects.length === 0" class="empty-state">
            暂无可编辑项目
          </div>
          <div v-else class="project-tags">
            <span
              v-for="proj in drawerProjects"
              :key="proj.id"
              class="project-tag"
            >
              {{ proj.name }}
              <button class="tag-remove" @click="removeProject(proj.id)">✕</button>
            </span>
          </div>

          <button class="btn-add-project" @click="showProjectPicker = true">
            + 添加项目
          </button>
        </div>
      </div>
    </div>

    <!-- Project Picker Modal -->
    <div v-if="showProjectPicker" class="modal-overlay" @click.self="showProjectPicker = false">
      <div class="modal">
        <div class="modal-header">
          <h3 class="modal-title">选择项目</h3>
          <button class="drawer-close" @click="showProjectPicker = false">✕</button>
        </div>
        <div class="modal-body">
          <div
            v-for="proj in allProjects"
            :key="proj.id"
            class="project-option"
            :class="{ selected: selectedProjectIds.includes(proj.id) }"
            @click="toggleProjectSelection(proj.id)"
          >
            <span class="option-check">{{ selectedProjectIds.includes(proj.id) ? '☑' : '☐' }}</span>
            <span>{{ proj.name }}</span>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="showProjectPicker = false">取消</button>
          <button class="btn-primary" @click="confirmProjectSelection">确认添加</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import {
  fetchPagePermissions,
  updatePagePermissions,
  fetchProjectPermissions,
  updateProjectPermissions,
  fetchProjects,
  type PagePermission,
  type ProjectPermission,
  type Project,
} from '../../api/index'

// ── Sub tab ────────────────────────────────────────────────
const subTab = ref<'page' | 'project'>('page')

// ── Page permissions ────────────────────────────────────────
const pagePermissions = ref<PagePermission[]>([])
const loading = ref(false)
const error = ref<string | null>(null)

// ── Project permissions ──────────────────────────────────────
const projectPermissions = ref<ProjectPermission[]>([])
const allProjects = ref<Project[]>([])
const drawerVisible = ref(false)
const showProjectPicker = ref(false)
const currentPerm = ref<ProjectPermission | null>(null)
const drawerProjects = ref<{ id: string; name: string }[]>([])
const selectedProjectIds = ref<string[]>([])

// ── Load page permissions ────────────────────────────────────
async function loadPagePermissions() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchPagePermissions()
    pagePermissions.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

async function onTogglePage(perm: PagePermission, pageKey: string, e: Event) {
  const checked = (e.target as HTMLInputElement).checked
  // Optimistic update
  perm.pages[pageKey] = checked
  try {
    await updatePagePermissions([{ member_id: perm.member_id, page_key: pageKey, enabled: checked }])
  } catch {
    // Revert
    perm.pages[pageKey] = !checked
  }
}

function isLastAdmin(perm: PagePermission): boolean {
  if (!perm.pages['admin']) return false
  const adminCount = pagePermissions.value.filter(p => p.pages['admin']).length
  return adminCount <= 1
}

// ── Load project permissions ─────────────────────────────────
async function loadProjectPermissions() {
  loading.value = true
  error.value = null
  try {
    const [permRes, projRes] = await Promise.all([
      fetchProjectPermissions(),
      fetchProjects(),
    ])
    projectPermissions.value = permRes.data
    allProjects.value = projRes.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

function openProjectDrawer(perm: ProjectPermission) {
  currentPerm.value = perm
  drawerProjects.value = [...perm.projects]
  selectedProjectIds.value = []
  drawerVisible.value = true
}

function removeProject(projectId: string) {
  drawerProjects.value = drawerProjects.value.filter(p => p.id !== projectId)
  saveProjectPermissions()
}

function toggleProjectSelection(id: string) {
  const idx = selectedProjectIds.value.indexOf(id)
  if (idx === -1) {
    selectedProjectIds.value.push(id)
  } else {
    selectedProjectIds.value.splice(idx, 1)
  }
}

function confirmProjectSelection() {
  const toAdd = allProjects.value.filter(p => selectedProjectIds.value.includes(p.id))
  // Merge: avoid duplicates
  const existingIds = new Set(drawerProjects.value.map(p => p.id))
  for (const proj of toAdd) {
    if (!existingIds.has(proj.id)) {
      drawerProjects.value.push({ id: proj.id, name: proj.name })
    }
  }
  showProjectPicker.value = false
  saveProjectPermissions()
}

async function saveProjectPermissions() {
  if (!currentPerm.value) return
  try {
    await updateProjectPermissions(
      currentPerm.value.member_id,
      drawerProjects.value.map(p => p.id)
    )
    // Sync back
    currentPerm.value.projects = [...drawerProjects.value]
  } catch (e) {
    console.error('Failed to save project permissions:', e)
  }
}

onMounted(() => {
  if (subTab.value === 'page') loadPagePermissions()
})

watch(subTab, (tab) => {
  if (tab === 'page') loadPagePermissions()
  else if (tab === 'project') loadProjectPermissions()
})

function goToTags() {
  window.location.hash = '#/admin/tags'
}
</script>

<style scoped>
.permissions-page {
  padding: 28px 32px;
  overflow-y: auto;
  height: 100%;
}

.page-header {
  margin-bottom: 20px;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-strong);
}

/* Sub tabs */
.sub-tabs {
  display: flex;
  gap: 4px;
  margin-bottom: 24px;
  border-bottom: 1px solid var(--border);
}

.sub-tab {
  padding: 8px 20px;
  font-size: 13px;
  font-weight: 500;
  font-family: inherit;
  color: var(--muted);
  cursor: pointer;
  border: none;
  background: none;
  border-bottom: 2px solid transparent;
  margin-bottom: -1px;
  transition: color 0.15s, border-color 0.15s;
}

.sub-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.sub-tab:hover:not(.active) {
  color: var(--text);
}

.sub-tab-link {
  margin-left: auto;
  color: var(--accent);
  font-weight: 600;
  opacity: 0.8;
}

.sub-tab-link:hover {
  opacity: 1;
  color: var(--accent);
}

.tab-content {
  animation: fadeSlideIn 0.25s var(--ease-out) both;
}

/* Permissions table */
.perm-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
}

.perm-table th {
  text-align: left;
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  padding: 0 16px 12px 0;
  border-bottom: 1px solid var(--border);
}

.perm-table td {
  padding: 14px 16px 14px 0;
  border-bottom: 1px solid var(--border);
  vertical-align: middle;
}

.member-cell {
  min-width: 160px;
}

.member-name {
  font-weight: 600;
  color: var(--text-strong);
}

/* Toggle switch */
.toggle {
  position: relative;
  display: inline-flex;
  align-items: center;
  cursor: pointer;
}

.toggle input {
  position: absolute;
  opacity: 0;
  width: 0;
  height: 0;
}

.toggle-slider {
  width: 40px;
  height: 22px;
  background: var(--border-strong);
  border-radius: 11px;
  transition: background 0.2s;
  position: relative;
}

.toggle-slider::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  background: #fff;
  border-radius: 50%;
  top: 3px;
  left: 3px;
  transition: transform 0.2s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.2);
}

.toggle input:checked + .toggle-slider {
  background: var(--accent);
}

.toggle input:checked + .toggle-slider::after {
  transform: translateX(18px);
}

.toggle input:disabled + .toggle-slider {
  opacity: 0.4;
  cursor: not-allowed;
}

.toggle input:disabled + .toggle-slider::after {
  display: none;
}

.toggle-danger .toggle-slider {
  box-shadow: 0 0 0 2px rgba(239, 68, 68, 0.3);
}

.admin-cell {
  display: flex;
  align-items: center;
  gap: 10px;
}

.admin-warn {
  font-size: 12px;
  color: #ef4444;
  font-weight: 500;
}

/* Member list */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 0;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--card);
}

.member-row {
  display: flex;
  align-items: center;
  padding: 14px 20px;
  border-bottom: 1px solid var(--border);
  cursor: pointer;
  gap: 12px;
  transition: background 0.15s;
}

.member-row:last-child {
  border-bottom: none;
}

.member-row:hover {
  background: var(--bg-accent);
}

.member-info {
  flex: 1;
}

.member-projects-count {
  font-size: 13px;
  color: var(--muted);
}

.row-arrow {
  font-size: 18px;
  color: var(--muted);
}

/* Project tags */
.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 16px;
}

.project-tag {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  background: var(--accent-subtle);
  color: var(--accent);
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 500;
}

.tag-remove {
  background: none;
  border: none;
  color: inherit;
  cursor: pointer;
  font-size: 12px;
  padding: 0;
  line-height: 1;
  opacity: 0.7;
}

.tag-remove:hover {
  opacity: 1;
}

.btn-add-project {
  width: 100%;
  padding: 10px;
  background: var(--card);
  border: 1px dashed var(--border-strong);
  border-radius: var(--radius-md);
  font-size: 13px;
  font-weight: 500;
  color: var(--muted);
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.btn-add-project:hover {
  border-color: var(--accent);
  color: var(--accent);
  background: var(--accent-subtle);
}

/* Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 420px;
  height: 100%;
  background: var(--card);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.25s var(--ease-out) both;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
}

.drawer-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.drawer-close:hover {
  color: var(--text);
}

.drawer-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 480px;
  max-height: 70vh;
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  animation: fadeSlideIn 0.2s var(--ease-out) both;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.modal-body {
  padding: 12px 16px;
  overflow-y: auto;
  flex: 1;
}

.project-option {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border-radius: var(--radius-sm);
  cursor: pointer;
  font-size: 14px;
  transition: background 0.12s;
}

.project-option:hover {
  background: var(--bg-accent);
}

.project-option.selected {
  background: var(--accent-subtle);
  color: var(--accent);
}

.option-check {
  font-size: 16px;
  line-height: 1;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* Buttons */
.btn-primary {
  padding: 8px 20px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-secondary {
  padding: 8px 20px;
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.btn-secondary:hover {
  border-color: var(--border-strong);
  background: var(--bg-accent);
}

/* Loading / empty */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--muted);
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--muted);
  font-size: 14px;
  gap: 8px;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
