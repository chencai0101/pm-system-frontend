<template>
  <article
    class="project-card"
    :class="{ selected, clickable }"
    @click="clickable && emit('click')"
  >
    <!-- Progress bar background -->
    <div class="project-card-bg" />
    <div
      class="project-card-fill"
      :style="{ width: `${(computedProgress ?? project.progress) * 100}%` }"
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
            · {{ Math.round((computedProgress ?? project.progress) * 100) }}%
          </span>
          <span class="status-badge" :class="effectiveStatus">
            {{ effectiveStatus }}
          </span>
        </div>
      </div>
    </div>
  </article>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Project } from '../api/index'

const props = defineProps<{
  project: Project
  selected?: boolean
  clickable?: boolean
  computedProgress?: number
}>()

const emit = defineEmits<{
  click: []
}>()

// Derive status dynamically from real completion percentage
const effectiveStatus = computed(() => {
  const pct = (props.computedProgress ?? props.project.progress) * 100
  if (pct >= 100) return '已完成'
  if (pct > 0) return '进行中'
  return '未开始'
})
</script>
