<template>
  <div id="app-root">
    <DepartmentDashboard v-if="route === 'dashboard'" />
    <ProjectTaskDetail
      v-else-if="route === 'project'"
      :project-id="projectId"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import DepartmentDashboard from './components/DepartmentDashboard.vue'
import ProjectTaskDetail from './views/ProjectTaskDetail.vue'

type Route = 'dashboard' | 'project'

const route = ref<Route>('dashboard')
const projectId = ref<string>('')

function parseHash(): { route: Route; projectId: string } {
  const hash = window.location.hash
  if (hash.startsWith('#/project/')) {
    const id = hash.replace('#/project/', '')
    return { route: 'project', projectId: id }
  }
  return { route: 'dashboard', projectId: '' }
}

onMounted(() => {
  const parsed = parseHash()
  route.value = parsed.route
  projectId.value = parsed.projectId

  window.addEventListener('hashchange', () => {
    const parsed = parseHash()
    route.value = parsed.route
    projectId.value = parsed.projectId
  })
})
</script>

<style>
#app-root {
  height: 100vh;
  overflow: hidden;
}
</style>
