<template>
  <div id="app-root">
    <Header
      :current-tab="currentTab"
      :project-id="selectedProjectId"
      @click:dashboard="goToDashboard"
      @click:project="goToProject"
      @click:admin="goToAdmin"
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
    <AdminDashboard v-else-if="currentTab === 'admin'" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import Header from './components/Header.vue'
import DepartmentDashboard from './components/DepartmentDashboard.vue'
import ProjectTaskDetail from './views/ProjectTaskDetail.vue'
import AdminDashboard from './views/AdminDashboard.vue'
import { fetchProjects } from './api/index'

type Tab = 'dashboard' | 'project' | 'admin'

const currentTab = ref<Tab>('dashboard')
const selectedProjectId = ref<string>('')
const firstProjectId = ref<string>('')

function parseHash(): { tab: Tab; projectId: string } {
  const hash = window.location.hash
  if (hash.startsWith('#/project/')) {
    const id = hash.replace('#/project/', '')
    return { tab: 'project', projectId: id }
  }
  if (hash === '#/admin' || hash.startsWith('#/admin/')) {
    return { tab: 'admin', projectId: '' }
  }
  return { tab: 'dashboard', projectId: '' }
}

function goToDashboard() {
  currentTab.value = 'dashboard'
  selectedProjectId.value = ''
  window.location.hash = '#/dashboard'
}

async function goToProject(id?: string) {
  if (!id && !selectedProjectId.value && !firstProjectId.value) {
    try {
      const res = await fetchProjects()
      if (res.data.length > 0) {
        id = res.data[0].id
      } else {
        return
      }
    } catch {
      return
    }
  }
  const targetId = id || selectedProjectId.value
  currentTab.value = 'project'
  selectedProjectId.value = targetId
  window.location.hash = `#/project/${targetId}`
}

function goToAdmin() {
  currentTab.value = 'admin'
  selectedProjectId.value = ''
  window.location.hash = '#/admin'
}

async function onDashboardSelectProject(id: string) {
  if (!firstProjectId.value) {
    try {
      const res = await fetchProjects()
      if (res.data.length > 0) firstProjectId.value = res.data[0].id
    } catch {}
  }
  selectedProjectId.value = id
  currentTab.value = 'project'
  window.location.hash = `#/project/${id}`
}

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
