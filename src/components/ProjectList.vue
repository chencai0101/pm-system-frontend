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
  tasks?: Task[]
}>()

defineEmits<{
  select: [id: string]
}>()

// Compute real progress per project from tasks
const projectProgressMap = computed(() => {
  const map: Record<string, number> = {}
  for (const p of props.projects) {
    if (!props.tasks || props.tasks.length === 0) {
      map[p.id] = p.progress
      continue
    }
    const projectTasks = props.tasks.filter(t => t.projectId === p.id && !t.parentId)
    const total = projectTasks.length
    const done = projectTasks.filter(t => t.status === 'done').length
    map[p.id] = total === 0 ? 0 : done / total
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
