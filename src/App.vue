<template>
  <div id="app-root">
    <Header
      :current-tab="currentTab"
      :project-id="selectedProjectId"
      @click:dashboard="goToDashboard"
      @click:project="goToProject"
    />
    <DepartmentDashboard
      v-if="currentTab === 'dashboard'"
      @select-project="onDashboardSelectProject"
    />
    <ProjectTaskDetail
      v-else-if="currentTab === 'project'"
      :project-id="selectedProjectId"
      @select-project="onProjectDetailSelectProject"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Header from './components/Header.vue'
import DepartmentDashboard from './components/DepartmentDashboard.vue'
import ProjectTaskDetail from './views/ProjectTaskDetail.vue'

type Tab = 'dashboard' | 'project'

const currentTab = ref<Tab>('dashboard')
const selectedProjectId = ref<string>('')

function parseHash(): { tab: Tab; projectId: string } {
  const hash = window.location.hash
  if (hash.startsWith('#/project/')) {
    const id = hash.replace('#/project/', '')
    return { tab: 'project', projectId: id }
  }
  return { tab: 'dashboard', projectId: '' }
}

function goToDashboard() {
  currentTab.value = 'dashboard'
  selectedProjectId.value = ''
  window.location.hash = '#/dashboard'
}

function goToProject(id?: string) {
  const targetId = id || selectedProjectId.value
  if (!targetId) return
  currentTab.value = 'project'
  selectedProjectId.value = targetId
  window.location.hash = `#/project/${targetId}`
}

// From DepartmentDashboard: clicking a project card
function onDashboardSelectProject(id: string) {
  currentTab.value = 'project'
  selectedProjectId.value = id
  window.location.hash = `#/project/${id}`
}

// From ProjectTaskDetail: clicking a project in the left sidebar
function onProjectDetailSelectProject(id: string) {
  currentTab.value = 'project'
  selectedProjectId.value = id
  window.location.hash = `#/project/${id}`
}

onMounted(() => {
  const parsed = parseHash()
  currentTab.value = parsed.tab
  selectedProjectId.value = parsed.projectId

  window.addEventListener('hashchange', () => {
    const parsed = parseHash()
    currentTab.value = parsed.tab
    selectedProjectId.value = parsed.projectId
  })
})
</script>

<style>
#app-root {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
}
</style>
