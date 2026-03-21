<template>
  <div class="task-column" :data-status="column.key">
    <div class="column-header">
      <span class="column-title">{{ column.label }}</span>
      <span class="column-count">{{ tasks.length }}</span>
    </div>
    <div class="column-body">
      <div
        v-for="(task, index) in tasks"
        :key="task.id"
        class="task-slot"
        :class="{ dragging: dragIndex === index }"
        @dragstart="onDragStart(index, task.id, $event)"
        @dragend="onDragEnd"
      >
        <TaskCard
          :task="task"
          @edit="$emit('open-edit', task)"
          @subtask-toggled="onSubtaskToggled"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import TaskCard from './TaskCard.vue'
import type { Task, TaskStatus } from '../api/index'

const props = defineProps<{
  column: { key: TaskStatus; label: string }
  tasks: Task[]
}>()

const emit = defineEmits<{
  'open-edit': [task: Task]
  'subtask-toggled': [taskId: string, subtaskId: string, completed: boolean]
  'drag-start': [taskId: string, sourceStatus: TaskStatus]
}>()

const dragIndex = ref<number | null>(null)

function onDragStart(index: number, taskId: string, e: DragEvent) {
  dragIndex.value = index
  e.dataTransfer!.effectAllowed = 'move'
  e.dataTransfer!.setData('text/plain', taskId)
  emit('drag-start', taskId, props.column.key)
}

function onDragEnd() {
  dragIndex.value = null
}

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
  border-radius: var(--radius-md);
  transition: background 0.15s;
}

/* Highlighted when a drag enters this column */
.task-column.drag-over {
  background: var(--accent-subtle);
  outline: 2px dashed var(--accent);
  outline-offset: -2px;
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
.column-body {
  display: flex;
  flex-direction: column;
  gap: 10px;
  overflow-y: auto;
  flex: 1;
  padding-right: 2px;
  min-height: 80px;
}
.task-slot {
  cursor: grab;
  border-radius: var(--radius-md);
  transition: opacity 0.15s;
}
.task-slot:active { cursor: grabbing; }
.task-slot.dragging { opacity: 0.35; }
</style>
