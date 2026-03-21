<template>
  <div class="app">
    <main class="main-content">
      <p class="section-title">全部项目 · {{ projects.length }}</p>

      <div v-if="loading" class="loading-state"><span>加载中…</span></div>
      <div v-else-if="error" class="empty-state"><span class="empty-icon">⚠️</span><span>{{ error }}</span></div>
      <div v-else-if="projects.length === 0" class="empty-state"><span class="empty-icon">📭</span><span>暂无项目</span></div>

      <div v-else class="project-grid">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :clickable="true"
          :computed-progress="projectProgressMap[project.id]"
          @click="onCardClick(project.id)"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import ProjectCard from './ProjectCard.vue'
import { fetchProjects, fetchTasksByProject, type Project, type Task } from '../api/index'

const projects = ref<Project[]>([])
const tasksByProject = ref<Record<string, Task[]>>({})
const loading = ref(true)
const error = ref<string | null>(null)

const emit = defineEmits<{ 'select-project': [id: string] }>()

// Compute real progress per project from top-level tasks
const projectProgressMap = computed(() => {
  const map: Record<string, number> = {}
  for (const p of projects.value) {
    const projectTasks = tasksByProject.value[p.id] ?? []
    const topTasks = projectTasks.filter(t => !t.parentId)
    const total = topTasks.length
    const done = topTasks.filter(t => t.status === 'done').length
    map[p.id] = total === 0 ? 0 : done / total
  }
  return map
})

function onCardClick(id: string) {
  console.log('[Dashboard] card clicked:', id)
  emit('select-project', id)
}

onMounted(async () => {
  try {
    const res = await fetchProjects()
    projects.value = res.data

    // Fetch tasks for each project in parallel to compute real progress
    const projectIds = res.data.map((p: Project) => p.id)
    const results = await Promise.allSettled(
      projectIds.map(id => fetchTasksByProject(id))
    )
    for (let i = 0; i < projectIds.length; i++) {
      const result = results[i]
      if (result.status === 'fulfilled') {
        tasksByProject.value[projectIds[i]] = result.value.data
      }
    }
  } catch (e) {
    error.value = e instanceof Error ? e.message : '未知错误'
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.app {
  display: flex;
  flex-direction: column;
  height: calc(100vh - 56px);
  overflow: hidden;
}
.main-content {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}
.section-title {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.06em;
  margin-bottom: 16px;
}
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--muted);
  font-size: 14px;
}
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--muted);
  font-size: 14px;
  gap: 8px;
}
.empty-icon { font-size: 40px; opacity: 0.3; }
.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
</style>
