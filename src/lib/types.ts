export type ProjectStatus =
  | 'draft'
  | 'scripting'
  | 'script_review'
  | 'imaging'
  | 'image_review'
  | 'animating'
  | 'video_review'
  | 'voicing'
  | 'voice_review'
  | 'assembling'
  | 'final_review'
  | 'ready'
  | 'published';

export type StylePreset = 'oil_painting' | 'watercolor' | 'cinematic' | 'illustration';

export type SceneStatus =
  | 'pending'
  | 'image_generating'
  | 'image_done'
  | 'video_generating'
  | 'video_done';

export interface Scene {
  id: string;
  project_id: string;
  seq: number;
  narration: string;
  image_prompt: string;
  image_url: string | null;
  video_url: string | null;
  duration_sec: number;
  status: SceneStatus;
}

export interface Project {
  id: string;
  title: string;
  topic: string;
  status: ProjectStatus;
  style_preset: StylePreset;
  voice_id: string;
  duration_sec: number;
  output_url: string | null;
  youtube_id: string | null;
  created_at: string;
  updated_at: string;
  scenes: Scene[];
}

export interface JobLog {
  id: string;
  project_id: string;
  step: 'script' | 'image' | 'video' | 'tts' | 'assembly';
  provider: string;
  input_tokens?: number;
  output_tokens?: number;
  cost_usd?: number;
  duration_ms?: number;
  status: 'success' | 'failed' | 'retrying';
  error_msg?: string;
  created_at: string;
}

export const STYLE_PRESETS: Record<StylePreset, string> = {
  oil_painting: '유화',
  watercolor: '수채화',
  cinematic: '시네마틱',
  illustration: '일러스트',
};

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  draft: '초안',
  scripting: '대본 생성 중',
  script_review: '대본 검수',
  imaging: '이미지 생성 중',
  image_review: '이미지 검수',
  animating: '영상 변환 중',
  video_review: '영상 검수',
  voicing: '음성 생성 중',
  voice_review: '음성 검수',
  assembling: '영상 조립 중',
  final_review: '최종 검수',
  ready: '게시 대기',
  published: '게시됨',
};

export const AUTO_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus>> = {
  scripting: 'script_review',
  imaging: 'image_review',
  animating: 'video_review',
  voicing: 'voice_review',
  assembling: 'final_review',
};

export const GATE_TRANSITIONS: Partial<Record<ProjectStatus, ProjectStatus>> = {
  script_review: 'imaging',
  image_review: 'animating',
  video_review: 'voicing',
  voice_review: 'assembling',
  final_review: 'ready',
  ready: 'published',
};

export const PIPELINE_STEPS = [
  { key: 'script', label: '대본', statuses: ['scripting', 'script_review'] as ProjectStatus[] },
  { key: 'image', label: '이미지', statuses: ['imaging', 'image_review'] as ProjectStatus[] },
  { key: 'video', label: '영상', statuses: ['animating', 'video_review'] as ProjectStatus[] },
  { key: 'voice', label: '음성', statuses: ['voicing', 'voice_review'] as ProjectStatus[] },
  { key: 'assembly', label: '조립', statuses: ['assembling', 'final_review'] as ProjectStatus[] },
  { key: 'publish', label: '게시', statuses: ['ready', 'published'] as ProjectStatus[] },
];
