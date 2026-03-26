<template>
  <div class="app">
    <main class="main-content">
      <div class="title-row">
        <p class="section-title">全部项目 · {{ projects.length }}</p>
      </div>

      <div v-if="loading" class="loading-state"><span>加载中…</span></div>
      <div v-else-if="error" class="empty-state"><span class="empty-icon">⚠️</span><span>{{ error }}</span></div>
      <div v-else-if="projects.length === 0" class="empty-state"><span class="empty-icon">📭</span><span>暂无项目</span></div>

      <div v-else class="project-grid">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :clickable="true"
          :computed-progress="projectProgressMap[project.id]"
          @click="onCardClick(project.id)"
        />
      </div>

      <ProjectCreateModal
        v-if="showCreateModal"
        @close="showCreateModal = false"
        @created="onProjectCreated"
      />

    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProjectCard from './ProjectCard.vue'
import ProjectCreateModal from './ProjectCreateModal.vue'
import { fetchProjects, fetchTasksByProject, type Project, type Task } from '../api/index'

const projects = ref<Project[]>([])
const tasksByProject = ref<Record<string, Task[]>>({})
const loading = ref(true)
const error = ref<string | null>(null)
const showCreateModal = ref(false)

const emit = defineEmits<{ 'select-project': [id: string] }>()

// Compute real progress per project from top-level tasks
const projectProgressMap = computed(() => {
  const map: Record<string, number> = {}
  for (const p of projects.value) {
    const projectTasks = tasksByProject.value[p.id] ?? []
    const topTasks = projectTasks.filter(t => !t.parentId)
    const total = topTasks.length
    const done = topTasks.filter(t => t.status === 'done').length
    map[p.id] = total === 0 ? 0 : done / total
  }
  return map
})

function onCardClick(id: string) {
  console.log('[Dashboard] card clicked:', id)
  emit('select-project', id)
}

async function loadProjects() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchProjects()
    projects.value = res.data

    // Fetch tasks for each project in parallel to compute real progress
    const projectIds = res.data.map((p: Project) => p.id)
    const results = await Promise.allSettled(
      projectIds.map(id => fetchTasksByProject(id))
    )
    for (let i = 0; i < projectIds.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled') {
        tasksByProject.value[projectIds[i]] = result.value.data
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }
}

function onProjectCreated() {
  showCreateModal.value = false
  loadProjects()
}

onMounted(loadProjects)
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  overflow: hidden;
}
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.title-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 16px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin: 0;
}
.btn-add {
  padding: 6px 14px;
  background: var(--accent);
  color: white;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-add:hover { opacity: 0.88; }
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
.empty-icon { font-size: 40px; opacity: 0.3; }
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
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
.dialog-body {
  padding: 20px;
}
.dialog-body p {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}
.dialog-error {
  color: #ef4444;
  font-size: 12px;
}
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
