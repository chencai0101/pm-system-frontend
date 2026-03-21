<template>
  <div class="app">
    <div class="page-body">
      <!-- Left: Project List -->
      <aside class="sidebar">
        <ProjectList
          :projects="projects"
          :selected-id="projectId"
          :tasks="tasks"
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
                进度 {{ realProgress }}%
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
const tasksByProject = ref<Record<string, Task[]>>({})
const loading = ref(false)
const error = ref<string | null>(null)
const editingTask = ref<Task | null>(null)
const boardRef = ref<HTMLElement | null>(null)

// tasks for the currently selected project (convenience accessor)
const tasks = computed(() => tasksByProject.value[props.projectId] ?? [])

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

// Real progress: only top-level tasks (no parentId), done status = completed
const totalTasks = computed(() => tasks.value.filter(t => !t.parentId).length)
const doneTasks = computed(() => tasks.value.filter(t => !t.parentId && t.status === 'done').length)
const realProgress = computed(() =>
  totalTasks.value === 0 ? 0 : Math.round((doneTasks.value / totalTasks.value) * 100)
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

async function onTaskSaved(updated: Task & { subtasks?: any[] }) {
  const projectTasks = tasksByProject.value[props.projectId]
  if (!projectTasks) return
  const idx = projectTasks.findIndex(t => t.id === updated.id)
  if (idx !== -1) tasksByProject.value[props.projectId][idx] = updated
  editingTask.value = null
}

function onTasksReordered(_status: TaskStatus, _updated: Task[]) {
  // Currently no-op (column-level reorder without persistence)
}

async function onSubtaskToggled(taskId: string, subtaskId: string, completed: boolean) {
  const task = tasksByProject.value[props.projectId]?.find(t => t.id === taskId)
  if (!task) return
  const subtask = task.subtasks.find(s => s.id === subtaskId)
  if (!subtask) return
  subtask.completed = completed
  recalcProjectProgress(props.projectId)
}

async function onStatusChange(taskId: string, newStatus: TaskStatus) {
  console.log('[STATUS_CHANGE]', taskId, '→', newStatus)
  const task = tasksByProject.value[props.projectId]?.find(t => t.id === taskId)
  if (!task) return
  const oldStatus = task.status
  task.status = newStatus

  try {
    await updateTaskStatus(taskId, newStatus)
    console.log('[STATUS_CHANGE] success')
    // Recalculate progress for the current project and sync to sidebar
    recalcProjectProgress(props.projectId)
  } catch (e) {
    task.status = oldStatus
    console.error('[STATUS_CHANGE] failed:', e, (e as Error)?.message, (e as Error)?.cause)
  }
}

function recalcProjectProgress(projectId: string) {
  const pts = tasksByProject.value[projectId] ?? []
  const total = pts.filter(t => !t.parentId).length
  const done = pts.filter(t => !t.parentId && t.status === 'done').length
  const progress = total === 0 ? 0 : Math.round((done / total) * 100)
  const proj = projects.value.find(p => p.id === projectId)
  if (proj) proj.progress = progress
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
    tasksByProject.value[projectId] = res.data
    // Sync fresh progress to sidebar so cached projects always show correct %
    recalcProjectProgress(projectId)
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }
}

watch(() => props.projectId, (id) => {
  if (id) loadTasks(id)
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
