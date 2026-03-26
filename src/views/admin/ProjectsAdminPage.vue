<template>
  <div class="projects-admin-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-row">
        <h1 class="page-title">项目管理</h1>
        <span class="project-count">共 {{ projects.length }} 个项目</span>
      </div>
      <div class="page-toolbar">
        <input
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索项目名称…"
        />
        <button class="btn-primary ml-auto" @click="showCreateModal = true">+ 新建项目</button>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="state-message">加载中…</div>
    <div v-else-if="error" class="state-message error">⚠️ {{ error }}</div>
    <div v-else-if="projects.length === 0" class="state-message">暂无项目</div>

    <!-- Project list — card style, matches MembersPage exactly -->
    <div v-else class="project-list">
      <div
        v-for="project in filteredProjects"
        :key="project.id"
        class="project-row"
      >
        <div class="project-row-left">
          <span class="project-name">{{ project.name }}</span>
          <span class="status-badge" :class="effectiveStatus(project)">
            {{ effectiveStatus(project) }}
          </span>
        </div>
        <div class="project-row-meta">
          <span>{{ project.owner }}</span>
          <span class="meta-sep">·</span>
          <span v-if="(project as any).members" class="meta-members">{{ (project as any).members }}</span>
          <span class="meta-sep" v-if="(project as any).members">·</span>
          <span>{{ project.startDate }} → {{ project.endDate }}</span>
          <span class="meta-sep">·</span>
          <span>{{ project.completedCount }}/{{ project.taskCount }} 任务</span>
          <span class="meta-sep" v-if="(project as any).resources">·</span>
          <span v-if="(project as any).resources" class="meta-resources">资源：{{ (project as any).resources }}</span>
        </div>
        <div class="project-row-right" @click.stop>
          <button class="icon-btn" title="查看项目" @click="goToProject(project.id)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button class="icon-btn" title="编辑" @click="openEditModal(project)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn danger" title="删除" @click="confirmDelete(project)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create modal -->
    <ProjectCreateModal
      v-if="showCreateModal"
      @close="showCreateModal = false"
      @created="onProjectCreated"
    />

    <!-- Edit modal -->
    <ProjectEditModal
      v-if="showEditModal && editingProject"
      :project="editingProject"
      @close="closeEditModal"
      @updated="onProjectUpdated"
    />

    <!-- Delete confirm dialog -->
    <div v-if="deleteDialogVisible" class="modal-overlay" @click.self="deleteDialogVisible = false">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">确认删除项目</span>
          <button class="close-btn" @click="deleteDialogVisible = false">✕</button>
        </div>
        <div class="dialog-body">
          <p>确定要删除项目 <strong>{{ deleteTarget?.name }}</strong> 吗？此操作不可恢复。</p>
          <p v-if="deleteError" class="dialog-error">{{ deleteError }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="deleteDialogVisible = false">取消</button>
          <button class="btn-danger" @click="executeDelete" :disabled="deleting">
            {{ deleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProjectCreateModal from '../../components/ProjectCreateModal.vue'
import ProjectEditModal from '../../components/ProjectEditModal.vue'
import { fetchProjects, deleteProject, type Project } from '../../api/index'

const projects = ref<Project[]>([])
const loading = ref(false)
const error = ref('')
const searchKeyword = ref('')
const showCreateModal = ref(false)
const showEditModal = ref(false)
const editingProject = ref<Project | null>(null)
const deleteDialogVisible = ref(false)
const deleteTarget = ref<Project | null>(null)
const deleteError = ref('')
const deleting = ref(false)

const filteredProjects = computed(() => {
  if (!searchKeyword.value) return projects.value
  const q = searchKeyword.value.toLowerCase()
  return projects.value.filter(p => p.name.toLowerCase().includes(q))
})

function effectiveStatus(project: Project): string {
  const pct = (project.progress ?? 0) * 100
  if (pct >= 100) return '已完成'
  if (pct > 0) return '进行中'
  return '未开始'
}

async function loadProjects() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchProjects()
    projects.value = res.data
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

function goToProject(projectId: string) {
  window.location.hash = `#/project/${projectId}`
  window.dispatchEvent(new CustomEvent('open-project', { detail: { projectId } }))
}

function openEditModal(project: Project) {
  editingProject.value = project
  showEditModal.value = true
}

function closeEditModal() {
  showEditModal.value = false
  editingProject.value = null
}

function onProjectCreated() {
  showCreateModal.value = false
  loadProjects()
}

function onProjectUpdated() {
  closeEditModal()
  loadProjects()
}

function confirmDelete(project: Project) {
  deleteTarget.value = project
  deleteError.value = ''
  deleteDialogVisible.value = true
}

async function executeDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteProject(deleteTarget.value.id)
    deleteDialogVisible.value = false
    deleteTarget.value = null
    loadProjects()
  } catch (e: any) {
    deleteError.value = e.message || '删除失败'
  } finally {
    deleting.value = false
  }
}

onMounted(loadProjects)
</script>

<style scoped>
.projects-admin-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 32px;
  overflow-y: auto;
  height: 100%;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-strong);
  margin: 0;
}

.project-count {
  font-size: 13px;
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
}

.page-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  outline: none;
  min-width: 220px;
  transition: border-color 0.15s;
}

.search-input:focus { border-color: var(--accent); }

.btn-primary {
  padding: 6px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:hover { opacity: 0.85; }
.ml-auto { margin-left: auto; }

.state-message {
  font-size: 14px;
  color: var(--muted);
  padding: 24px 0;
  text-align: center;
}

.state-message.error { color: #ef4444; }

/* Card list — matches MembersPage exactly */
.project-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.project-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  cursor: pointer;
  transition: box-shadow 0.15s;
}

.project-row:hover {
  box-shadow: var(--shadow-sm);
}

.project-row-left {
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-row-meta {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--muted);
  white-space: nowrap;
  flex-shrink: 0;
}

.meta-sep {
  color: var(--border-strong);
}

.status-badge {
  display: inline-block;
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;
  flex-shrink: 0;
}

.status-badge.未开始 { background: var(--bg-accent); color: var(--muted); }
.status-badge.进行中 { background: var(--accent-subtle); color: var(--accent); }
.status-badge.已完成 { background: #22c55e22; color: #22c55e; }

.project-row-right {
  display: flex;
  align-items: center;
  gap: 4px;
  flex-shrink: 0;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.icon-btn:hover { color: var(--accent); background: var(--accent-subtle); }
.icon-btn.danger:hover { color: #ef4444; background: #fee2e2; }

/* Modal + dialog */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.dialog {
  width: 380px;
  max-width: 90vw;
  background: var(--card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.close-btn:hover { background: var(--bg-accent); color: var(--text); }

.dialog-body { padding: 20px; }
.dialog-body p { margin: 0 0 8px; font-size: 13px; color: var(--text); line-height: 1.5; }
.dialog-error { color: #ef4444; font-size: 12px; }

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
}

.btn-cancel {
  padding: 7px 16px;
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-cancel:hover { background: var(--bg-accent); }

.btn-danger {
  padding: 7px 16px;
  background: #ef4444;
  border: none;
  color: white;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
}

.btn-danger:hover { opacity: 0.9; }
.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }
</style>
