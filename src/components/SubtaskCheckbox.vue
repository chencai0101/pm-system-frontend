<template>
  <span
    class="subtask-checkbox"
    :class="{ completed }"
    :title="completed ? '取消完成' : '标记完成'"
    @click.stop="$emit('toggle', !completed)"
  >
    <span v-if="completed">●</span>
    <span v-else-if="half">◉</span>
    <span v-else>○</span>
  </span>
</template>

<script setup lang="ts">
defineProps<{
  completed: boolean
  half?: boolean
}>()

defineEmits<{
  toggle: [value: boolean]
}>()
</script>

<style scoped>
.subtask-checkbox {
  cursor: pointer;
  font-size: 14px;
  line-height: 1;
  flex-shrink: 0;
  transition: transform 0.1s;
  user-select: none;
}

.subtask-checkbox:hover {
  transform: scale(1.2);
}

.subtask-checkbox.completed {
  color: var(--accent);
}
</style>
