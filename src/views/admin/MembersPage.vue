<template>
  <div class="members-page">
    <!-- Header -->
    <div class="page-header">
      <div class="page-title-row">
        <h1 class="page-title">人员管理</h1>
        <span class="member-count">部门共有 {{ members.length }} 人</span>
      </div>
      <div class="page-toolbar">
        <input
          v-model="searchName"
          class="search-input"
          type="text"
          placeholder="搜索姓名..."
        />
        <button class="btn-primary ml-auto" @click="openCreateModal">+ 新增成员</button>
      </div>
    </div>

    <!-- Loading / Error -->
    <div v-if="loading" class="state-message">加载中…</div>
    <div v-else-if="error" class="state-message error">⚠️ {{ error }}</div>

    <!-- Empty -->
    <div v-else-if="members.length === 0" class="state-message">暂无成员</div>

    <!-- Member list -->
    <div v-else class="member-list">
      <div
        v-for="member in filteredMembers"
        :key="member.id"
        class="member-card"
      >
        <div class="member-card-left">
          <div class="member-avatar">
            {{ member.name.charAt(0).toUpperCase() }}
          </div>
          <div class="member-info">
            <div class="member-name">{{ member.name }}</div>
            <div class="member-meta">
              <span class="role-badge" :class="member.role">
                {{ member.role === 'admin' ? '系统管理员' : '普通成员' }}
              </span>
            </div>
          </div>
        </div>
        <div class="member-card-right" @click.stop>
          <button class="icon-btn" title="查看参与项目" @click="openDetailDrawer(member)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <circle cx="11" cy="11" r="8"/>
              <path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
          <button class="icon-btn" title="编辑" @click="openEditModal(member)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="icon-btn danger" title="删除" @click="confirmDelete(member)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Create / Edit Modal (centered, matches TaskEditModal) -->
    <div v-if="modalVisible" class="modal-overlay" @click.self="closeModal">
      <div class="modal">
        <div class="modal-header">
          <input
            v-model="form.name"
            class="modal-title-input"
            :placeholder="drawerMode === 'create' ? '成员姓名…' : '成员姓名'"
          />
          <button class="close-btn" @click="closeModal">✕</button>
        </div>

        <div class="modal-body">
          <div class="meta-row">
            <div class="meta-field">
              <label>角色</label>
              <select v-model="form.role">
                <option value="member">普通成员</option>
                <option value="admin">系统管理员</option>
              </select>
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-field">
              <label class="required">企业微信 UserId</label>
              <input v-model="form.wecom_user_id" type="text" placeholder="必填" />
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-field">
              <label>企业微信昵称</label>
              <input v-model="form.wecom_name" type="text" placeholder="可选" />
            </div>
          </div>

          <div class="meta-row">
            <div class="meta-field">
              <label>手机号</label>
              <input v-model="form.mobile" type="text" placeholder="可选" />
            </div>
          </div>

          <div v-if="modalError" class="modal-error">{{ modalError }}</div>
        </div>

        <div class="modal-footer">
          <button class="btn-cancel" @click="closeModal">取消</button>
          <button class="btn-save" @click="submitForm" :disabled="submitting">
            {{ submitting ? '保存中…' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Detail Drawer (side drawer for project list) -->
    <div v-if="detailDrawerVisible" class="drawer-overlay" @click.self="closeDetailDrawer">
      <div class="drawer">
        <div class="drawer-header">
          <span class="drawer-title">{{ detailMember?.name }}</span>
          <button class="close-btn" @click="closeDetailDrawer">✕</button>
        </div>
        <div class="drawer-body">
          <div v-if="detailLoading" class="state-message">加载中…</div>
          <div v-else-if="detailProjects.length === 0" class="state-message">暂无关联项目</div>
          <div v-else class="project-card-list">
            <ProjectCard
              v-for="proj in detailProjects"
              :key="proj.id"
              :project="(proj as unknown as Project)"
              :clickable="true"
              @click="goToProject(proj.id)"
            />
          </div>
        </div>
      </div>
    </div>

    <!-- Delete Confirm Dialog -->
    <div v-if="deleteDialogVisible" class="modal-overlay" @click.self="deleteDialogVisible = false">
      <div class="dialog">
        <div class="dialog-header">
          <span class="dialog-title">确认删除</span>
          <button class="close-btn" @click="deleteDialogVisible = false">✕</button>
        </div>
        <div class="dialog-body">
          <p>确定要删除成员 <strong>{{ deleteTarget?.name }}</strong> 吗？</p>
          <p v-if="deleteError" class="modal-error">{{ deleteError }}</p>
        </div>
        <div class="dialog-footer">
          <button class="btn-cancel" @click="deleteDialogVisible = false">取消</button>
          <button class="btn-danger" @click="executeDelete" :disabled="deleting">
            {{ deleting ? '删除中…' : '确认删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { fetchMembers, createMember, updateMember, deleteMember, fetchMemberProjects, type Member, type MemberProject } from '../../api/index'
import ProjectCard from '../../components/ProjectCard.vue'
import type { Project } from '../../api/index'

const members = ref<Member[]>([])
const loading = ref(false)
const error = ref('')
const searchName = ref('')

const filteredMembers = computed(() => {
  if (!searchName.value) return members.value
  const q = searchName.value.toLowerCase()
  return members.value.filter(m => m.name.toLowerCase().includes(q))
})

async function loadMembers() {
  loading.value = true
  error.value = ''
  try {
    const res = await fetchMembers()
    if (res.error) {
      error.value = res.error
    } else {
      members.value = res.data
    }
  } catch (e: any) {
    error.value = e.message || '加载失败'
  } finally {
    loading.value = false
  }
}

onMounted(loadMembers)

// ── Create / Edit Modal ─────────────────────────────────────
const modalVisible = ref(false)
const drawerMode = ref<'create' | 'edit'>('create')
const modalError = ref('')
const submitting = ref(false)
const editingMember = ref<Member | null>(null)

const blankForm = () => ({
  name: '',
  role: 'member',
  wecom_user_id: '',
  wecom_name: '',
  mobile: '',
})
const form = ref(blankForm())

function openCreateModal() {
  drawerMode.value = 'create'
  form.value = blankForm()
  modalError.value = ''
  modalVisible.value = true
}

function openEditModal(member: Member) {
  drawerMode.value = 'edit'
  editingMember.value = member
  form.value = {
    name: member.name,
    role: member.role,
    wecom_user_id: member.wecom_user_id,
    wecom_name: member.wecom_name,
    mobile: member.mobile,
  }
  modalError.value = ''
  modalVisible.value = true
}

function closeModal() {
  modalVisible.value = false
  modalError.value = ''
  submitting.value = false
}

async function submitForm() {
  if (!form.value.name.trim()) { modalError.value = '姓名不能为空'; return }
  if (!form.value.wecom_user_id.trim()) { modalError.value = '企业微信 UserId 不能为空'; return }
  submitting.value = true
  modalError.value = ''
  try {
    if (drawerMode.value === 'create') {
      const created = await createMember({
        name: form.value.name,
        role: form.value.role,
        wecom_user_id: form.value.wecom_user_id,
        wecom_name: form.value.wecom_name || undefined,
        mobile: form.value.mobile || undefined,
      })
      members.value.unshift(created)
      closeModal()
    } else {
      if (!editingMember.value) return
      const updated = await updateMember(editingMember.value.id, {
        name: form.value.name,
        role: form.value.role,
        wecom_user_id: form.value.wecom_user_id,
        wecom_name: form.value.wecom_name || undefined,
        mobile: form.value.mobile || undefined,
      })
      const idx = members.value.findIndex(m => m.id === updated.id)
      if (idx !== -1) members.value[idx] = updated
      closeModal()
    }
  } catch (e: any) {
    modalError.value = e.message || '保存失败'
  } finally {
    submitting.value = false
  }
}

// ── Detail Drawer ────────────────────────────────────────────
const detailDrawerVisible = ref(false)
const detailMember = ref<Member | null>(null)
const detailProjects = ref<MemberProject[]>([])
const detailLoading = ref(false)

function goToProject(projectId: string) {
  closeDetailDrawer()
  // Navigate to project detail tab with hash
  window.location.hash = `#/project/${projectId}`
  // Dispatch custom event so App.vue can switch tab
  window.dispatchEvent(new CustomEvent('open-project', { detail: { projectId } }))
}

function openDetailDrawer(member: Member) {
  detailMember.value = member
  detailProjects.value = []
  detailDrawerVisible.value = true
  detailLoading.value = true
  fetchMemberProjects(member.id)
    .then(res => {
      if (res.error) detailProjects.value = []
      else detailProjects.value = res.data
    })
    .catch(() => { detailProjects.value = [] })
    .finally(() => { detailLoading.value = false })
}

function closeDetailDrawer() {
  detailDrawerVisible.value = false
}

// ── Delete ───────────────────────────────────────────────────
const deleteDialogVisible = ref(false)
const deleteTarget = ref<Member | null>(null)
const deleteError = ref('')
const deleting = ref(false)

function confirmDelete(member: Member) {
  deleteTarget.value = member
  deleteError.value = ''
  deleteDialogVisible.value = true
}

async function executeDelete() {
  if (!deleteTarget.value) return
  deleting.value = true
  deleteError.value = ''
  try {
    await deleteMember(deleteTarget.value.id)
    members.value = members.value.filter(m => m.id !== deleteTarget.value!.id)
    deleteDialogVisible.value = false
  } catch (e: any) {
    deleteError.value = e.message || '删除失败'
  } finally {
    deleting.value = false
  }
}
</script>

<style scoped>
/* ── Page layout ─────────────────────────────────────────────── */
.members-page {
  display: flex;
  flex-direction: column;
  gap: 16px;
  padding: 24px 32px;
  overflow-y: auto;
  height: 100%;
}

.page-header {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.page-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
}

.page-title {
  font-size: 18px;
  font-weight: 800;
  color: var(--text-strong);
  margin: 0;
}

.member-count {
  font-size: 13px;
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
}

.page-toolbar {
  display: flex;
  align-items: center;
  gap: 10px;
}

.search-input {
  padding: 6px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color 0.15s;
  min-width: 200px;
}

.search-input:focus { border-color: var(--accent); }

.btn-primary {
  padding: 6px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity 0.15s;
}

.btn-primary:hover { opacity: 0.85; }

.ml-auto { margin-left: auto; }
.btn-primary:disabled { opacity: 0.5; cursor: not-allowed; }

.state-message {
  font-size: 14px;
  color: var(--muted);
  padding: 24px 0;
  text-align: center;
}

.state-message.error { color: #ef4444; }

/* ── Member list ────────────────────────────────────────────── */
.member-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: box-shadow 0.15s, transform 0.15s;
}

.member-card:hover {
  box-shadow: var(--shadow-sm);
}

.member-card-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.member-info {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.member-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--text-strong);
}

.member-meta {
  display: flex;
  align-items: center;
  gap: 8px;
}

.role-badge {
  font-size: 11px;
  font-weight: 700;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.role-badge.admin { background: #ef444433; color: #ef4444; }
.role-badge.member { background: var(--bg-accent); color: var(--muted); }

.member-card-right {
  display: flex;
  align-items: center;
  gap: 6px;
}

.icon-btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  background: none;
  border-radius: var(--radius-sm);
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s, background 0.15s;
}

.icon-btn:hover { color: var(--accent); background: var(--accent-subtle); }
.icon-btn.danger:hover { color: #ef4444; background: #ef444433; }

/* ── Modal (matches TaskEditModal) ─────────────────────────── */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.modal {
  background: var(--glass);
  border: 1px solid var(--border-strong);
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
  flex-shrink: 0;
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

.meta-field label.required::after {
  content: ' *';
  color: #ef4444;
}

.meta-field select,
.meta-field input[type="text"] {
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
.meta-field input[type="text"]:focus {
  border-color: var(--accent);
}

.modal-error {
  font-size: 12px;
  color: #ef4444;
  padding: 4px 0;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
}

.btn-cancel,
.btn-save {
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

.btn-cancel:hover { background: var(--bg-accent); }

.btn-save {
  background: var(--accent);
  border: none;
  color: white;
}

.btn-save:hover { opacity: 0.9; }
.btn-save:disabled { opacity: 0.5; cursor: not-allowed; }

.btn-danger {
  padding: 7px 16px;
  background: #ef4444;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  color: white;
  cursor: pointer;
}

.btn-danger:disabled { opacity: 0.5; cursor: not-allowed; }

/* ── Detail side drawer ────────────────────────────────────── */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 1000;
  display: flex;
  justify-content: flex-end;
  backdrop-filter: blur(8px);
  -webkit-backdrop-filter: blur(8px);
}

.drawer {
  width: 360px;
  height: 100%;
  background: var(--bg);
  border-left: 1px solid var(--border-strong);
  display: flex;
  flex-direction: column;
  animation: slideIn 0.2s ease-out;
}

@keyframes slideIn {
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
}

.drawer-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}

.drawer-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 20px;
}

.project-tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.project-tag {
  font-size: 12px;
  padding: 4px 10px;
  border-radius: var(--radius-full);
  background: var(--bg-accent);
  color: var(--muted);
  font-weight: 600;
  display: inline-flex;
  align-items: center;
  gap: 5px;
}

.project-tag.editable {
  background: var(--accent-subtle);
  color: var(--accent);
}

.tag-edit-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 1px 5px;
  border-radius: 3px;
  background: var(--accent);
  color: white;
}

/* ── Delete dialog ─────────────────────────────────────────── */
.dialog {
  width: 380px;
  max-width: 90vw;
  background: var(--glass);
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-lg);
  display: flex;
  flex-direction: column;
  box-shadow: var(--shadow-lg);
  align-self: center;
}

.dialog-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 20px;
  border-bottom: 1px solid var(--border);
}

.dialog-title {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
}

.dialog-body {
  padding: 20px;
}

.dialog-body p {
  margin: 0 0 8px;
  font-size: 13px;
  color: var(--text);
  line-height: 1.5;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 8px;
  padding: 12px 20px;
  border-top: 1px solid var(--border);
}
</style>
