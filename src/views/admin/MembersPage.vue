<template>
  <div class="members-page">
    <!-- Page header -->
    <div class="page-header">
      <div class="page-title-row">
        <h1 class="page-title">人员管理</h1>
        <span class="page-subtitle">部门共有 {{ members.length }} 人</span>
      </div>
      <div class="toolbar">
        <input
          v-model="searchKeyword"
          class="search-input"
          type="text"
          placeholder="搜索姓名…"
        />
        <button class="btn-primary" @click="openAddDrawer">+ 新增成员</button>
      </div>
    </div>

    <!-- Members list -->
    <div v-if="loading" class="loading-state">
      <span>加载中…</span>
    </div>
    <div v-else-if="filteredMembers.length === 0" class="empty-state">
      <span class="empty-icon">👤</span>
      <span>{{ searchKeyword ? '未找到匹配的成员' : '暂无成员' }}</span>
    </div>
    <div v-else class="members-list">
      <div
        v-for="member in filteredMembers"
        :key="member.id"
        class="member-card"
      >
        <div class="member-card-left">
          <div class="member-avatar">
            <img v-if="member.wecom_avatar" :src="member.wecom_avatar" :alt="member.name" />
            <span v-else>{{ member.name.charAt(0) }}</span>
          </div>
          <div class="member-info">
            <div class="member-name-row">
              <span class="member-name">{{ member.name }}</span>
              <span
                class="role-tag"
                :class="member.role === 'admin' ? 'role-admin' : 'role-member'"
              >
                {{ member.role === 'admin' ? '系统管理员' : '普通成员' }}
              </span>
              <!-- 企业微信徽标 -->
              <span v-if="member.wecom_user_id" class="wecom-badge" title="已绑定企业微信">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 0c0 5.52-4.48 10-10 10S2 17.52 2 12 6.48 2 12 2zm-1 3h2v2h-2V5zm0 4h2v6h-2v-6z"/>
                </svg>
              </span>
            </div>
            <div class="member-meta">
              <span class="member-projects-count" @click="openDetailDrawer(member)">
                参与 {{ memberProjectCount(member.id) }} 个项目
              </span>
              <span v-if="member.mobile" class="member-mobile">{{ member.mobile }}</span>
            </div>
          </div>
        </div>
        <div class="member-actions">
          <button class="btn-icon" title="编辑" @click="openEditDrawer(member)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
          <button class="btn-icon btn-danger" title="删除" @click="onDeleteMember(member)">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- 新增/编辑抽屉 -->
    <div
      v-if="drawerVisible"
      class="drawer-overlay"
      @click.self="closeDrawer"
    >
      <div class="drawer-panel" :class="{ open: drawerVisible }">
        <div class="drawer-header">
          <h2 class="drawer-title">{{ editingMember ? '编辑成员' : '新增成员' }}</h2>
          <button class="drawer-close" @click="closeDrawer">✕</button>
        </div>

        <div class="drawer-body">
          <div class="form-group">
            <label class="form-label required">姓名</label>
            <input
              v-model="form.name"
              class="form-input"
              type="text"
              placeholder="输入姓名"
            />
            <span v-if="formErrors.name" class="form-error">{{ formErrors.name }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">角色</label>
            <select v-model="form.role" class="form-input">
              <option value="member">普通成员</option>
              <option value="admin">系统管理员</option>
            </select>
          </div>

          <div class="form-group">
            <label class="form-label required">企业微信 UserId</label>
            <input
              v-model="form.wecom_user_id"
              class="form-input"
              type="text"
              placeholder="输入企业微信 UserId"
            />
            <span v-if="formErrors.wecom_user_id" class="form-error">{{ formErrors.wecom_user_id }}</span>
          </div>

          <div class="form-group">
            <label class="form-label">企业微信昵称</label>
            <input
              v-model="form.wecom_name"
              class="form-input"
              type="text"
              placeholder="输入企业微信昵称"
            />
          </div>

          <div class="form-group">
            <label class="form-label">手机号</label>
            <input
              v-model="form.mobile"
              class="form-input"
              type="tel"
              placeholder="输入手机号"
            />
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary" @click="closeDrawer">取消</button>
          <button class="btn-primary" @click="onDrawerConfirm">确认</button>
        </div>
      </div>
    </div>

    <!-- 成员详情抽屉（查看参与项目） -->
    <div
      v-if="detailDrawerVisible"
      class="drawer-overlay"
      @click.self="closeDetailDrawer"
    >
      <div class="drawer-panel" :class="{ open: detailDrawerVisible }">
        <div class="drawer-header">
          <h2 class="drawer-title">{{ detailMember?.name }} — 参与项目</h2>
          <button class="drawer-close" @click="closeDetailDrawer">✕</button>
        </div>

        <div class="drawer-body">
          <div v-if="detailLoading" class="loading-state"><span>加载中…</span></div>
          <div v-else-if="detailProjects.length === 0" class="empty-state">
            <span>暂未参与任何项目</span>
          </div>
          <div v-else class="project-tags">
            <span
              v-for="project in detailProjects"
              :key="project.id"
              class="project-tag"
            >
              {{ project.name }}
            </span>
          </div>
        </div>

        <div class="drawer-footer">
          <button class="btn-secondary" @click="closeDetailDrawer">关闭</button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="deleteConfirmVisible" class="modal-overlay" @click.self="deleteConfirmVisible = false">
      <div class="modal-box">
        <h3 class="modal-title">确认删除</h3>
        <p class="modal-body">
          <template v-if="deleteHasProjects">
            该成员已关联 {{ deleteMemberProjectCount }} 个项目，无法直接删除。
            请先从项目中移除该成员。
          </template>
          <template v-else>
            确定要删除成员 <strong>{{ deleteTargetMember?.name }}</strong> 吗？此操作不可撤销。
          </template>
        </p>
        <div class="modal-footer">
          <button class="btn-secondary" @click="deleteConfirmVisible = false">取消</button>
          <button
            v-if="!deleteHasProjects"
            class="btn-danger"
            @click="onConfirmDelete"
          >
            删除
          </button>
          <button
            v-else
            class="btn-secondary"
            @click="deleteConfirmVisible = false"
          >
            我知道了
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import {
  fetchMembers,
  createMember,
  updateMember,
  deleteMember,
  fetchMemberProjects,
  type Member,
  type Project,
} from '../../api/index'

const members = ref<Member[]>([])
const loading = ref(false)
const searchKeyword = ref('')

// 抽屉状态
const drawerVisible = ref(false)
const editingMember = ref<Member | null>(null)
const form = ref({
  name: '',
  role: 'member' as 'admin' | 'member',
  wecom_user_id: '',
  wecom_name: '',
  wecom_avatar: '',
  mobile: '',
  department_id: '1',
})
const formErrors = ref<Record<string, string>>({})

// 详情抽屉
const detailDrawerVisible = ref(false)
const detailMember = ref<Member | null>(null)
const detailProjects = ref<Project[]>([])
const detailLoading = ref(false)

// 删除确认
const deleteConfirmVisible = ref(false)
const deleteTargetMember = ref<Member | null>(null)
const deleteHasProjects = ref(false)
const deleteMemberProjectCount = ref(0)

// 成员 → 项目数缓存
const memberProjectsCache = ref<Record<string, Project[]>>({})

const filteredMembers = computed(() => {
  const kw = searchKeyword.value.trim().toLowerCase()
  if (!kw) return members.value
  return members.value.filter(m => m.name.toLowerCase().includes(kw))
})

function memberProjectCount(memberId: string): number {
  return memberProjectsCache.value[memberId]?.length ?? 0
}

// 新增抽屉
function openAddDrawer() {
  editingMember.value = null
  form.value = {
    name: '',
    role: 'member',
    wecom_user_id: '',
    wecom_name: '',
    wecom_avatar: '',
    mobile: '',
    department_id: '1',
  }
  formErrors.value = {}
  drawerVisible.value = true
}

// 编辑抽屉
function openEditDrawer(member: Member) {
  editingMember.value = member
  form.value = {
    name: member.name,
    role: member.role,
    wecom_user_id: member.wecom_user_id,
    wecom_name: member.wecom_name,
    wecom_avatar: member.wecom_avatar,
    mobile: member.mobile,
    department_id: member.department_id,
  }
  formErrors.value = {}
  drawerVisible.value = true
}

function closeDrawer() {
  drawerVisible.value = false
  editingMember.value = null
}

function validateForm(): boolean {
  const errors: Record<string, string> = {}
  if (!form.value.name.trim()) errors.name = '姓名为必填项'
  if (!form.value.wecom_user_id.trim()) errors.wecom_user_id = '企业微信 UserId 为必填项'
  formErrors.value = errors
  return Object.keys(errors).length === 0
}

async function onDrawerConfirm() {
  if (!validateForm()) return
  try {
    if (editingMember.value) {
      const updated = await updateMember(editingMember.value.id, form.value)
      const idx = members.value.findIndex(m => m.id === updated.id)
      if (idx !== -1) members.value[idx] = updated
    } else {
      const created = await createMember(form.value)
      members.value.push(created)
    }
    closeDrawer()
  } catch (e) {
    console.error('[MembersPage] save error:', e)
    alert((e as Error).message || '保存失败')
  }
}

// 详情抽屉
async function openDetailDrawer(member: Member) {
  detailMember.value = member
  detailDrawerVisible.value = true
  detailLoading.value = true
  detailProjects.value = []
  try {
    const res = await fetchMemberProjects(member.id)
    detailProjects.value = res.data
    memberProjectsCache.value[member.id] = res.data
  } catch (e) {
    console.error('[MembersPage] fetchMemberProjects error:', e)
  } finally {
    detailLoading.value = false
  }
}

function closeDetailDrawer() {
  detailDrawerVisible.value = false
  detailMember.value = null
  detailProjects.value = []
}

// 删除
async function onDeleteMember(member: Member) {
  deleteTargetMember.value = member
  // 先检查是否有关联项目
  const res = await fetchMemberProjects(member.id)
  const projects = res.data
  if (projects.length > 0) {
    deleteHasProjects.value = true
    deleteMemberProjectCount.value = projects.length
  } else {
    deleteHasProjects.value = false
    deleteMemberProjectCount.value = 0
  }
  deleteConfirmVisible.value = true
}

async function onConfirmDelete() {
  if (!deleteTargetMember.value) return
  try {
    await deleteMember(deleteTargetMember.value.id)
    members.value = members.value.filter(m => m.id !== deleteTargetMember.value!.id)
    deleteConfirmVisible.value = false
    deleteTargetMember.value = null
  } catch (e) {
    console.error('[MembersPage] delete error:', e)
    alert((e as Error).message || '删除失败')
  }
}

// 加载成员列表
async function loadMembers() {
  loading.value = true
  try {
    const res = await fetchMembers()
    members.value = res.data
  } catch (e) {
    console.error('[MembersPage] load error:', e)
  } finally {
    loading.value = false
  }
}

onMounted(() => {
  loadMembers()
})
</script>

<style scoped>
.members-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* Header */
.page-header {
  padding: 24px 32px 16px;
  border-bottom: 1px solid var(--border);
  flex-shrink: 0;
}
.page-title-row {
  display: flex;
  align-items: baseline;
  gap: 12px;
  margin-bottom: 16px;
}
.page-title {
  font-size: 22px;
  font-weight: 800;
  color: var(--text-strong);
  margin: 0;
}
.page-subtitle {
  font-size: 13px;
  color: var(--muted);
}
.toolbar {
  display: flex;
  align-items: center;
  gap: 12px;
}
.search-input {
  flex: 1;
  max-width: 280px;
  padding: 7px 14px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--card);
  color: var(--text);
  font-size: 13px;
  outline: none;
  transition: border-color var(--duration-normal);
}
.search-input:focus {
  border-color: var(--accent);
}

/* Members list */
.members-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 10px;
}
.member-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  background: var(--card);
  border: 1px solid var(--border);
  border-radius: var(--radius-md);
  transition: box-shadow var(--duration-normal), border-color var(--duration-normal);
}
.member-card:hover {
  box-shadow: var(--shadow-sm);
  border-color: var(--border-strong);
}
.member-card-left {
  display: flex;
  align-items: center;
  gap: 14px;
  flex: 1;
  min-width: 0;
}
.member-avatar {
  width: 38px;
  height: 38px;
  border-radius: 50%;
  background: var(--accent-subtle);
  color: var(--accent);
  font-weight: 700;
  font-size: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  overflow: hidden;
}
.member-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}
.member-info {
  flex: 1;
  min-width: 0;
}
.member-name-row {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 4px;
  flex-wrap: wrap;
}
.member-name {
  font-size: 14px;
  font-weight: 700;
  color: var(--text-strong);
}
.role-tag {
  font-size: 11px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
}
.role-admin {
  background: rgba(239, 68, 68, 0.12);
  color: #ef4444;
}
.role-member {
  background: var(--bg-accent);
  color: var(--muted);
}
.wecom-badge {
  color: var(--muted);
  display: inline-flex;
  align-items: center;
}
.member-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: var(--muted);
}
.member-projects-count {
  cursor: pointer;
  text-decoration: underline;
  text-decoration-style: dotted;
}
.member-projects-count:hover {
  color: var(--accent);
}
.member-actions {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-shrink: 0;
}
.btn-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 30px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: none;
  color: var(--muted);
  cursor: pointer;
  transition: all var(--duration-normal);
  padding: 0;
}
.btn-icon:hover {
  background: var(--bg-accent);
  color: var(--text);
  border-color: var(--border-strong);
}
.btn-icon.btn-danger:hover {
  background: rgba(239, 68, 68, 0.1);
  color: #ef4444;
  border-color: rgba(239, 68, 68, 0.3);
}

/* Loading / Empty */
.loading-state,
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
.empty-icon { font-size: 40px; opacity: 0.3; }

/* Drawer overlay */
.drawer-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.35);
  z-index: 100;
  display: flex;
  justify-content: flex-end;
}
.drawer-panel {
  width: 400px;
  height: 100%;
  background: var(--card);
  display: flex;
  flex-direction: column;
  transform: translateX(100%);
  transition: transform 0.3s var(--ease-out);
  box-shadow: var(--shadow-lg);
}
.drawer-panel.open {
  transform: translateX(0);
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
  margin: 0;
}
.drawer-close {
  background: none;
  border: none;
  font-size: 16px;
  color: var(--muted);
  cursor: pointer;
  padding: 4px;
  line-height: 1;
}
.drawer-close:hover { color: var(--text); }
.drawer-body {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
}
.drawer-footer {
  padding: 16px 24px;
  border-top: 1px solid var(--border);
  display: flex;
  justify-content: flex-end;
  gap: 10px;
  flex-shrink: 0;
}

/* Form */
.form-group {
  margin-bottom: 18px;
}
.form-label {
  display: block;
  font-size: 13px;
  font-weight: 600;
  color: var(--text);
  margin-bottom: 6px;
}
.form-label.required::after {
  content: ' *';
  color: #ef4444;
}
.form-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  background: var(--bg);
  color: var(--text);
  font-size: 13px;
  outline: none;
  box-sizing: border-box;
  transition: border-color var(--duration-normal);
}
.form-input:focus {
  border-color: var(--accent);
}
.form-error {
  display: block;
  font-size: 11px;
  color: #ef4444;
  margin-top: 4px;
}

/* Project tags in detail drawer */
.project-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}
.project-tag {
  padding: 5px 12px;
  background: var(--accent-subtle);
  color: var(--accent);
  border-radius: var(--radius-full);
  font-size: 12px;
  font-weight: 600;
}

/* Modal */
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.4);
  z-index: 200;
  display: flex;
  align-items: center;
  justify-content: center;
}
.modal-box {
  background: var(--card);
  border-radius: var(--radius-lg);
  padding: 24px;
  width: 360px;
  box-shadow: var(--shadow-lg);
}
.modal-title {
  font-size: 16px;
  font-weight: 700;
  color: var(--text-strong);
  margin: 0 0 12px;
}
.modal-body {
  font-size: 14px;
  color: var(--text);
  margin: 0 0 20px;
  line-height: 1.6;
}
.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 10px;
}

/* Buttons */
.btn-primary {
  padding: 7px 16px;
  background: var(--accent);
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-normal);
  font-family: inherit;
}
.btn-primary:hover { opacity: 0.85; }
.btn-secondary {
  padding: 7px 16px;
  background: var(--bg-accent);
  color: var(--text);
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: all var(--duration-normal);
  font-family: inherit;
}
.btn-secondary:hover {
  background: var(--border);
}
.btn-danger {
  padding: 7px 16px;
  background: #ef4444;
  color: #fff;
  border: none;
  border-radius: var(--radius-sm);
  font-size: 13px;
  font-weight: 600;
  cursor: pointer;
  transition: opacity var(--duration-normal);
  font-family: inherit;
}
.btn-danger:hover { opacity: 0.85; }
</style>
