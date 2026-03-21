<template>
  <div class="task-column">
    <div class="column-header">
      <span class="column-title">{{ column.label }}</span>
      <span class="column-count">{{ tasks.length }}</span>
    </div>
    <div
      class="column-cards"
      @dragover.prevent="onDragOver"
      @drop="onDrop"
      @dragleave="onDragLeave"
    >
      <div
        v-for="(task, index) in tasks"
        :key="task.id"
        class="task-slot"
        :class="{
          'drag-over': dragOverIndex === index && dragSourceIndex !== index,
          'dragging': dragSourceIndex === index,
        }"
        @dragover.prevent="onDragOverIndex(index)"
        @drop.prevent="onDropOnTask(index)"
      >
        <TaskCard
          :task="task"
          draggable="true"
          @dragstart="onDragStart(index)"
          @dragend="onDragEnd"
          @edit="$emit('open-edit', task)"
          @subtask-toggled="onSubtaskToggled"
        />
      </div>

      <!-- Drop zone at end of list -->
      <div
        class="drop-zone-end"
        :class="{ 'drop-active': isDragging && dragSourceIndex !== null }"
        @drop.prevent="onDropAtEnd"
      />
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
  'tasks-reordered': [tasks: Task[]]
}>()

const isDragging = ref(false)
const dragSourceIndex = ref<number | null>(null)
const dragOverIndex = ref<number | null>(null)

function onDragStart(index: number) {
  isDragging.value = true
  dragSourceIndex.value = index
}

function onDragEnd() {
  isDragging.value = false
  dragSourceIndex.value = null
  dragOverIndex.value = null
}

function onDragOver(e: DragEvent) {
  e.preventDefault()
}

function onDragOverIndex(index: number) {
  if (dragSourceIndex.value === null) return
  dragOverIndex.value = index
}

function onDragLeave() {
  // Only clear if leaving the container (not a child)
}

function onDropOnTask(targetIndex: number) {
  if (dragSourceIndex.value === null) return
  if (dragSourceIndex.value === targetIndex) {
    onDragEnd()
    return
  }

  const updated = [...props.tasks]
  const [moved] = updated.splice(dragSourceIndex.value, 1)
  updated.splice(targetIndex, 0, moved)

  emit('tasks-reordered', updated)
  onDragEnd()
}

function onDropAtEnd() {
  if (dragSourceIndex.value === null) return
  const updated = [...props.tasks]
  const [moved] = updated.splice(dragSourceIndex.value, 1)
  updated.push(moved)
  emit('tasks-reordered', updated)
  onDragEnd()
}

function onDrop(_e: DragEvent) {
  // Generic drop — fall back to end-of-list reorder
  onDropAtEnd()
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
  min-height: 80px;
}

.task-slot {
  position: relative;
  transition: transform 0.15s;
}

.task-slot.drag-over {
  transform: translateY(2px);
}

.task-slot.drag-over::before {
  content: '';
  position: absolute;
  top: -6px;
  left: 0;
  right: 0;
  height: 3px;
  background: var(--accent);
  border-radius: 2px;
  opacity: 0.8;
}

.task-slot.dragging {
  opacity: 0.35;
}

.drop-zone-end {
  height: 40px;
  border: 2px dashed var(--border);
  border-radius: var(--radius-md);
  opacity: 0;
  transition: opacity 0.2s, border-color 0.2s;
  pointer-events: none;
}

.drop-zone-end.drop-active {
  opacity: 1;
  border-color: var(--accent);
  background: var(--accent-subtle);
  pointer-events: auto;
}
</style>
