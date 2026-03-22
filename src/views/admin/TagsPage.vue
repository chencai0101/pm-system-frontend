<template>
  <div class="tags-page">
    <div class="page-header">
      <h1 class="page-title">标签管理</h1>
      <button class="btn-primary" @click="openCreateDrawer">
        + 新增标签
      </button>
    </div>

    <div v-if="loading" class="loading-state">加载中…</div>
    <div v-else-if="error" class="empty-state">⚠️ {{ error }}</div>
    <div v-else-if="tags.length === 0" class="empty-state">
      <span class="empty-icon">🏷️</span>
      <span>暂无标签，点击右上角新增</span>
    </div>
    <div v-else class="tag-grid">
      <div
        v-for="tag in tags"
        :key="tag.id"
        class="tag-card"
      >
        <!-- Color block -->
        <div class="tag-color-block" :style="{ background: TAG_COLORS[tag.color] || tag.color }" />

        <div class="tag-card-body">
          <div class="tag-name">{{ tag.name }}</div>
          <div class="tag-usage">
            关联 {{ tag.used_in_tasks ?? 0 }} 个任务，{{ tag.used_in_projects ?? 0 }} 个项目
          </div>

          <!-- Admin-only actions -->
          <div v-if="isAdmin" class="tag-actions">
            <button class="btn-action" @click="openEditDrawer(tag)">编辑</button>
            <button class="btn-action btn-danger" @click="confirmDelete(tag)">删除</button>
          </div>
        </div>
      </div>
    </div>

    <!-- Create / Edit Drawer -->
    <div v-if="drawerVisible" class="drawer-overlay" @click.self="drawerVisible = false">
      <div class="drawer">
        <div class="drawer-header">
          <h2 class="drawer-title">{{ editingTag ? '编辑标签' : '新增标签' }}</h2>
          <button class="drawer-close" @click="drawerVisible = false">✕</button>
        </div>

        <div class="drawer-body">
          <div class="form-group">
            <label class="form-label">标签名称 <span class="required">*</span></label>
            <input
              v-model="form.name"
              class="form-input"
              type="text"
              placeholder="例如：紧急、高优、设计"
              maxlength="20"
            />
          </div>

          <div class="form-group">
            <label class="form-label">颜色</label>
            <div class="color-grid">
              <button
                v-for="(hex, key) in TAG_COLORS"
                :key="key"
                class="color-swatch"
                :class="{ selected: form.color === key }"
                :style="{ background: hex }"
                :title="key"
                @click="form.color = key"
              />
            </div>
          </div>

          <div class="form-preview">
            <span class="form-preview-label">预览：</span>
            <span
              class="preview-badge"
              :style="{ background: TAG_COLORS[form.color] || form.color }"
            >
              {{ form.name || '标签名' }}
            </span>
          </div>

          <div v-if="formError" class="form-error">{{ formError }}</div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary" @click="drawerVisible = false">取消</button>
          <button class="btn-primary" @click="submitForm">
            {{ editingTag ? '保存' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Dialog -->
    <div v-if="deleteDialog.visible" class="modal-overlay" @click.self="deleteDialog.visible = false">
      <div class="modal modal-sm">
        <div class="modal-header">
          <h3 class="modal-title">确认删除</h3>
        </div>
        <div class="modal-body">
          <p v-if="deleteDialog.usage">
            该标签已关联 <strong>{{ deleteDialog.usage.used_in_tasks ?? 0 }}</strong> 个任务和
            <strong>{{ deleteDialog.usage.used_in_projects ?? 0 }}</strong> 个项目，
            删除后关联将自动解除。确认删除？
          </p>
          <p v-else>确认删除标签「{{ deleteDialog.tag?.name }}」？</p>
        </div>
        <div class="modal-footer">
          <button class="btn-secondary" @click="deleteDialog.visible = false">取消</button>
          <button class="btn-danger" @click="executeDelete">确认删除</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive, onMounted } from 'vue'
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  type TagWithUsage,
} from '../../api/index'

// ── Constants ───────────────────────────────────────────────
const TAG_COLORS: Record<string, string> = {
  red: '#ef4444',
  orange: '#f97316',
  yellow: '#eab308',
  green: '#22c55e',
  blue: '#3b82f6',
  purple: '#a855f7',
  pink: '#ec4899',
  gray: '#6b7280',
}

// ── State ────────────────────────────────────────────────────
const tags = ref<TagWithUsage[]>([])
const loading = ref(false)
const error = ref<string | null>(null)
const isAdmin = ref(true) // TODO: hook to auth context

const drawerVisible = ref(false)
const editingTag = ref<TagWithUsage | null>(null)
const form = reactive({ name: '', color: 'blue' })
const formError = ref<string | null>(null)

const deleteDialog = reactive({
  visible: false,
  tag: null as TagWithUsage | null,
  usage: null as { used_in_tasks?: number; used_in_projects?: number } | null,
})

// ── Load tags ────────────────────────────────────────────────
async function loadTags() {
  loading.value = true
  error.value = null
  try {
    const res = await fetchTags()
    tags.value = res.data
  } catch (e) {
    error.value = e instanceof Error ? e.message : '加载失败'
  } finally {
    loading.value = false
  }
}

// ── Drawer open / close ───────────────────────────────────────
function openCreateDrawer() {
  editingTag.value = null
  form.name = ''
  form.color = 'blue'
  formError.value = null
  drawerVisible.value = true
}

function openEditDrawer(tag: TagWithUsage) {
  editingTag.value = tag
  form.name = tag.name
  form.color = tag.color
  formError.value = null
  drawerVisible.value = true
}

// ── Form submit ─────────────────────────────────────────────
async function submitForm() {
  if (!form.name.trim()) {
    formError.value = '标签名称不能为空'
    return
  }
  formError.value = null
  try {
    if (editingTag.value) {
      const updated = await updateTag(editingTag.value.id, {
        name: form.name.trim(),
        color: form.color,
      })
      // Update in-place
      const idx = tags.value.findIndex(t => t.id === editingTag.value!.id)
      if (idx !== -1) tags.value[idx] = { ...tags.value[idx], ...updated }
    } else {
      const created = await createTag({ name: form.name.trim(), color: form.color })
      tags.value.push({ ...created, used_in_tasks: 0, used_in_projects: 0 })
    }
    drawerVisible.value = false
  } catch (e) {
    formError.value = e instanceof Error ? e.message : '保存失败'
  }
}

// ── Delete ───────────────────────────────────────────────────
function confirmDelete(tag: TagWithUsage) {
  deleteDialog.tag = tag
  deleteDialog.usage = null
  deleteDialog.visible = true
}

async function executeDelete() {
  if (!deleteDialog.tag) return
  const tag = deleteDialog.tag
  try {
    const usage = await deleteTag(tag.id)
    if (usage) {
      deleteDialog.usage = usage
      return // keep dialog open to show usage info
    }
    // Success — remove from list
    tags.value = tags.value.filter(t => t.id !== tag.id)
    deleteDialog.visible = false
  } catch (e) {
    console.error('Delete failed:', e)
  }
}

onMounted(loadTags)
</script>

<style scoped>
.tags-page {
  padding: 28px 32px;
  overflow-y: auto;
  height: 100%;
}

.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 28px;
}

.page-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-strong);
}

/* Tag grid */
.tag-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
  gap: 16px;
  align-items: start;
}

.tag-card {
  display: flex;
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  overflow: hidden;
  background: var(--card);
  transition: box-shadow 0.2s, border-color 0.2s;
  box-shadow: var(--shadow-sm);
  min-height: 100px;
}

.tag-card:hover {
  box-shadow: var(--shadow-md);
  border-color: var(--border-strong);
}

.tag-color-block {
  width: 8px;
  flex-shrink: 0;
}

.tag-card-body {
  flex: 1;
  padding: 16px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.tag-name {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.tag-usage {
  font-size: 12px;
  color: var(--muted);
}

.tag-actions {
  display: flex;
  gap: 8px;
  margin-top: auto;
  padding-top: 4px;
}

.btn-action {
  padding: 4px 12px;
  background: var(--bg-accent);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 12px;
  font-weight: 500;
  font-family: inherit;
  color: var(--text);
  cursor: pointer;
  transition: all 0.15s;
}

.btn-action:hover {
  border-color: var(--border-strong);
  background: var(--card);
}

.btn-action.btn-danger {
  color: #ef4444;
  border-color: rgba(239,68,68,0.3);
  background: rgba(239,68,68,0.06);
}

.btn-action.btn-danger:hover {
  background: rgba(239,68,68,0.12);
}

/* Buttons */
.btn-primary {
  padding: 8px 20px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}

.btn-primary:hover {
  opacity: 0.85;
}

.btn-secondary {
  padding: 8px 20px;
  background: var(--card);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 500;
  cursor: pointer;
  font-family: inherit;
  transition: all 0.15s;
}

.btn-secondary:hover {
  border-color: var(--border-strong);
  background: var(--bg-accent);
}

.btn-danger {
  padding: 8px 20px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  font-family: inherit;
  transition: opacity 0.15s;
}

.btn-danger:hover {
  opacity: 0.85;
}

/* Drawer */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.3);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}

.drawer {
  width: 400px;
  height: 100%;
  background: var(--card);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  animation: slideInRight 0.25s var(--ease-out) both;
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
}

.drawer-close {
  background: none;
  border: none;
  font-size: 18px;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}

.drawer-close:hover {
  color: var(--text);
}

.drawer-body {
  padding: 20px 24px;
  overflow-y: auto;
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.drawer-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  flex-shrink: 0;
}

/* Form */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
}

.required {
  color: #ef4444;
}

.form-input {
  width: 100%;
  padding: 9px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 14px;
  font-family: inherit;
  transition: border-color 0.15s;
  outline: none;
}

.form-input:focus {
  border-color: var(--accent);
}

/* Color picker */
.color-grid {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.color-swatch {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  border: 2px solid transparent;
  cursor: pointer;
  transition: transform 0.15s, border-color 0.15s;
  box-shadow: 0 1px 3px rgba(0,0,0,0.15);
}

.color-swatch:hover {
  transform: scale(1.1);
}

.color-swatch.selected {
  border-color: var(--text-strong);
  transform: scale(1.1);
  box-shadow: 0 0 0 3px rgba(0,0,0,0.15);
}

/* Preview */
.form-preview {
  display: flex;
  align-items: center;
  gap: 10px;
}

.form-preview-label {
  font-size: 13px;
  color: var(--muted);
}

.preview-badge {
  display: inline-flex;
  padding: 4px 12px;
  border-radius: var(--radius-full);
  font-size: 13px;
  font-weight: 600;
  color: #fff;
}

/* Form error */
.form-error {
  font-size: 13px;
  color: #ef4444;
  padding: 8px 12px;
  background: rgba(239,68,68,0.08);
  border-radius: var(--radius-sm);
  border: 1px solid rgba(239,68,68,0.25);
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}

.modal {
  width: 480px;
  background: var(--card);
  border-radius: var(--radius-lg);
  box-shadow: var(--shadow-lg);
  display: flex;
  flex-direction: column;
  animation: fadeSlideIn 0.2s var(--ease-out) both;
}

.modal-sm {
  width: 400px;
}

.modal-header {
  padding: 18px 24px;
  border-bottom: 1px solid var(--border);
}

.modal-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.modal-body {
  padding: 20px 24px;
  font-size: 14px;
  color: var(--text);
  line-height: 1.6;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  padding: 14px 20px;
  border-top: 1px solid var(--border);
}

/* Loading / empty */
.loading-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--muted);
  font-size: 14px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 200px;
  color: var(--muted);
  font-size: 14px;
  gap: 8px;
}

.empty-icon {
  font-size: 40px;
  opacity: 0.3;
}

@keyframes fadeSlideIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

@keyframes slideInRight {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}
</style>
