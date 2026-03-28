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

export interface AudioSettings {
  bgm_url: string | null;
  bgm_volume: number;         // 0.0 ~ 1.0 스케일
  narration_volume: number;    // 0.0 ~ 1.0 스케일
  tts_speed: number;           // 0.8 ~ 1.3
  tts_stability: number;       // 0.0 ~ 1.0
  tts_similarity: number;      // 0.0 ~ 1.0
  target_diff_db: number;      // 나레이션 대비 BGM 감소 dB (기본 20)
  auto_balance: boolean;       // LUFS 기반 자동 밸런싱 사용 여부
}

export const DEFAULT_AUDIO_SETTINGS: AudioSettings = {
  bgm_url: null,
  bgm_volume: 0.15,
  narration_volume: 1.0,
  tts_speed: 1.1,
  tts_stability: 0.75,
  tts_similarity: 0.75,
  target_diff_db: 20,
  auto_balance: true,
};

export interface Project {
  id: string;
  title: string;
  topic: string;
  status: ProjectStatus;
  style_preset: StylePreset;
  voice_id: string;
  duration_sec: number;
  output_url: string | null;
  narration_url: string | null;
  youtube_id: string | null;
  created_at: string;
  updated_at: string;
  scenes: Scene[];
  audio_settings: AudioSettings;
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
