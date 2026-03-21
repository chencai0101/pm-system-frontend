<template>
  <div class="app">
    <Header />

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
        />
      </div>
    </main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Header from './Header.vue'
import ProjectCard from './ProjectCard.vue'
import { fetchProjects, type Project } from '../api/index'

const projects = ref<Project[]>([])
const loading = ref(true)
const error = ref<string | null>(null)

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
