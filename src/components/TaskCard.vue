<template>
  <article class="task-card" @click="$emit('edit', task)">
    <!-- Header row: id + title + priority + due -->
    <div class="task-header">
      <span class="task-id">{{ task.id }}</span>
      <span class="task-title">{{ task.title }}</span>
      <div class="task-tags">
        <span class="priority-tag" :class="task.priority">{{ task.priority }}</span>
        <span class="due-date" v-if="task.endDate">{{ formatDate(task.endDate) }}</span>
      </div>
    </div>

    <!-- Note preview -->
    <p v-if="task.note" class="task-note">{{ task.note }}</p>

    <!-- Subtask progress -->
    <div v-if="task.subtasks.length > 0" class="subtask-section">
      <div class="subtask-progress">
        <div
          class="subtask-progress-fill"
          :style="{ width: `${completedRatio * 100}%` }"
        />
      </div>
      <div class="subtask-counts">
        {{ completedCount }}/{{ task.subtasks.length }}
      </div>
    </div>

    <!-- Subtask list -->
    <ul v-if="task.subtasks.length > 0" class="subtask-list">
      <li
        v-for="subtask in task.subtasks"
        :key="subtask.id"
        class="subtask-item"
        @click.stop
      >
        <SubtaskCheckbox
          :completed="subtask.completed"
          @toggle="onSubtaskToggle(subtask.id, $event)"
        />
        <span :class="{ 'subtask-done': subtask.completed }">
          {{ subtask.title }}
        </span>
      </li>
    </ul>

    <!-- Click hint -->
    <div class="task-hint">点击编辑</div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import SubtaskCheckbox from './SubtaskCheckbox.vue'
import { toggleSubtask, updateTaskStatus, type Task } from '../api/index'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{
  edit: [task: Task]
  'subtask-toggled': [taskId: string, subtaskId: string, completed: boolean]
}>()

const completedCount = computed(() =>
  props.task.subtasks.filter(s => s.completed).length
)
const completedRatio = computed(() =>
  props.task.subtasks.length > 0
    ? completedCount.value / props.task.subtasks.length
    : 0
)

function formatDate(date: string): string {
  try {
    const d = new Date(date)
    return `${d.getMonth() + 1}/${d.getDate()}`
  } catch {
    return date
  }
}

// Status order for auto-advance
const STATUS_ORDER: Task['status'][] = ['open', 'in-progress', 'review', 'done']

async function onSubtaskToggle(subtaskId: string, newCompleted: boolean) {
  try {
    await toggleSubtask(subtaskId, newCompleted)

    // Update local task state
    const subtask = props.task.subtasks.find(s => s.id === subtaskId)
    if (subtask) subtask.completed = newCompleted

    emit('subtask-toggled', props.task.id, subtaskId, newCompleted)

    // Auto-advance if ALL subtasks completed
    if (newCompleted) {
      const allDone = props.task.subtasks.every(s => s.completed)
      if (allDone) {
        const currentIdx = STATUS_ORDER.indexOf(props.task.status)
        if (currentIdx < STATUS_ORDER.length - 1) {
          const nextStatus = STATUS_ORDER[currentIdx + 1]
          const updated = await updateTaskStatus(props.task.id, nextStatus)
          // Update local status
          ;(props.task as Task).status = updated.status
        }
      }
    }
  } catch (err) {
    console.error('Failed to toggle subtask:', err)
  }
}
</script>

<style scoped>
.task-card {
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  padding: 14px 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
  cursor: pointer;
  transition: box-shadow 0.15s, border-color 0.15s;
  box-shadow: var(--shadow-sm);
}

.task-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
}

.task-header {
  display: flex;
  align-items: flex-start;
  gap: 8px;
}

.task-id {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--muted);
  flex-shrink: 0;
  padding-top: 2px;
}

.task-title {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.4;
  flex: 1;
}

.task-tags {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}

.priority-tag {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  border: 1px solid transparent;
  letter-spacing: 0.04em;
}

.priority-tag.high {
  color: #ef4444;
  background: rgba(239, 68, 68, 0.1);
  border-color: rgba(239, 68, 68, 0.25);
}

.priority-tag.medium {
  color: #f0c000;
  background: rgba(240, 192, 0, 0.1);
  border-color: rgba(240, 192, 0, 0.25);
}

.priority-tag.low {
  color: #71717a;
  background: rgba(113, 113, 122, 0.1);
  border-color: rgba(113, 113, 122, 0.25);
}

.due-date {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--muted);
}

.task-note {
  font-size: 12px;
  color: var(--muted);
  line-height: 1.5;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

.subtask-section {
  display: flex;
  align-items: center;
  gap: 8px;
}

.subtask-progress {
  flex: 1;
  height: 4px;
  background: var(--progress-bg);
  border-radius: 2px;
  overflow: hidden;
}

.subtask-progress-fill {
  height: 100%;
  background: linear-gradient(90deg, var(--accent), #ff8080);
  border-radius: 2px;
  transition: width 0.3s var(--ease-out);
}

.subtask-counts {
  font-size: 10px;
  font-family: "JetBrains Mono", monospace;
  color: var(--muted);
  flex-shrink: 0;
}

.subtask-list {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding-left: 4px;
}

.subtask-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: var(--text);
  line-height: 1.4;
}

.subtask-done {
  text-decoration: line-through;
  color: var(--muted);
}

.task-hint {
  font-size: 10px;
  color: var(--border-strong);
  text-align: right;
  margin-top: 2px;
}
</style>
