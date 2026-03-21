<template>
  <div class="project-list">
    <div class="project-list-header">项目列表</div>
    <div class="project-list-items">
      <ProjectCard
        v-for="project in projects"
        :key="project.id"
        :project="project"
        :selected="project.id === selectedId"
        @click="$emit('select', project)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import ProjectCard from './ProjectCard.vue'
import type { Project } from '../api/index'

defineProps<{
  projects: Project[]
  selectedId: string
}>()

defineEmits<{
  select: [project: Project]
}>()
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

.project-list-items :deep(.project-card-bg),
.project-list-items :deep(.project-card-fill) {
  /* Smaller cards in sidebar */
}
</style>
