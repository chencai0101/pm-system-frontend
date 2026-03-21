<template>
  <article class="project-card" :class="{ selected }">
    <!-- Progress bar background -->
    <div class="project-card-bg" />
    <div
      class="project-card-fill"
      :style="{ width: `${project.progress * 100}%` }"
    />

    <!-- Card content -->
    <div class="project-card-body">
      <div class="project-name">{{ project.name }}</div>

      <div class="project-meta">
        <div class="project-owner">
          <span class="project-owner-label">牵头人</span>
          <span>{{ project.owner }}</span>
        </div>

        <div class="project-due">
          📅 {{ project.startDate }} → {{ project.endDate }}
        </div>

        <div class="project-footer">
          <span class="project-progress-text">
            {{ project.completedCount }}/{{ project.taskCount }} 任务
            · {{ Math.round(project.progress * 100) }}%
          </span>
          <span class="status-badge" :class="project.status">
            {{ project.status }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import type { Project } from '../api/index'

defineProps<{
  project: Project
  selected?: boolean
}>()
</script>
