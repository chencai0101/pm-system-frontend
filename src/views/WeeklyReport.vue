<template>
  <div class="report-page">
    <!-- Week bookmark -->
    <div class="report-bookmark">
      <span class="bookmark-arrow" @click="prevWeek">‹</span>
      <span class="bookmark-text">{{ weekLabel || '加载中…' }}</span>
      <span class="bookmark-arrow" v-show="weekOffset < 1" @click="nextWeek">›</span>
    </div>

    <!-- Three columns -->
    <div class="report-columns">
      <!-- Column 1: 预期 -->
      <div class="report-column">
        <div class="column-header">
          <span class="column-icon">⏰</span>
          <span class="column-title">逾期</span>
          <span class="column-count">{{ alerts.length }}</span>
        </div>
        <div class="column-body">
          <div v-if="alerts.length === 0" class="empty-hint">暂无逾期预警</div>
          <div
            v-for="item in alerts"
            :key="item.id"
            class="report-item"
            :class="{ overdue: item.overdue }"
          >
            <div class="item-top">
              <span class="item-project">{{ item.project_name }}</span>
              <span class="item-badge" :class="item.overdue ? 'badge-overdue' : 'badge-warning'">
                {{ item.overdue ? '已延期' : `距到期${item.days_left}天` }}
              </span>
            </div>
            <div v-if="item.tags && item.tags.length" class="item-tags">
              <span v-for="tag in item.tags" :key="tag" class="item-tag">{{ tag }}</span>
            </div>
            <div class="item-task">{{ item.task_title }}</div>
            <div class="item-owner">{{ item.owner }} 负责</div>
          </div>
        </div>
      </div>

      <!-- Column 2: 进展 -->
      <div class="report-column">
        <div class="column-header">
          <span class="column-icon">✅</span>
          <span class="column-title">进展</span>
          <span class="column-count">{{ progress.length }}</span>
        </div>
        <div class="column-body">
          <div v-if="progress.length === 0" class="empty-hint">暂无进展记录</div>
          <div
            v-for="item in progress"
            :key="item.id"
            class="report-item"
          >
            <!-- 项目名独占一行 -->
            <div class="item-top">
              <span class="item-project">{{ item.project_name }}</span>
            </div>
            <!-- 进度条独占一行 -->
            <div class="progress-row">
              <div class="item-progress-bar">
                <div class="item-progress-fill" :style="{ width: item.progress_pct + '%' }" />
              </div>
              <span class="item-pct">{{ Math.round(item.progress_pct) }}%</span>
            </div>
            <div v-if="item.tags && item.tags.length" class="item-tags">
              <span v-for="tag in item.tags" :key="tag" class="item-tag">{{ tag }}</span>
            </div>

            <!-- 已完成任务 -->
            <div v-if="item.done_tasks.length" class="task-group">
              <div class="task-group-label">已完成</div>
              <div class="task-list">
                <div v-for="t in item.done_tasks" :key="t.id" class="task-row task-row-done">
                  <span class="task-row-title">{{ t.title }}</span>
                  <span class="task-row-done-badge">✓</span>
                </div>
              </div>
            </div>

            <!-- 执行中任务 -->
            <div v-if="item.running_tasks.length" class="task-group">
              <div class="task-group-label">执行中</div>
              <div class="task-list">
                <div v-for="t in item.running_tasks" :key="t.id" class="task-row task-row-running">
                  <div class="task-row-top">
                    <span class="task-row-title">{{ t.title }}</span>
                    <span class="task-row-pct">{{ Math.round(t.progress_pct) }}%</span>
                  </div>
                  <div class="task-row-progress">
                    <div class="task-row-progress-fill" :style="{ width: t.progress_pct + '%' }" />
                  </div>
                </div>
              </div>
            </div>

            <!-- 备注 -->
            <div class="item-note-box">
              <span class="note-label">备注</span>
              <div class="note-content">{{ item.note || '（待AI自动生成）' }}</div>
            </div>
          </div>
        </div>
      </div>

      <!-- Column 3: 新增 -->
      <div class="report-column">
        <div class="column-header">
          <span class="column-icon">🆕</span>
          <span class="column-title">新增</span>
          <span class="column-count">{{ recent.length }}</span>
        </div>
        <div class="column-body">
          <div v-if="recent.length === 0" class="empty-hint">近7日无新增任务</div>
          <div
            v-for="item in recent"
            :key="item.id"
            class="report-item"
          >
            <div class="item-top">
              <span class="item-project">{{ item.project_name }}</span>
              <span class="item-date">{{ item.created_date }}</span>
            </div>
            <div v-if="item.tags && item.tags.length" class="item-tags">
              <span v-for="tag in item.tags" :key="tag" class="item-tag">{{ tag }}</span>
            </div>
            <div class="item-task">{{ item.task_title }}</div>
            <div class="item-owner">{{ item.owner }} 负责</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { fetchWeeklyReport, type WeeklyReport } from '../api/index'

const weekLabel = ref('')
const weekStart = ref('')
const weekEnd = ref('')
const alerts = ref<any[]>([])
const progress = ref<any[]>([])
const recent = ref<any[]>([])
const weekOffset = ref(1)

async function loadReport() {
  const { data, error } = await fetchWeeklyReport(weekOffset.value)
  if (error || !data) {
    console.error('周报加载失败:', error)
    return
  }
  weekLabel.value = data.week_label
  weekStart.value = data.week_start
  weekEnd.value = data.week_end
  alerts.value = data.alerts
  progress.value = data.progress
  recent.value = data.recent
}

function prevWeek() {
  weekOffset.value--
  loadReport()
}

function nextWeek() {
  if (weekOffset.value < 1) {
    weekOffset.value++
    loadReport()
  }
}

onMounted(() => {
  loadReport()
})
</script>


<style scoped>
.report-page {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* ── Week bookmark ─────────────────────────────────── */

.report-bookmark {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 16px;
  padding: 5px 0;
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
  background: var(--bg);
}

.bookmark-arrow {
  font-size: 16px;
  color: var(--muted);
  cursor: pointer;
  transition: color 0.15s;
  line-height: 1;
}

.bookmark-arrow:hover {
  color: var(--accent);
}

.bookmark-text {
  font-size: 12px;
  font-family: "JetBrains Mono", monospace;
  color: var(--text);
  letter-spacing: 0.02em;
}


.report-columns {
  display: flex;
  flex: 1;
  gap: 0;
  overflow: hidden;
}

.report-column {
  flex: 1;
  display: flex;
  flex-direction: column;
  border-right: 1px solid var(--border);
  min-width: 0;
}

.report-column:last-child {
  border-right: none;
}

.column-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 14px 20px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  flex-shrink: 0;
  background: rgba(255, 255, 255, 0.04);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
}

.column-icon {
  font-size: 14px;
}

.column-title {
  font-size: 13px;
  font-weight: 700;
  color: var(--text-strong);
}

.column-count {
  margin-left: auto;
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--muted);
  background: var(--bg-accent);
  padding: 1px 7px;
  border-radius: var(--radius-full);
}

.column-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.empty-hint {
  font-size: 13px;
  color: var(--muted);
  text-align: center;
  padding: 32px 0;
  font-style: italic;
}

/* ── Item card ──────────────────────────────────────── */

.report-item {
  padding: 14px 16px;
  border: 1px solid var(--border-strong);
  border-radius: var(--radius-md);
  background: var(--bg-accent);
  display: flex;
  flex-direction: column;
  gap: 6px;
  transition: border-color 0.15s, box-shadow 0.15s;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
}

.report-item:hover {
  border-color: rgba(255, 255, 255, 0.28);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

.report-item.overdue {
  border-left: 3px solid #ef4444;
}

.item-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
  margin-bottom: 6px;
}

.item-tag {
  font-size: 10px;
  font-weight: 600;
  padding: 2px 8px;
  border-radius: var(--radius-full);
  background: var(--accent-subtle);
  color: var(--accent);
  border: 1px solid rgba(79, 143, 234, 0.2);
}

.item-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-project {
  font-size: 15px;
  font-weight: 700;
  color: var(--text-strong);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: 200px;
}

.item-badge {
  font-size: 10px;
  font-weight: 700;
  padding: 2px 7px;
  border-radius: var(--radius-full);
  white-space: nowrap;
  flex-shrink: 0;
}

.badge-warning {
  background: rgba(240, 192, 0, 0.15);
  color: #f0c000;
}

.badge-overdue {
  background: rgba(239, 68, 68, 0.15);
  color: #ef4444;
}

.badge-done {
  background: rgba(34, 197, 94, 0.15);
  color: #22c55e;
}

.item-task {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.4;
}

.item-owner,
.item-date,
.item-meta {
  font-size: 11px;
  color: var(--muted);
  font-family: "JetBrains Mono", monospace;
}

.item-progress-bar {
  flex: 1;
  height: 4px;
  background: var(--bg-accent);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.item-progress-fill {
  height: 100%;
  background: linear-gradient(to right, var(--accent-deep), var(--accent));
  border-radius: var(--radius-full);
  transition: width 0.5s var(--ease-out);
}

.item-pct {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--accent);
  font-weight: 600;
  min-width: 34px;
  text-align: right;
}

.progress-row {
  display: flex;
  align-items: center;
  gap: 8px;
}

.item-summary {
  font-size: 12px;
  color: var(--text);
  line-height: 1.5;
  padding: 6px 0;
  border-top: 1px dashed var(--border);
  margin-top: 4px;
}

.empty-summary {
  color: var(--muted);
  font-style: italic;
}

.item-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.item-note-box {
  margin-top: 6px;
  border: 1px solid var(--border);
  border-radius: var(--radius-sm);
  overflow: hidden;
}

.note-label {
  display: block;
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  padding: 4px 10px;
  background: var(--bg-accent);
  border-bottom: 1px solid var(--border);
}

.note-content {
  font-size: 12px;
  color: var(--text);
  padding: 8px 10px;
  min-height: 36px;
  line-height: 1.5;
}

/* ── Task rows — matches TaskCard style ────────────── */

.task-group {
  margin-top: 8px;
}

.task-group-label {
  font-size: 10px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.06em;
  color: var(--muted);
  margin-bottom: 5px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.task-row {
  padding: 7px 10px;
  border-radius: var(--radius-sm);
  background: rgba(255, 255, 255, 0.05);
  border-left: 3px solid;
  display: flex;
  flex-direction: column;
  gap: 5px;
  transition: box-shadow 0.15s;
}

.task-row:hover {
  box-shadow: var(--shadow-sm);
}

.task-row-done {
  border-left-color: #22c55e;
  background: rgba(34, 197, 94, 0.08);
  flex-direction: row;
  align-items: center;
}

.task-row-running {
  border-left-color: var(--accent);
  background: rgba(79, 143, 234, 0.06);
}

.task-row-top {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
}

.task-row-title {
  font-size: 13px;
  font-weight: 600;
  color: var(--text-strong);
  line-height: 1.3;
  flex: 1;
  min-width: 0;
}

.task-row-done-badge {
  font-size: 12px;
  color: #22c55e;
  flex-shrink: 0;
}

.task-row-pct {
  font-size: 11px;
  font-family: "JetBrains Mono", monospace;
  color: var(--accent);
  font-weight: 700;
  flex-shrink: 0;
}

.task-row-progress {
  height: 3px;
  background: rgba(255, 255, 255, 0.1);
  border-radius: var(--radius-full);
  overflow: hidden;
}

.task-row-progress-fill {
  height: 100%;
  background: var(--accent);
  border-radius: var(--radius-full);
}
</style>
