<template>
  <button
    class="theme-toggle"
    :title="isDark ? '切换到浅色模式' : '切换到深色模式'"
    @click="toggle"
  >
    <span v-if="isDark">☀️</span>
    <span v-else>🌙</span>
  </button>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'

const isDark = ref(false)

function applyDark(val: boolean) {
  if (val) {
    document.documentElement.classList.add('dark')
  } else {
    document.documentElement.classList.remove('dark')
  }
}

function toggle() {
  isDark.value = !isDark.value
  applyDark(isDark.value)
  // Persist preference
  localStorage.setItem('theme', isDark.value ? 'dark' : 'light')
}

onMounted(() => {
  const saved = localStorage.getItem('theme')
  if (saved === 'dark') {
    isDark.value = true
    applyDark(true)
  } else if (saved === 'light') {
    isDark.value = false
    applyDark(false)
  } else {
    // Default: follow system preference
    isDark.value = window.matchMedia('(prefers-color-scheme: dark)').matches
    applyDark(isDark.value)
  }
})
</script>
