<template>
  <div class="task-card" :class="{ overdue: isOverdue }" @click="$emit('open-edit', task)">
    <div class="progress-fill" :style="{ width: progressPct + '%' }" />
    <div class="task-body">
      <div class="task-header">
        <span class="task-id">{{ task.id }}</span>
        <div class="task-meta-right">
          <span class="priority-badge" :class="task.priority">{{ priorityLabel }}</span>
          <span v-if="task.endDate" class="task-date" :class="{ overdue: isOverdue }">{{ task.endDate }}</span>
        </div>
      </div>
      <div class="task-title">{{ task.title }}</div>
      <div v-if="task.subtasks && task.subtasks.length > 0" class="task-progress">
        <div class="progress-track">
          <div class="progress-fill" :style="{ width: progressPct + '%' }" />
        </div>
      </div>
      <div v-if="task.note" class="task-note">{{ task.note }}</div>
      <div v-if="task.subtasks && task.subtasks.length > 0" class="subtasks-list">
        <div v-for="subtask in visibleSubtasks" :key="subtask.id" class="subtask-item">
          <label class="checkbox-wrapper" @click.stop>
            <input type="checkbox" :checked="subtask.completed"
              @change.stop="$emit('subtask-toggled', task.id, subtask.id, !subtask.completed)" />
            <span class="checkmark" />
          </label>
          <span class="subtask-title" :class="{ completed: subtask.completed }">{{ subtask.title }}</span>
        </div>
        <div v-if="hiddenSubtaskCount > 0" class="subtask-more">+{{ hiddenSubtaskCount }} more</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Task } from '../api/index'

const props = defineProps<{ task: Task }>()

defineEmits<{
  'open-edit': [task: Task]
  'subtask-toggled': [taskId: string, subtaskId: string, completed: boolean]
}>()

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
  const done = props.task.subtasks.filter((s: any) => s.completed).length
  return Math.round((done / props.task.subtasks.length) * 100)
})

const MAX_VISIBLE = 3
const visibleSubtasks = computed(() => props.task.subtasks.slice(0, MAX_VISIBLE))
const hiddenSubtaskCount = computed(() =>
  Math.max(0, props.task.subtasks.length - MAX_VISIBLE)
)
</script>

<style scoped>
.task-card {
  position: relative;
  overflow: hidden;
  border-radius: var(--radius-md);
  background: var(--card);
  border: 1px solid var(--border);
  transition: box-shadow 0.15s, transform 0.15s;
  cursor: pointer;
}
.task-card:hover {
  box-shadow: var(--shadow-sm);
  transform: translateY(-1px);
}
.task-card.overdue { border-color: #ff4444; }
.progress-fill {
  position: absolute;
  top: 0; left: 0;
  height: 100%;
  background: linear-gradient(135deg, var(--accent-subtle) 0%, transparent 80%);
  pointer-events: none;
  border-radius: var(--radius-md) 0 0 var(--radius-md);
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
.task-progress { margin-top: 2px; }
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
.subtask-title { color: var(--text); line-height: 1.3; }
.subtask-title.completed {
  text-decoration: line-through;
  color: var(--muted);
}
.subtask-more { font-size: 10px; color: var(--muted); padding-left: 20px; }
</style>
