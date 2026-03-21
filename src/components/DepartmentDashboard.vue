<template>
  <div class="app">
    <main class="main-content">
      <p class="section-title">全部项目 · {{ projects.length }}</p>

      <!-- Loading -->
      <div v-if="loading" class="loading-state">
        <span>加载中…</span>
      </div>

      <!-- Error -->
      <div v-else-if="error" class="empty-state">
        <span class="empty-icon">⚠️</span>
        <span>加载失败：{{ error }}</span>
      </div>

      <!-- Empty -->
      <div v-else-if="projects.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <span>暂无项目</span>
      </div>

      <!-- Cards grid -->
      <div v-else class="project-grid">
        <ProjectCard
          v-for="project in projects"
          :key="project.id"
          :project="project"
          :clickable="true"
          @click="$emit('select-project', project.id)"
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import ProjectCard from './ProjectCard.vue'
import { fetchProjects, type Project } from '../api/index'

const projects = ref<Project[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

defineEmits<{
  'select-project': [id: string]
}>()

onMounted(async () => {
  try {
    const res = await fetchProjects()
    projects.value = res.data
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

.empty-icon {
  font-size: 40px;
  opacity: 0.3;
}

.project-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 16px;
}
</style>
