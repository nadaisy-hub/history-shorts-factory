import fs from 'fs/promises';
import path from 'path';
import { v4 as uuid } from 'uuid';
import type { Project, JobLog } from './types';
import { DEFAULT_AUDIO_SETTINGS } from './types';

const DATA_DIR = path.join(process.cwd(), 'data', 'projects');

async function ensureDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function projectPath(id: string) {
  return path.join(DATA_DIR, `${id}.json`);
}

export async function getAllProjects(): Promise<Project[]> {
  await ensureDir();
  const files = await fs.readdir(DATA_DIR);
  const projects: Project[] = [];
  for (const file of files) {
    if (!file.endsWith('.json')) continue;
    const raw = await fs.readFile(path.join(DATA_DIR, file), 'utf-8');
    projects.push(JSON.parse(raw));
  }
  return projects.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );
}

export async function getProject(id: string): Promise<Project | null> {
  try {
    const raw = await fs.readFile(projectPath(id), 'utf-8');
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

export async function saveProject(project: Project): Promise<void> {
  await ensureDir();
  project.updated_at = new Date().toISOString();
  await fs.writeFile(projectPath(project.id), JSON.stringify(project, null, 2), 'utf-8');
}

export async function createProject(data: {
  title: string;
  topic: string;
  style_preset: string;
  voice_id: string;
  duration_sec: number;
}): Promise<Project> {
  const project: Project = {
    id: uuid(),
    title: data.title,
    topic: data.topic,
    status: 'draft',
    style_preset: data.style_preset as Project['style_preset'],
    voice_id: data.voice_id,
    duration_sec: data.duration_sec,
    output_url: null,
    narration_url: null,
    youtube_id: null,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    scenes: [],
    audio_settings: { ...DEFAULT_AUDIO_SETTINGS },
  };
  await saveProject(project);
  return project;
}

export async function deleteProject(id: string): Promise<void> {
  try {
    await fs.unlink(projectPath(id));
  } catch {
    // ignore
  }
}

// Job logs stored in a single file
const LOGS_PATH = path.join(process.cwd(), 'data', 'job_logs.json');

export async function appendJobLog(log: Omit<JobLog, 'id' | 'created_at'>): Promise<void> {
  let logs: JobLog[] = [];
  try {
    const raw = await fs.readFile(LOGS_PATH, 'utf-8');
    logs = JSON.parse(raw);
  } catch {
    // file doesn't exist yet
  }
  logs.push({ ...log, id: uuid(), created_at: new Date().toISOString() });
  await fs.writeFile(LOGS_PATH, JSON.stringify(logs, null, 2), 'utf-8');
}

export async function getJobLogs(projectId?: string): Promise<JobLog[]> {
  try {
    const raw = await fs.readFile(LOGS_PATH, 'utf-8');
    const logs: JobLog[] = JSON.parse(raw);
    if (projectId) return logs.filter((l) => l.project_id === projectId);
    return logs;
  } catch {
    return [];
  }
}
