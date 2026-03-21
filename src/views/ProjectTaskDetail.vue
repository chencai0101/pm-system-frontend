<template>
  <div class="app">
    <div class="page-body">
      <!-- Left: Project List -->
      <aside class="sidebar">
        <ProjectList
          :projects="projects"
          :selected-id="projectId"
          @select="onSelectProject"
        />
      </aside>

      <!-- Right: Task Board -->
      <main class="board-area">
        <template v-if="selectedProject">
          <div class="board-header">
            <div class="board-project-name">{{ selectedProject.name }}</div>
            <div class="board-project-meta">
              <span class="progress-label">
                进度 {{ Math.round(selectedProject.progress * 100) }}%
              </span>
            </div>
          </div>

          <div v-if="loading" class="loading-state">
            <span>加载中…</span>
          </div>
          <div v-else-if="error" class="empty-state">
            <span class="empty-icon">⚠️</span>
            <span>{{ error }}</span>
          </div>
          <div v-else class="board-columns">
            <TaskColumn
              v-for="col in columns"
              :key="col.key"
              :column="col"
              :tasks="tasksByStatus[col.key]"
              @open-edit="onOpenEdit"
              @tasks-reordered="(updated) => onTasksReordered(col.key, updated)"
            />
          </div>
        </template>

        <template v-else>
          <div class="empty-state">
            <span class="empty-icon">👈</span>
            <span>请从左侧选择一个项目</span>
          </div>
        </template>
      </main>
    </div>

    <!-- Task Edit Modal -->
    <TaskEditModal
      v-if="editingTask"
      :task="editingTask"
      @close="editingTask = null"
      @saved="onTaskSaved"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import ProjectList from '../components/ProjectList.vue'
import TaskColumn from '../components/TaskColumn.vue'
import TaskEditModal from '../components/TaskEditModal.vue'
import {
  fetchProjects,
  fetchTasksByProject,
  type Project,
  type Task,
  type TaskStatus,
} from '../api/index'

const props = defineProps<{ projectId: string }>()

const projects = ref<Project[]>([])
const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const editingTask = ref<Task | null>(null)

const columns: { key: TaskStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

const tasksByStatus = computed(() => {
  const map: Record<TaskStatus, Task[]> = {
    'open': [],
    'in-progress': [],
    'review': [],
    'done': [],
  }
  for (const t of tasks.value) {
    if (map[t.status]) map[t.status].push(t)
  }
  return map
})

const selectedProject = computed(() =>
  projects.value.find(p => p.id === props.projectId) ?? null
)

async function loadProjects() {
  const res = await fetchProjects()
  projects.value = res.data
}

async function loadTasks(projectId: string) {
  loading.value = true
  error.value = null
  try {
    const res = await fetchTasksByProject(projectId)
    tasks.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }
}

function onSelectProject(project: Project) {
  window.location.hash = `#/project/${project.id}`
}

function onOpenEdit(task: Task) {
  editingTask.value = { ...task, subtasks: [...task.subtasks] }
}

async function onTaskSaved(updated: Task) {
  // Update local state
  const idx = tasks.value.findIndex(t => t.id === updated.id)
  if (idx !== -1) tasks.value[idx] = updated
  editingTask.value = null
}

function onTasksReordered(status: TaskStatus, reorderedTasks: Task[]) {
  // Replace the tasks for this status with the reordered list
  const others = tasks.value.filter(t => t.status !== status)
  tasks.value = [...others, ...reorderedTasks]
}

// Load tasks when projectId changes
watch(
  () => props.projectId,
  (id) => {
    if (id) loadTasks(id)
    else tasks.value = []
  },
  { immediate: true }
)

onMounted(async () => {
  await loadProjects()
  if (props.projectId) await loadTasks(props.projectId)
})
</script>

<style scoped>
.page-body {
  display: flex;
  flex: 1;
  overflow: hidden;
  height: calc(100vh - 56px);
}

.sidebar {
  width: 240px;
  flex-shrink: 0;
  border-right: 1px solid var(--border);
  overflow-y: auto;
  background: var(--card);
}

.board-area {
  flex: 1;
  overflow-x: auto;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.board-header {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 8px;
  flex-shrink: 0;
}

.board-project-name {
  font-size: 20px;
  font-weight: 800;
  color: var(--text-strong);
}

.board-project-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.progress-label {
  font-size: 13px;
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
}

.board-columns {
  display: flex;
  gap: 16px;
  flex: 1;
  min-height: 0;
}

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

.empty-icon {
  font-size: 40px;
  opacity: 0.3;
}
</style>
