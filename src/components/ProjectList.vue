<template>
  <div class="project-list">
    <div class="project-list-header">项目列表</div>
    <div class="project-list-items">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        :selected="project.id === selectedId"
        :clickable="true"
        :computed-progress="projectProgressMap[project.id]"
        @click="$emit('select', project.id)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProjectCard from './ProjectCard.vue'
import type { Project, Task } from '../api/index'
import { computed } from 'vue'

const props = defineProps<{
  projects: Project[]
  selectedId: string
  tasksByProject?: Record<string, Task[]>
}>()

defineEmits<{
  select: [id: string]
}>()

// Compute real progress per project from ALL cached tasks (tasksByProject has all projects)
const projectProgressMap = computed(() => {
  const map: Record<string, number | undefined> = {}
  for (const p of props.projects) {
    const pts = props.tasksByProject?.[p.id]
    if (!pts || pts.length === 0) {
      // No tasks loaded yet — use stored progress (last known correct value)
      map[p.id] = p.progress
      continue
    }
    const topTasks = pts.filter(t => !t.parentId)
    const total = topTasks.length
    const done = topTasks.filter(t => t.status === 'done').length
    map[p.id] = total === 0 ? p.progress : done / total
  }
  return map
})
</script>

<style scoped>
.project-list {
  display: flex;
  flex-direction: column;
  height: 100%;
}

.project-list-header {
  font-size: 11px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  padding: 16px 16px 10px;
  flex-shrink: 0;
}

.project-list-items {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 0 10px 10px;
  overflow-y: auto;
}

/* Selected state: left border highlight */
.project-list-items :deep(.project-card) {
  border-left: 3px solid transparent;
  border-radius: 8px;
  min-height: 100px;
  transition: border-color 0.15s, transform 0.15s;
}

.project-list-items :deep(.project-card.selected) {
  border-left-color: var(--accent);
  transform: translateX(2px);
}
</style>
