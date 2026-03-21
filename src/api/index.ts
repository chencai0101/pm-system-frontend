// ============================================================
// API — Projects (pm-system)
// ============================================================

const API_BASE = 'http://localhost:8001'

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
