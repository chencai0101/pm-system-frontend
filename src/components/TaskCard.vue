<template>
  <div class="task-card" :class="{ overdue: isOverdue }">
    <!-- Progress bar -->
    <div class="task-card-bg" />
    <div
      class="task-card-fill"
      :style="{ width: `${progressPct}%` }"
    />
    <div class="task-body">
      <div class="task-header">
        <span class="task-id">{{ task.id }}</span>
        <div class="task-meta-right">
          <span class="priority-badge" :class="task.priority">{{ priorityLabel }}</span>
          <span v-if="task.endDate" class="task-date" :class="{ overdue: isOverdue }">{{ task.endDate }}</span>
          <!-- Edit icon button -->
          <button
            class="edit-btn"
            title="编辑"
            @click.stop="$emit('edit', task)"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>

      <div class="task-title">{{ task.title }}</div>

      <!-- Progress bar (subtasks) -->
      <div v-if="task.subtasks && task.subtasks.length > 0" class="task-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: `${progressPct}%` }" />
        </div>
      </div>

      <!-- Note preview -->
      <div v-if="task.note" class="task-note">{{ task.note }}</div>

      <!-- Subtasks (always shown) -->
      <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks-list subtasks-expanded">
        <div
          v-for="subtask in task.subtasks"
          :key="subtask.id"
          class="subtask-item"
        >
          <label class="checkbox-wrapper" @click.stop>
            <input
              type="checkbox"
              :checked="subtask.completed"
              @change.stop="onSubtaskToggle(subtask.id, !subtask.completed)"
            />
            <span class="checkmark" />
          </label>
          <span class="subtask-title" :class="{ completed: subtask.completed }">{{ subtask.title }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../api/index'
import { updateSubtask } from '../api/index'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{
  'edit': [task: Task]
  'subtask-toggled': [taskId: string, subtaskId: string, completed: boolean]
}>()

async function onSubtaskToggle(subtaskId: string, completed: boolean) {
  try {
    await updateSubtask(subtaskId, { completed })
    emit('subtask-toggled', props.task.id, subtaskId, completed)
  } catch (err) {
    console.error('[TaskCard] Failed to toggle subtask:', err)
  }
}

const priorityLabel = computed(() => {
  const map: Record<string, string> = { high: '高', medium: '中', low: '低' }
  return map[props.task.priority] || props.task.priority
})

const isOverdue = computed(() => {
  if (!props.task.endDate || props.task.status === 'done') return false
  return new Date(props.task.endDate) < new Date()
})

const progressPct = computed(() => {
  if (!props.task.subtasks || props.task.subtasks.length === 0) return 0
  const done = props.task.subtasks.filter(s => s.completed).length
  return Math.round((done / props.task.subtasks.length) * 100)
})
</script>

<style scoped>
.task-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--card);
  border: 1px solid var(--border);
  transition: box-shadow 0.15s, transform 0.15s;
}
.task-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.edit-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 22px;
  height: 22px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
  flex-shrink: 0;
  padding: 0;
}
.edit-btn:hover {
  color: var(--accent);
  background: var(--accent-subtle);
}
.edit-btn:active {
  transform: scale(0.92);
}
.task-card.overdue {
  border-color: #ff4444;
}
.task-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-accent);
  border-radius: var(--radius-md);
  pointer-events: none;
}
.task-card-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(to bottom, color-mix(in srgb, var(--accent) 35%, transparent) 0%, transparent 80%);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  pointer-events: none;
}
.task-body {
  position: relative;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 6px;
}
.task-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}
.task-id {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--muted);
  font-weight: 600;
}
.task-meta-right {
  display: flex;
  align-items: center;
  gap: 6px;
}
.priority-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.priority-badge.high { background: #ff444433; color: #ff4444; }
.priority-badge.medium { background: #ffaa4433; color: #ff8800; }
.priority-badge.low { background: var(--bg-accent); color: var(--muted); }
.task-date {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--muted);
}
.task-date.overdue { color: #ff4444; }
.task-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.4;
  word-break: break-word;
}
.task-progress {
  margin-top: 2px;
}
.progress-track {
  height: 3px;
  background: var(--bg-accent);
  border-radius: var(--radius-full);
  overflow: hidden;
}
.progress-track .progress-fill {
  position: relative;
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-full);
  transition: width 0.3s;
}
.task-note {
  font-size: 11px;
  color: var(--muted);
  line-height: 1.4;
  overflow: hidden;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}
.subtasks-list {
  display: flex;
  flex-direction: column;
  gap: 4px;
  margin-top: 4px;
}
.subtask-item {
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 11px;
}
.checkbox-wrapper {
  position: relative;
  display: flex;
  align-items: center;
  cursor: pointer;
  flex-shrink: 0;
}
.checkbox-wrapper input { display: none; }
.checkmark {
  width: 14px;
  height: 14px;
  border: 1.5px solid var(--border-strong);
  border-radius: 4px;
  transition: all 0.15s;
  background: var(--card);
  display: flex;
  align-items: center;
  justify-content: center;
}
.checkbox-wrapper input:checked + .checkmark {
  background: var(--accent);
  border-color: var(--accent);
}
.checkbox-wrapper input:checked + .checkmark::after {
  content: '✓';
  color: white;
  font-size: 9px;
  font-weight: 700;
}
.subtask-title {
  color: var(--text);
  line-height: 1.3;
}
.subtask-title.completed {
  text-decoration: line-through;
  color: var(--muted);
}
.subtask-more {
  font-size: 10px;
  color: var(--muted);
  padding-left: 20px;
}
.expand-btn {
  display: flex;
  align-items: center;
  gap: 4px;
  background: none;
  border: none;
  padding: 2px 0;
  cursor: pointer;
  font-size: 11px;
  color: var(--accent);
  font-family: inherit;
  transition: color 0.15s;
  margin-top: 4px;
}
.expand-btn:hover {
  color: var(--text-strong);
}
.expand-label {
  font-weight: 500;
}
.expand-arrow {
  transition: transform 0.2s;
  font-size: 10px;
}
.expand-btn.expanded .expand-arrow {
  transform: rotate(180deg);
}
.subtasks-expanded {
  border-top: 1px solid var(--border);
  padding-top: 6px;
  margin-top: 2px;
}
.subtasks-expanded .subtask-item {
  padding: 3px 0;
}
</style>
