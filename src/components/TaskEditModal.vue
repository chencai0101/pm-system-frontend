<template>
  <Teleport to="body">
    <div class="modal-overlay" @click.self="$emit('close')">
      <div class="modal" role="dialog" aria-modal="true">

        <div class="modal-header">
          <span class="modal-task-id">{{ localTask.id }}</span>
          <h2 class="modal-title">编辑任务</h2>
          <button class="modal-close" @click="$emit('close')">✕</button>
        </div>

        <div class="modal-body">
          <!-- Title -->
          <div class="field">
            <label class="field-label">标题</label>
            <input
              v-model="localTask.title"
              class="field-input"
              type="text"
              placeholder="任务标题"
            />
          </div>

          <!-- Priority -->
          <div class="field">
            <label class="field-label">优先级</label>
            <div class="priority-options">
              <button
                v-for="p in priorities"
                :key="p.value"
                class="priority-btn"
                :class="[p.value, { active: localTask.priority === p.value }]"
                @click="localTask.priority = p.value"
              >
                {{ p.label }}
              </button>
            </div>
          </div>

          <!-- Due Date -->
          <div class="field">
            <label class="field-label">截止日期</label>
            <input
              v-model="localTask.endDate"
              class="field-input"
              type="date"
            />
          </div>

          <!-- Note -->
          <div class="field">
            <label class="field-label">备注</label>
            <textarea
              v-model="localTask.note"
              class="field-textarea"
              rows="4"
              placeholder="感知/反思：..."
            />
          </div>

          <!-- Subtasks (read-only list) -->
          <div class="field">
            <label class="field-label">
              子任务
              <span class="subtask-summary">
                {{ completedCount }}/{{ localTask.subtasks.length }}
              </span>
            </label>
            <ul class="subtask-list-modal">
              <li
                v-for="subtask in localTask.subtasks"
                :key="subtask.id"
                class="subtask-item-modal"
              >
                <span class="subtask-status-icon">
                  {{ subtask.completed ? '●' : '○' }}
                </span>
                <span :class="{ 'subtask-done': subtask.completed }">
                  {{ subtask.title }}
                </span>
              </li>
            </ul>
            <p class="subtask-hint">子任务在卡片上勾选，不在此处编辑</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="$emit('close')">取消</button>
          <button class="btn-save" :disabled="saving" @click="onSave">
            {{ saving ? '保存中…' : '保存' }}
          </button>
        </div>

      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { updateTask, type Task, type TaskPriority } from '../api/index'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{
  close: []
  saved: [task: Task]
}>()

// Local copy for editing
const localTask = ref<Task>({
  ...props.task,
  subtasks: props.task.subtasks.map(s => ({ ...s })),
})

const saving = ref(false)

const priorities: { value: TaskPriority; label: string }[] = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
]

const completedCount = computed(() =>
  localTask.value.subtasks.filter(s => s.completed).length
)

async function onSave() {
  saving.value = true
  try {
    const updated = await updateTask(localTask.value.id, {
      title: localTask.value.title,
      note: localTask.value.note,
      priority: localTask.value.priority,
      end_date: localTask.value.endDate,
    })
    // Merge back subtasks (they're not modified in modal)
    const result: Task = { ...updated, subtasks: localTask.value.subtasks }
    emit('saved', result)
  } catch (err) {
    console.error('Failed to save task:', err)
    alert('保存失败，请重试')
  } finally {
    saving.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.45);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
  animation: fadeIn 0.15s ease;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.modal {
  background: var(--card);
  border-radius: var(--radius-lg);
  border: 1px solid var(--border);
  box-shadow: var(--shadow-lg);
  width: 520px;
  max-width: 95vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  animation: slideUp 0.2s var(--ease-out);
}

@keyframes slideUp {
  from { transform: translateY(20px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}

.modal-header {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 20px 24px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.modal-task-id {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--muted);
  background: var(--bg-accent);
  padding: 2px 8px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
}

.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  flex: 1;
}

.modal-close {
  background: none;
  border: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 16px;
  padding: 4px;
  border-radius: 4px;
  transition: color 0.1s, background 0.1s;
}

.modal-close:hover {
  color: var(--text);
  background: var(--bg-accent);
}

.modal-body {
  padding: 20px 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 16px;
  flex: 1;
}

.field {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.field-label {
  font-size: 12px;
  font-weight: 600;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.05em;
  display: flex;
  align-items: center;
  gap: 8px;
}

.field-input {
  background: var(--bg-accent);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 14px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}

.field-input:focus {
  border-color: var(--accent);
}

.field-textarea {
  background: var(--bg-accent);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  padding: 8px 12px;
  font-size: 13px;
  color: var(--text);
  font-family: inherit;
  outline: none;
  resize: vertical;
  min-height: 100px;
  transition: border-color 0.15s;
  line-height: 1.6;
}

.field-textarea:focus {
  border-color: var(--accent);
}

.priority-options {
  display: flex;
  gap: 8px;
}

.priority-btn {
  flex: 1;
  padding: 6px 12px;
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-accent);
  color: var(--muted);
  transition: all 0.15s;
  text-transform: capitalize;
}

.priority-btn.high.active {
  background: rgba(239, 68, 68, 0.12);
  border-color: rgba(239, 68, 68, 0.4);
  color: #ef4444;
}

.priority-btn.medium.active {
  background: rgba(240, 192, 0, 0.12);
  border-color: rgba(240, 192, 0, 0.4);
  color: #f0c000;
}

.priority-btn.low.active {
  background: rgba(113, 113, 122, 0.12);
  border-color: rgba(113, 113, 122, 0.4);
  color: var(--muted);
}

.subtask-summary {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  background: var(--bg-accent);
  padding: 1px 7px;
  border-radius: var(--radius-full);
  border: 1px solid var(--border);
  color: var(--muted);
  text-transform: none;
  letter-spacing: 0;
}

.subtask-list-modal {
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.subtask-item-modal {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
  color: var(--text);
  padding: 4px 0;
}

.subtask-status-icon {
  font-size: 12px;
  flex-shrink: 0;
}

.subtask-done {
  text-decoration: line-through;
  color: var(--muted);
}

.subtask-hint {
  font-size: 11px;
  color: var(--border-strong);
  font-style: italic;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px 20px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

.btn-cancel {
  padding: 8px 20px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  border: 1px solid var(--border);
  background: var(--bg-accent);
  color: var(--muted);
  transition: all 0.15s;
}

.btn-cancel:hover {
  border-color: var(--border-strong);
  color: var(--text);
}

.btn-save {
  padding: 8px 24px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 700;
  cursor: pointer;
  border: none;
  background: var(--accent);
  color: #fff;
  transition: background 0.15s, opacity 0.15s;
}

.btn-save:hover:not(:disabled) {
  background: var(--accent-hover);
}

.btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
