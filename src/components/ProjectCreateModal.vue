<template>
  <div class="modal-overlay" @click.self="$emit('close')">
    <div class="modal">
      <div class="modal-header">
        <input
          v-model="form.name"
          class="modal-title-input"
          placeholder="项目名称…"
          @keydown.enter="submit"
        />
        <button class="close-btn" @click="$emit('close')">✕</button>
      </div>

      <div class="modal-body">
        <div class="meta-field">
          <label>参与人员 <span class="required">*</span></label>
          <div class="person-picker">
            <select @change="addPerson($event)" class="person-select">
              <option value="">+ 添加人员…</option>
              <option v-for="m in availableMembers" :key="m.id" :value="m.name">{{ m.name }}</option>
            </select>
          </div>
          <div v-if="selectedPeople.length" class="person-chips">
            <div
              v-for="(name, idx) in selectedPeople"
              :key="name"
              class="person-chip"
              :class="{ 'is-owner': idx === 0 }"
            >
              <span class="chip-label">{{ idx === 0 ? '负责人' : '参与人' }}</span>
              <span class="chip-name">{{ name }}</span>
              <button class="chip-remove" @click="removePerson(idx)">✕</button>
            </div>
          </div>
          <div v-if="!selectedPeople.length" class="person-hint">
            从上方下拉框添加人员，第一个自动成为负责人
          </div>
        </div>

        <div class="meta-row">
          <div class="meta-field">
            <label>开始日期 <span class="required">*</span></label>
            <input v-model="form.start_date" type="date" />
          </div>
          <div class="meta-field">
            <label>结束日期 <span class="required">*</span></label>
            <input v-model="form.end_date" type="date" />
          </div>
        </div>

        <div class="meta-field">
          <label>所需资源</label>
          <input
            v-model="form.resources"
            class="text-input"
            type="text"
            placeholder="如：外包团队、供应商、外部讲师…"
          />
        </div>

        <div v-if="errorMsg" class="error-banner">{{ errorMsg }}</div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')" :disabled="loading">取消</button>
        <button class="btn-save" @click="submit" :disabled="loading">
          {{ loading ? '创建中…' : '创建' }}
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, computed, onMounted } from 'vue'
import { createProject, fetchMembers, type Member } from '../api/index'

const emit = defineEmits<{
  close: []
  created: []
}>()

const loading = ref(false)
const errorMsg = ref('')
const members = ref<Member[]>([])

const form = reactive({
  name: '',
  resources: '',
  start_date: '',
  end_date: '',
})

const selectedPeople = ref<string[]>([])

const availableMembers = computed(() =>
  members.value.filter(m => !selectedPeople.value.includes(m.name))
)

function addPerson(e: Event) {
  const name = (e.target as HTMLSelectElement).value
  if (name) {
    selectedPeople.value.push(name)
    ;(e.target as HTMLSelectElement).value = ''
  }
}

function removePerson(idx: number) {
  selectedPeople.value.splice(idx, 1)
}

onMounted(async () => {
  const res = await fetchMembers()
  if (!res.error) members.value = res.data
})

function validate(): string {
  if (!form.name.trim()) return '请填写项目名称'
  if (selectedPeople.value.length === 0) return '请至少添加一名参与人员'
  if (!form.start_date) return '请选择开始日期'
  if (!form.end_date) return '请选择结束日期'
  if (form.end_date < form.start_date) return '结束日期不能早于开始日期'
  return ''
}

async function submit() {
  errorMsg.value = ''
  const err = validate()
  if (err) { errorMsg.value = err; return }
  loading.value = true
  try {
    await createProject({
      name: form.name.trim(),
      owner: selectedPeople.value[0],
      members: selectedPeople.value.slice(1).join('、'),
      resources: form.resources,
      start_date: form.start_date,
      end_date: form.end_date,
    })
    emit('created')
  } catch (e: any) {
    errorMsg.value = e.message || '创建失败'
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
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
  border-bottom: 2px solid transparent;
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  outline: none;
  padding: 4px 0;
  transition: border-color 0.15s;
}
.modal-title-input:focus {
  border-bottom-color: var(--accent);
}
.modal-title-input::placeholder {
  color: var(--muted);
  font-weight: 400;
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
  gap: 16px;
}
.error-banner {
  background: #fee2e2;
  color: #dc2626;
  padding: 8px 12px;
  border-radius: var(--radius-sm);
  font-size: 13px;
}
.meta-row {
  display: flex;
  gap: 16px;
}
.meta-field {
  display: flex;
  flex-direction: column;
  gap: 4px;
  flex: 1;
}
.meta-field label {
  font-size: 11px;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
}
.required { color: #dc2626; }
.meta-field select,
.meta-field input[type="date"],
.meta-field .text-input {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-accent);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
}
.meta-field select:focus,
.meta-field input[type="date"]:focus,
.meta-field .text-input:focus {
  border-color: var(--accent);
}

.person-picker {
  margin-bottom: 8px;
}

.person-select {
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-accent);
  color: var(--text);
  font-size: 13px;
  outline: none;
  width: 100%;
  cursor: pointer;
}

.person-select:focus {
  border-color: var(--accent);
}

.person-chips {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.person-chip {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 10px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg-accent);
}

.person-chip.is-owner {
  border-color: var(--accent);
  background: color-mix(in srgb, var(--accent) 8%, var(--bg-accent));
}

.chip-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  min-width: 40px;
}

.person-chip.is-owner .chip-label {
  color: var(--accent);
}

.chip-name {
  flex: 1;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.chip-remove {
  width: 18px;
  height: 18px;
  border: none;
  background: none;
  color: var(--muted);
  cursor: pointer;
  font-size: 11px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.15s;
  flex-shrink: 0;
}

.chip-remove:hover {
  background: #fee2e2;
  color: #ef4444;
}

.person-hint {
  font-size: 12px;
  color: var(--muted);
  font-style: italic;
  padding: 4px 0;
}
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
</style>
