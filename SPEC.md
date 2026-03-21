# pm-system 前端规格文档

## 1. 项目概述

- **项目名称**: pm-system-frontend（数智管理事业部项目管理系统）
- **技术栈**: Vue 3 + Vite + TypeScript
- **样式**: 原生 CSS + CSS Variables（白/暗双主题）

## 2. 页面结构

### 2.1 页面1：部门看板（DepartmentDashboard）

**布局**:
- Header: 左侧 Logo + 标题"数智管理事业部"，右侧白/暗切换按钮
- 主体: Notion 风格卡片墙，CSS Grid 自适应列数

**项目卡片**:
- 整个卡片背景 = 进度条（完成多少填满多少）
- 背景色: accent 色渐变填充到进度%
- 卡片内容: 项目名称(大)、牵头人、截止日期、状态标签

**白/暗切换**:
- 切换按钮在 Header 右侧
- 点击后在 `<html>` 或 `<body>` 加/去掉 `.dark` class
- 所有颜色用 CSS Variables，换 class 即换主题

## 3. 颜色规格（参考 FlowBoard Dashboard）

```css
/* 亮色主题 */
--bg: #ffffff
--bg-accent: #f5f5f5
--card: #ffffff
--text: #1a1a1a
--text-strong: #000000
--muted: #71717a
--border: #e5e5e5
--accent: #ff5c5c

/* 暗色主题 (.dark) */
--bg: #1a1a1a
--bg-accent: #222222
--card: #242424
--text: #e4e4e7
--text-strong: #fafafa
--muted: #71717a
--border: #333333
--accent: #ff5c5c

/* 通用变量 */
--accent: #ff5c5c
--progress-bg: rgba(0,0,0,0.08) / rgba(255,255,255,0.08)
```

## 4. API 格式

```
GET /api/projects

Response:
{
  "data": [
    {
      "id": "P-001",
      "name": "智能体平台",
      "owner": "张三",
      "startDate": "2026-03-01",
      "endDate": "2026-04-15",
      "status": "进行中",
      "description": "",
      "taskCount": 8,
      "completedCount": 3,
      "progress": 0.375
    }
  ]
}
```

## 5. 文件结构

```
pm-system-frontend/
├── SPEC.md
├── index.html
├── vite.config.ts
├── tsconfig.json
├── package.json
├── src/
│   ├── main.ts
│   ├── App.vue
│   ├── styles/
│   │   └── theme.css
│   ├── components/
│   │   ├── Header.vue
│   │   ├── ProjectCard.vue
│   │   ├── DepartmentDashboard.vue
│   │   └── ThemeToggle.vue
│   └── api/
│       └── index.ts
└── public/
```

## 6. 种子数据（硬编码）

- 5个项目
- 每个项目 3-5 个任务
- 进度条随机 0.2 ~ 0.95
