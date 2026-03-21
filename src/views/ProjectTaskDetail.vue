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
      <main
        class="board-area"
        ref="boardRef"
        @dragover.prevent="onBoardDragOver"
        @drop.prevent="onBoardDrop"
        @dragleave="onBoardDragLeave"
      >
        <template v-if="selectedProject">
          <div class="board-header">
            <div class="board-project-name">{{ selectedProject.name }}</div>
            <div class="board-project-meta">
              <span class="progress-label">
                进度 {{ Math.round(selectedProject.progress * 100) }}%
              </span>
            </div>
          </div>

          <div v-if="loading" class="loading-state"><span>加载中…</span></div>
          <div v-else-if="error" class="empty-state"><span class="empty-icon">⚠️</span><span>{{ error }}</span></div>
          <div v-else class="board-columns">
            <TaskColumn
              v-for="col in columns"
              :key="col.key"
              :column="col"
              :tasks="tasksByStatus[col.key]"
              @open-edit="onOpenEdit"
              @tasks-reordered="(updated) => onTasksReordered(col.key, updated)"
              @status-change="onStatusChange"
              @drag-start="onTaskDragStart"
              @subtask-toggled="onSubtaskToggled"
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
  updateTaskStatus,
  updateSubtask,
  type Project,
  type Task,
  type TaskStatus,
} from '../api/index'

const props = defineProps<{ projectId: string }>()

const emit = defineEmits<{ 'select-project': [id: string] }>()

const projects = ref<Project[]>([])
const tasks = ref<Task[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const editingTask = ref<Task | null>(null)
const boardRef = ref<HTMLElement | null>(null)

const columns: { key: TaskStatus; label: string }[] = [
  { key: 'open', label: 'Open' },
  { key: 'in-progress', label: 'In Progress' },
  { key: 'review', label: 'Review' },
  { key: 'done', label: 'Done' },
]

// --- Drag state (module-level, shared across all columns) ---
// Reference: FlowBoard uses a module-level `draggedId` variable
let dragTaskId: string | null = null
let dragSourceStatus: TaskStatus | null = null

const tasksByStatus = computed(() => {
  const map: Record<TaskStatus, Task[]> = {
    'open': [], 'in-progress': [], 'review': [], 'done': [],
  }
  for (const t of tasks.value) {
    if (map[t.status]) map[t.status].push(t)
  }
  return map
})

const selectedProject = computed(() =>
  projects.value.find(p => p.id === props.projectId) ?? null
)

// --- Drag handlers (board-level delegation, like FlowBoard) ---
function onBoardDragOver(e: DragEvent) {
  e.preventDefault()
  const col = (e.target as HTMLElement).closest('.task-column') as HTMLElement | null
  if (!col) return
  const targetStatus = col.dataset.status as TaskStatus
  if (!targetStatus) return
  // Highlight the column
  document.querySelectorAll('.task-column').forEach(c => c.classList.remove('drag-over'))
  col.classList.add('drag-over')
}

function onBoardDragLeave(e: DragEvent) {
  const col = (e.target as HTMLElement).closest('.task-column')
  if (col && !(col as HTMLElement).contains(e.relatedTarget as Node | null)) {
    col.classList.remove('drag-over')
  }
}

function onBoardDrop(e: DragEvent) {
  e.preventDefault()
  document.querySelectorAll('.task-column').forEach(c => c.classList.remove('drag-over'))
  if (!dragTaskId || !dragSourceStatus) return

  const col = (e.target as HTMLElement).closest('.task-column') as HTMLElement | null
  if (!col) return

  const targetStatus = col.dataset.status as TaskStatus
  if (!targetStatus || targetStatus === dragSourceStatus) {
    dragTaskId = null
    dragSourceStatus = null
    return
  }

  console.log('[BOARD_DROP] cross-column', dragTaskId, 'from', dragSourceStatus, '→', targetStatus)
  onStatusChange(dragTaskId, targetStatus)
  dragTaskId = null
  dragSourceStatus = null
}

function onTaskDragStart(taskId: string, sourceStatus: TaskStatus) {
  dragTaskId = taskId
  dragSourceStatus = sourceStatus
  console.log('[BOARD] drag-start', taskId, 'from', sourceStatus)
}

// --- Task actions ---
function onSelectProject(id: string) {
  emit('select-project', id)
}

function onOpenEdit(task: Task) {
  editingTask.value = { ...task, subtasks: [...task.subtasks] }
}

async function onTaskSaved(updated: Task) {
  const idx = tasks.value.findIndex(t => t.id === updated.id)
  if (idx !== -1) tasks.value[idx] = updated
  editingTask.value = null
}

function onTasksReordered(_status: TaskStatus, _updated: Task[]) {
  // Currently no-op (column-level reorder without persistence)
}

async function onSubtaskToggled(taskId: string, subtaskId: string, completed: boolean) {
  // Optimistic update: update local state immediately
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return
  const subtask = task.subtasks.find(s => s.id === subtaskId)
  if (!subtask) return
  const oldCompleted = subtask.completed
  subtask.completed = completed
  // API call already done in TaskCard, just reflect result
  // If API failed, TaskCard would have logged; still update optimistically
}

async function onStatusChange(taskId: string, newStatus: TaskStatus) {
  console.log('[STATUS_CHANGE]', taskId, '→', newStatus)
  const task = tasks.value.find(t => t.id === taskId)
  if (!task) return
  const oldStatus = task.status
  // Optimistic update
  task.status = newStatus

  try {
    await updateTaskStatus(taskId, newStatus)
    console.log('[STATUS_CHANGE] success')
  } catch (e) {
    task.status = oldStatus
    console.error('[STATUS_CHANGE] failed:', e, (e as Error)?.message, (e as Error)?.cause)
  }
}

// --- Data loading ---
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

watch(() => props.projectId, (id) => {
  if (id) loadTasks(id)
  else tasks.value = []
}, { immediate: true })

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
.progress-label {
  font-size: 13px;
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
}
.board-columns {
  display: flex;
  gap: 16px;
  flex: 1;
  align-items: flex-start; /* 每个列独立高度，不被最高列拉伸 */
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
.empty-icon { font-size: 40px; opacity: 0.3; }
</style>
