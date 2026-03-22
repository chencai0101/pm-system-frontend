<template>
  <div class="app">
    <div class="page-body">
      <!-- Left: Project List -->
      <aside class="sidebar">
        <ProjectList
          :projects="projects"
          :selected-id="projectId"
          :tasks-by-project="tasksByProject"
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
              <button class="btn-add-task" @click="onAddTask">+ 任务</button>
              <button class="btn-delete-project" title="删除项目" @click="confirmDeleteProject">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                  <polyline points="3 6 5 6 21 6"/>
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
                  <path d="M10 11v6M14 11v6"/>
                </svg>
              </button>
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
              @tasks-reordered="(updated: Task[]) => onTasksReordered(col.key, updated)"
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
      :task="editMode === 'edit' ? editingTask : undefined"
      :mode="editMode"
      :project-id="props.projectId"
      @close="editingTask = null; editMode = 'edit'"
      @saved="onTaskSaved"
    />

    <!-- Delete project confirm dialog -->
    <div v-if="deleteDialogVisible" class="modal-overlay" @click.self="deleteDialogVisible = false">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">确认删除项目</span>
          <button class="close-btn" @click="deleteDialogVisible = false">✕</button>
        </div>
        <div class="dialog-body">
          <p>确定要删除项目 <strong>{{ selectedProject?.name }}</strong> 吗？此操作不可恢复。</p>
          <p v-if="deleteError" class="dialog-error">{{ deleteError }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="deleteDialogVisible = false">取消</button>
          <button class="btn-danger" @click="executeDeleteProject" :disabled="deleting">
            {{ deleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
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
  deleteProject,
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
const editMode = ref<'add' | 'edit'>('edit')

// Delete project dialog
const deleteDialogVisible = ref(false)
const deleteError = ref('')
const deleting = ref(false)

function confirmDeleteProject() {
  deleteError.value = ''
  deleteDialogVisible.value = true
}

async function executeDeleteProject() {
  if (!props.projectId) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteProject(props.projectId)
    deleteDialogVisible.value = false
    // Navigate back to dashboard
    window.location.hash = '#/dashboard'
    window.dispatchEvent(new CustomEvent('navigate-dashboard'))
  } catch (e: any) {
    deleteError.value = e.message || '删除失败'
  } finally {
    deleting.value = false
  }
}

// tasks for the currently selected project (convenience accessor)
const tasks = computed(() => tasksByProject.value[props.projectId] ?? [])
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
  editMode.value = 'edit'
  editingTask.value = { ...task, subtasks: [...task.subtasks] }
}

function onAddTask() {
  editMode.value = 'add'
  editingTask.value = { id: '', title: '', status: 'open' } as Task
}

async function onTaskSaved(updated: Task) {
  const pts = tasksByProject.value[props.projectId]
  if (!pts) return
  const idx = pts.findIndex(t => t.id === updated.id)
  if (idx !== -1) {
    // edit mode: replace existing
    tasksByProject.value[props.projectId][idx] = updated
  } else {
    // add mode: append new task
    tasksByProject.value[props.projectId].push(updated)
  }
  editingTask.value = null
  editMode.value = 'edit'
  recalcProjectProgress(props.projectId)
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
  // Store as decimal (0-1) to stay consistent with API format and ProjectCard expectations
  const progress = total === 0 ? 0 : done / total
  const proj = projects.value.find(p => p.id === projectId)
  if (proj) proj.progress = progress
}

// --- Data loading ---
async function loadProjects() {
  const res = await fetchProjects()
  projects.value = res.data
  // Preload tasks for ALL projects so sidebar progress is always correct
  await Promise.allSettled(
    res.data.map(p => loadTasks(p.id, true))
  )
}

async function loadTasks(projectId: string, _silent = false) {
  if (!_silent) { loading.value = true; error.value = null }
  try {
    const res = await fetchTasksByProject(projectId)
    tasksByProject.value[projectId] = res.data
    recalcProjectProgress(projectId)
  } catch (e) {
    if (!_silent) error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    if (!_silent) loading.value = false
  }
}

watch(() => props.projectId, (id) => {
  if (id && !tasksByProject.value[id]) loadTasks(id)
  else if (id) recalcProjectProgress(id)
}, { immediate: true })

onMounted(async () => {
  await loadProjects()
  if (props.projectId) recalcProjectProgress(props.projectId)
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
  width: 360px;
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
.btn-add-task {
  margin-left: 8px;
  padding: 4px 12px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}
.btn-add-task:hover { opacity: 0.85; }
.btn-delete-project {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  border-radius: var(--radius-sm);
  cursor: pointer;
  transition: all 0.15s;
  margin-left: 4px;
}
.btn-delete-project:hover {
  color: #ef4444;
  border-color: #ef4444;
  background: #fee2e2;
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
