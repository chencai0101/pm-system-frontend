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
      <!-- Edit button (top-right) -->
      <button
        v-if="showEditButton !== false"
        class="edit-btn"
        title="编辑项目"
        @click.stop="emit('edit', project)"
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
          <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
          <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
        </svg>
      </button>

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
  showEditButton?: boolean
}>()

const emit = defineEmits<{
  click: []
  edit: [project: Project]
}>()

// Derive status dynamically from real completion percentage
const effectiveStatus = computed(() => {
  const pct = (props.computedProgress ?? props.project.progress) * 100
  if (pct >= 100) return '已完成'
  if (pct > 0) return '进行中'
  return '未开始'
})
</script>

<style scoped>
.project-card-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: var(--bg-accent);
  border-radius: var(--radius-md);
  pointer-events: none;
}
.project-card-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 100%;
  background: linear-gradient(to bottom, color-mix(in srgb, var(--accent) 35%, transparent) 0%, transparent 80%);
  border-radius: var(--radius-md) 0 0 var(--radius-md);
  pointer-events: none;
}
.project-card-body {
  position: relative;
}
.edit-btn {
  position: absolute;
  top: 0;
  right: 0;
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
  padding: 0;
}
.edit-btn:hover {
  color: var(--accent);
  background: var(--accent-subtle);
}
.edit-btn:active {
  transform: scale(0.92);
}
</style>
