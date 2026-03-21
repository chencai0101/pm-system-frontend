<template>
  <div class="task-column">
    <div class="column-header">
      <span class="column-title">{{ column.label }}</span>
      <span class="column-count">{{ tasks.length }}</span>
    </div>
    <div class="column-cards">
      <TaskCard
        v-for="task in tasks"
        :key="task.id"
        :task="task"
        @edit="$emit('open-edit', task)"
        @subtask-toggled="onSubtaskToggled"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import TaskCard from './TaskCard.vue'
import type { Task, TaskStatus } from '../api/index'

defineProps<{
  column: { key: TaskStatus; label: string }
  tasks: Task[]
}>()

const emit = defineEmits<{
  'open-edit': [task: Task]
  'subtask-toggled': [taskId: string, subtaskId: string, completed: boolean]
}>()

function onSubtaskToggled(taskId: string, subtaskId: string, completed: boolean) {
  emit('subtask-toggled', taskId, subtaskId, completed)
}
</script>

<style scoped>
.task-column {
  flex: 1;
  min-width: 240px;
  max-width: 300px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 0 4px 4px;
  flex-shrink: 0;
}

.column-title {
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}

.column-count {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-width: 20px;
  height: 20px;
  padding: 0 6px;
  background: var(--bg-accent);
  border: 1px solid var(--border);
  border-radius: var(--radius-full);
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
}

.column-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
}
</style>
