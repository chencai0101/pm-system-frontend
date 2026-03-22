<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <span class="modal-title">编辑项目</span>
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>

        <div class="field">
          <label>项目名称 <span class="required">*</span></label>
          <input v-model="form.name" type="text" placeholder="输入项目名称" />
        </div>

        <div class="field">
          <label>负责人 <span class="required">*</span></label>
          <input v-model="form.owner" type="text" placeholder="输入负责人姓名" />
        </div>

        <div class="row">
          <div class="field">
            <label>开始日期 <span class="required">*</span></label>
            <input v-model="form.start_date" type="date" />
          </div>
          <div class="field">
            <label>结束日期 <span class="required">*</span></label>
            <input v-model="form.end_date" type="date" />
          </div>
        </div>

        <div class="field">
          <label>描述</label>
          <textarea v-model="form.description" placeholder="项目描述（可选）" rows="3" />
        </div>

        <div class="field">
          <label>状态</label>
          <select v-model="form.status">
            <option value="open">未开始</option>
            <option value="in-progress">进行中</option>
            <option value="done">已完成</option>
          </select>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')" :disabled="loading">取消</button>
        <button class="btn-save" @click="submit" :disabled="loading">
          <span v-if="loading" class="loading-text">保存中…</span>
          <span v-else>保存</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { updateProject } from '../api/index'
import type { Project } from '../api/index'

const props = defineProps<{ project: Project }>()

const emit = defineEmits<{
  close: []
  updated: []
}>()

const loading = ref(false)
const errorMsg = ref('')

const form = reactive({
  name: props.project.name,
  owner: props.project.owner,
  start_date: props.project.startDate,
  end_date: props.project.endDate,
  description: props.project.description,
  status: props.project.status,
})

function validate(): string {
  if (!form.name.trim()) return '请填写项目名称'
  if (!form.owner.trim()) return '请填写负责人'
  if (!form.start_date) return '请选择开始日期'
  if (!form.end_date) return '请选择结束日期'
  if (form.end_date < form.start_date) return '结束日期不能早于开始日期'
  return ''
}

async function submit() {
  errorMsg.value = ''
  const err = validate()
  if (err) {
    errorMsg.value = err
    return
  }
  loading.value = true
  try {
    await updateProject(props.project.id, {
      name: form.name.trim(),
      owner: form.owner.trim(),
      start_date: form.start_date,
      end_date: form.end_date,
      description: form.description.trim() || undefined,
      status: form.status,
    })
    emit('updated')
  } catch (e: any) {
    errorMsg.value = e.message || '保存失败'
  } finally {
    loading.value = false
  }
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
  width: 480px;
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
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
}
.close-btn {
  width: 28px;
  height: 28px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: var(--radius-sm);
  font-size: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
}
.close-btn:hover { background: var(--bg-accent); color: var(--text); }
.modal-body {
  flex: 1;
  overflow-y: auto;
  padding: 16px 20px;
  display: flex;
  flex-direction: column;
  gap: 14px;
}
.error-banner {
  background: #fee2e2;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.field {
  display: flex;
  flex-direction: column;
  gap: 5px;
}
.field label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.required { color: #dc2626; }
.field input,
.field textarea,
.field select {
  padding: 7px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  font-family: inherit;
  outline: none;
  transition: border-color 0.15s;
}
.field input:focus,
.field textarea:focus,
.field select:focus {
  border-color: var(--accent);
}
.field textarea {
  resize: vertical;
}
.row {
  display: flex;
  gap: 12px;
}
.row .field { flex: 1; }
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
}
.btn-cancel, .btn-save {
  padding: 7px 16px;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.15s;
}
.btn-cancel {
  background: transparent;
  border: 1px solid var(--border);
  color: var(--text-muted);
}
.btn-cancel:hover:not(:disabled) { background: var(--bg-accent); }
.btn-save {
  background: var(--accent);
  border: none;
  color: white;
}
.btn-save:hover:not(:disabled) { opacity: 0.9; }
.btn-cancel:disabled, .btn-save:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}
.loading-text { font-size: 12px; }
</style>
