// ============================================================
// API — Projects & Tasks (pm-system)
// ============================================================

const API_BASE = 'http://localhost:8000'

// Backend response (snake_case)
interface BackendProject {
  id: string
  name: string
  owner: string
  start_date: string
  end_date: string
  status: string
  description: string
  task_count: number
  completed_count: number
  progress: number
}

interface BackendProjectsResponse {
  data: BackendProject[]
}

// Backend Task (snake_case)
interface BackendTask {
  id: string
  project_id: string
  parent_id: string | null
  title: string
  owner: string
  status: string
  priority: string
  start_date: string
  end_date: string
  completed_at: string | null
  note: string
  subtasks: BackendSubtask[]
}

interface BackendSubtask {
  id: string
  task_id: string
  title: string
  completed: boolean
  completed_at: string | null
}

interface BackendTasksResponse {
  data: BackendTask[]
}

// Frontend interface (camelCase)
export interface Project {
  id: string
  name: string
  owner: string
  startDate: string
  endDate: string
  status: string
  description: string
  taskCount: number
  completedCount: number
  progress: number
}

export interface ProjectsResponse {
  data: Project[]
}

export type TaskStatus = 'open' | 'in-progress' | 'review' | 'done'
export type TaskPriority = 'low' | 'medium' | 'high'

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  completedAt: string | null
}

export interface Task {
  id: string
  projectId: string
  parentId: string | null
  title: string
  owner: string
  status: TaskStatus
  priority: TaskPriority
  startDate: string
  endDate: string
  completedAt: string | null
  note: string
  subtasks: Subtask[]
}

export interface TasksResponse {
  data: Task[]
}

function mapBackendProject(p: BackendProject): Project {
  return {
    id: p.id,
    name: p.name,
    owner: p.owner,
    startDate: p.start_date,
    endDate: p.end_date,
    status: p.status,
    description: p.description,
    taskCount: p.task_count,
    completedCount: p.completed_count,
    progress: p.progress,
  }
}

function mapBackendSubtask(s: BackendSubtask): Subtask {
  return {
    id: s.id,
    taskId: s.task_id,
    title: s.title,
    completed: s.completed,
    completedAt: s.completed_at,
  }
}

function mapBackendTask(t: BackendTask | null): Task {
  if (!t) throw new Error('mapBackendTask received null')
  return {
    id: t.id,
    projectId: t.project_id,
    parentId: t.parent_id,
    title: t.title,
    owner: t.owner,
    status: t.status as TaskStatus,
    priority: t.priority as TaskPriority,
    startDate: t.start_date,
    endDate: t.end_date,
    completedAt: t.completed_at,
    note: t.note,
    subtasks: (t.subtasks || []).map(mapBackendSubtask),
  }
}

export async function createProject(data: {
  name: string
  owner: string
  start_date: string
  end_date: string
  description?: string
}): Promise<Project> {
  const res = await fetch(`${API_BASE}/api/projects`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  const json: any = await res.json()
  if (!res.ok || json.error) {
    throw new Error(json.error || `HTTP ${res.status}`)
  }
  return mapBackendProject(json.data)
}

export async function fetchProjects(): Promise<ProjectsResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/projects`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: BackendProjectsResponse = await res.json()
    return { data: json.data.map(mapBackendProject) }
  } catch (err) {
    console.error('Failed to fetch projects:', err)
    return { data: [] }
  }
}

export async function fetchTasksByProject(projectId: string): Promise<TasksResponse> {
  try {
    const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: BackendTasksResponse = await res.json()
    return { data: json.data.map(mapBackendTask) }
  } catch (err) {
    console.error('Failed to fetch tasks:', err)
    return { data: [] }
  }
}

export async function updateTask(
  id: string,
  data: { title?: string; note?: string; priority?: TaskPriority; end_date?: string }
): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json: BackendTask = await res.json()
  return mapBackendTask(json)
}

export async function createSubtask(taskId: string, title: string): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/tasks/${taskId}/subtasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ title }),
  })
  const json = await res.json()
  if (!res.ok || json.error) {
    console.error('[API] createSubtask error:', json.error)
    throw new Error(json.error || `HTTP ${res.status}`)
  }
  return mapBackendTask(json.data)
}

export async function updateSubtask(subtaskId: string, data: { title?: string; completed?: boolean }): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/subtasks/${subtaskId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return mapBackendTask(json.data)
}

export async function deleteSubtask(subtaskId: string): Promise<Task | null> {
  const res = await fetch(`${API_BASE}/api/subtasks/${subtaskId}`, {
    method: 'DELETE',
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json = await res.json()
  return json.data ? mapBackendTask(json.data) : null
}

export async function updateTaskStatus(id: string, status: string): Promise<Task> {
  const url = `${API_BASE}/api/tasks/${id}/status`
  console.log('[API] PATCH', url, { status })
  try {
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ status }),
    })
    console.log('[API] status:', res.status, res.statusText)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const json: BackendTask = await res.json()
    return mapBackendTask(json)
  } catch (e) {
    console.error('[API] full error:', e, (e as Error)?.message, (e as Error)?.cause)
    throw e
  }
}

export async function createTask(
  projectId: string,
  data: { title: string; priority: TaskPriority; end_date?: string; note?: string }
): Promise<Task> {
  const res = await fetch(`${API_BASE}/api/projects/${projectId}/tasks`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json: any = await res.json()
  if (json.error) throw new Error(json.error as string)
  return mapBackendTask(json.data)
}

export async function toggleSubtask(id: string, completed: boolean): Promise<Subtask> {
  const res = await fetch(`${API_BASE}/api/subtasks/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ completed }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  const json: BackendSubtask = await res.json()
  return mapBackendSubtask(json)
}
