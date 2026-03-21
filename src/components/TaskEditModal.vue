<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <input
          v-model="editTitle"
          class="modal-title-input"
          placeholder="任务名称"
        />
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="meta-row">
          <div class="meta-field">
            <label>优先级</label>
            <select v-model="editPriority">
              <option value="low">低</option>
              <option value="medium">中</option>
              <option value="high">高</option>
            </select>
          </div>
          <div class="meta-field">
            <label>截止日期</label>
            <input type="date" v-model="editEndDate" />
          </div>
        </div>

        <div class="note-section">
          <label>感知/反思</label>
          <textarea
            v-model="editNote"
            placeholder="这个任务的备注、反思、复盘…"
            rows="3"
          />
        </div>

        <div class="subtasks-section">
          <div class="subtasks-label">
            子任务
            <span class="subtask-progress">{{ completedCount }}/{{ editSubtasks.length }}</span>
          </div>

          <div class="subtasks-list">
            <div v-for="subtask in editSubtasks" :key="subtask.id" class="subtask-item">
              <label class="checkbox-wrapper" @click.stop>
                <input type="checkbox" :checked="subtask.completed"
                  @change="toggleSubtask(subtask)" />
                <span class="checkmark" />
              </label>
              <span class="subtask-title" :class="{ completed: subtask.completed }"
                @dblclick="startEditSubtask(subtask)">
                {{ editingId === subtask.id ? '' : subtask.title }}
              </span>
              <input v-if="editingId === subtask.id" v-model="editingTitle"
                class="subtask-title-input"
                @keydown.enter="saveSubtaskTitle(subtask)"
                @keydown.escape="cancelEdit"
                @blur="saveSubtaskTitle(subtask)"
                ref="editInputRef"
              />
              <button class="subtask-delete-btn" @click="removeSubtask(subtask.id)">✕</button>
            </div>
          </div>

          <div class="add-subtask">
            <input
              v-model="newSubtaskTitle"
              placeholder="输入子任务名称，回车添加"
              class="add-subtask-input"
              @keydown.enter="addSubtask"
            />
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button class="btn-save" @click="save">保存</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import type { Task } from '../api/index'
import { createSubtask, updateSubtask, deleteSubtask } from '../api/index'

const props = defineProps<{ task: Task }>()

const emit = defineEmits<{
  close: []
  saved: [task: Task]
}>()

const editTitle = ref(props.task.title)
const editNote = ref(props.task.note)
const editPriority = ref(props.task.priority)
const editEndDate = ref(props.task.endDate)
const editSubtasks = ref([...props.task.subtasks])
const newSubtaskTitle = ref('')
const editingId = ref<string | null>(null)
const editingTitle = ref('')
const editInputRef = ref<HTMLInputElement | null>(null)

const completedCount = computed(() => editSubtasks.value.filter(s => s.completed).length)

function startEditSubtask(subtask: any) {
  editingId.value = subtask.id
  editingTitle.value = subtask.title
  setTimeout(() => { editInputRef.value?.focus() }, 50)
}

function cancelEdit() {
  editingId.value = null
  editingTitle.value = ''
}

async function saveSubtaskTitle(subtask: any) {
  const title = editingTitle.value.trim()
  if (!title) { cancelEdit(); return }
  if (title === subtask.title) { cancelEdit(); return }
  try {
    const updated = await updateSubtask(subtask.id, { title })
    if (updated?.subtasks) editSubtasks.value = updated.subtasks
  } catch (e) {
    console.error('[Modal] update subtask failed:', e)
  }
  cancelEdit()
}

async function toggleSubtask(subtask: any) {
  try {
    const updated = await updateSubtask(subtask.id, { completed: !subtask.completed })
    if (updated?.subtasks) editSubtasks.value = updated.subtasks
    else {
      const idx = editSubtasks.value.findIndex(s => s.id === subtask.id)
      if (idx !== -1) {
        editSubtasks.value[idx].completed = !editSubtasks.value[idx].completed
      }
    }
  } catch (e) {
    console.error('[Modal] toggle subtask failed:', e)
  }
}

async function addSubtask() {
  const title = newSubtaskTitle.value.trim()
  if (!title) return
  try {
    const updated = await createSubtask(props.task.id, title)
    editSubtasks.value = updated.subtasks
    newSubtaskTitle.value = ''
  } catch (e) {
    console.error('[Modal] create subtask failed:', e)
  }
}

async function removeSubtask(subtaskId: string) {
  try {
    const updated = await deleteSubtask(subtaskId)
    if (updated?.subtasks) editSubtasks.value = updated.subtasks
    else editSubtasks.value = editSubtasks.value.filter(s => s.id !== subtaskId)
  } catch (e) {
    console.error('[Modal] delete subtask failed:', e)
  }
}

function save() {
  emit('saved', {
    ...props.task,
    title: editTitle.value,
    note: editNote.value,
    priority: editPriority.value,
    endDate: editEndDate.value,
    subtasks: editSubtasks.value,
  } as Task)
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}
.modal {
  background: var(--card);
  border-radius: var(--radius-lg);
  width: 520px;
  max-width: 90vw;
  max-height: 80vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
}
.modal-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-title-input {
  flex: 1;
  background: transparent;
  border: none;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  outline: none;
  padding: 4px 0;
  border-bottom: 2px solid transparent;
}
.modal-title-input:focus { border-bottom-color: var(--accent); }
.close-btn {
  width: 28px; height: 28px;
  border: none; background: transparent;
  color: var(--muted); cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 14px;
  display: flex; align-items: center; justify-content: center;
}
.close-btn:hover { background: var(--bg-accent); color: var(--text); }
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}
.meta-row { display: flex; gap: 16px; }
.meta-field { display: flex; flex-direction: column; gap: 4px; flex: 1; }
.meta-field label, .note-section label, .subtasks-label {
  font-size: 11px; font-weight: 600;
  text-transform: uppercase; letter-spacing: 0.06em; color: var(--muted);
}
.meta-field select, .meta-field input[type="date"] {
  padding: 6px 10px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); background: var(--bg); color: var(--text); font-size: 13px;
}
.note-section { display: flex; flex-direction: column; gap: 6px; }
.note-section textarea {
  padding: 8px 10px; border: 1px solid var(--border);
  border-radius: var(--radius-sm); background: var(--bg); color: var(--text);
  font-size: 13px; resize: vertical; font-family: inherit;
}
.subtasks-section { display: flex; flex-direction: column; gap: 8px; }
.subtasks-label { display: flex; align-items: center; justify-content: space-between; }
.subtask-progress { font-family: "JetBrains Mono", monospace; font-size: 11px; color: var(--muted); }
.subtasks-list { display: flex; flex-direction: column; gap: 4px; }
.subtask-item {
  display: flex; align-items: center; gap: 8px;
  padding: 6px 8px; border-radius: var(--radius-sm); background: var(--bg-accent);
}
.subtask-item:hover .subtask-delete-btn { opacity: 1; }
.checkbox-wrapper { position: relative; display: flex; align-items: center; cursor: pointer; flex-shrink: 0; }
.checkbox-wrapper input { display: none; }
.checkmark {
  width: 16px; height: 16px; border: 1.5px solid var(--border-strong);
  border-radius: 4px; transition: all 0.15s; background: var(--card);
  display: flex; align-items: center; justify-content: center;
}
.checkbox-wrapper input:checked + .checkmark { background: var(--accent); border-color: var(--accent); }
.checkbox-wrapper input:checked + .checkmark::after { content: '✓'; color: white; font-size: 10px; font-weight: 700; }
.subtask-title { flex: 1; font-size: 13px; color: var(--text); cursor: text; }
.subtask-title.completed { text-decoration: line-through; color: var(--muted); }
.subtask-title-input {
  flex: 1; border: 1px solid var(--accent); border-radius: 3px;
  padding: 2px 6px; font-size: 13px; background: var(--card); color: var(--text); outline: none;
}
.subtask-delete-btn {
  opacity: 0; width: 20px; height: 20px; border: none; background: transparent;
  color: var(--muted); cursor: pointer; border-radius: 3px;
  font-size: 10px; display: flex; align-items: center; justify-content: center;
  transition: opacity 0.15s; flex-shrink: 0;
}
.subtask-delete-btn:hover { background: var(--border); color: var(--text); }
.add-subtask { margin-top: 4px; }
.add-subtask-input {
  width: 100%; padding: 7px 10px;
  border: 1px dashed var(--border-strong); border-radius: var(--radius-sm);
  background: transparent; color: var(--text); font-size: 13px; outline: none;
  transition: border-color 0.15s; box-sizing: border-box;
}
.add-subtask-input:focus { border-color: var(--accent); border-style: solid; }
.add-subtask-input::placeholder { color: var(--muted); }
.modal-footer {
  display: flex; justify-content: flex-end; gap: 8px;
  padding: 12px 20px; border-top: 1px solid var(--border);
}
.btn-cancel, .btn-save {
  padding: 7px 16px; border-radius: var(--radius-sm);
  font-size: 13px; font-weight: 600; cursor: pointer; transition: all 0.15s;
}
.btn-cancel { background: transparent; border: 1px solid var(--border); color: var(--text-muted); }
.btn-cancel:hover { background: var(--bg-accent); }
.btn-save { background: var(--accent); border: none; color: white; }
.btn-save:hover { opacity: 0.9; }
</style>
