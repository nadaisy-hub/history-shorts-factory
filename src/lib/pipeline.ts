import { v4 as uuid } from 'uuid';
import type { Project, Scene } from './types';
import { AUTO_TRANSITIONS, GATE_TRANSITIONS } from './types';
import { getProject, saveProject, appendJobLog } from './storage';

export async function approveGate(projectId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  const nextStatus = GATE_TRANSITIONS[project.status];
  if (!nextStatus) throw new Error('현재 상태에서 승인할 수 없습니다');

  project.status = nextStatus;
  await saveProject(project);
  return project;
}

export async function generateScript(projectId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  project.status = 'scripting';
  await saveProject(project);

  const startTime = Date.now();

  try {
    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) throw new Error('ANTHROPIC_API_KEY가 설정되지 않았습니다');

    const sceneCount = Math.round(project.duration_sec / 7);
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 4000,
        messages: [
          {
            role: 'user',
            content: `역사 유튜브 쇼츠 대본을 써줘.
주제: ${project.topic}
길이: ${project.duration_sec}초
장면 수: ${sceneCount}개
스타일: ${project.style_preset}

다음 JSON 형식으로만 응답해 (마크다운 코드블록 없이 순수 JSON만):
{
  "title": "쇼츠 제목 (후킹용, 한국어)",
  "scenes": [
    {
      "seq": 1,
      "narration": "나레이션 텍스트 (한국어, 자연스러운 구어체)",
      "image_prompt": "영문 이미지 생성 프롬프트, ${project.style_preset} style, 9:16 vertical composition, cinematic lighting, highly detailed, historical accuracy",
      "duration_sec": 6
    }
  ]
}

주의사항:
- 첫 장면은 시청자를 잡는 후킹 멘트로 시작
- 각 나레이션은 해당 장면의 duration_sec에 맞게 길이 조절
- image_prompt는 반드시 영어로, 구체적인 장면 묘사 포함
- 역사적 사실에 기반하되 흥미롭게 각색`,
          },
        ],
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      throw new Error(`Claude API 오류: ${response.status} ${err}`);
    }

    const data = await response.json();
    const content = data.content[0]?.text || '';
    const parsed = JSON.parse(content);

    project.title = parsed.title || project.title;
    project.scenes = parsed.scenes.map((s: { seq: number; narration: string; image_prompt: string; duration_sec: number }) => ({
      id: uuid(),
      project_id: projectId,
      seq: s.seq,
      narration: s.narration,
      image_prompt: s.image_prompt,
      image_url: null,
      video_url: null,
      duration_sec: s.duration_sec,
      status: 'pending' as const,
    }));

    project.status = AUTO_TRANSITIONS['scripting']!;
    await saveProject(project);

    await appendJobLog({
      project_id: projectId,
      step: 'script',
      provider: 'claude',
      input_tokens: data.usage?.input_tokens,
      output_tokens: data.usage?.output_tokens,
      cost_usd: ((data.usage?.input_tokens || 0) * 0.003 + (data.usage?.output_tokens || 0) * 0.015) / 1000,
      duration_ms: Date.now() - startTime,
      status: 'success',
    });

    return project;
  } catch (error) {
    project.status = 'draft';
    await saveProject(project);

    await appendJobLog({
      project_id: projectId,
      step: 'script',
      provider: 'claude',
      duration_ms: Date.now() - startTime,
      status: 'failed',
      error_msg: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

export async function generateImages(projectId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  project.status = 'imaging';
  await saveProject(project);

  const apiKey = process.env.FAL_API_KEY;
  if (!apiKey) throw new Error('FAL_API_KEY가 설정되지 않았습니다');

  for (const scene of project.scenes) {
    if (scene.image_url) continue;

    scene.status = 'image_generating';
    await saveProject(project);
    const startTime = Date.now();

    try {
      const response = await fetch('https://queue.fal.run/fal-ai/flux-pro/v1.1', {
        method: 'POST',
        headers: {
          Authorization: `Key ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: scene.image_prompt,
          image_size: { width: 1080, height: 1920 },
          num_images: 1,
          safety_tolerance: 2,
        }),
      });

      if (!response.ok) throw new Error(`fal.ai 오류: ${response.status}`);

      const data = await response.json();
      scene.image_url = data.images?.[0]?.url || null;
      scene.status = 'image_done';

      await appendJobLog({
        project_id: projectId,
        step: 'image',
        provider: 'fal',
        cost_usd: 0.03,
        duration_ms: Date.now() - startTime,
        status: 'success',
      });
    } catch (error) {
      scene.status = 'pending';
      await appendJobLog({
        project_id: projectId,
        step: 'image',
        provider: 'fal',
        duration_ms: Date.now() - startTime,
        status: 'failed',
        error_msg: error instanceof Error ? error.message : String(error),
      });
    }

    await saveProject(project);
  }

  project.status = AUTO_TRANSITIONS['imaging']!;
  await saveProject(project);
  return project;
}

export async function generateVideos(projectId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  project.status = 'animating';
  await saveProject(project);

  const apiKey = process.env.MODELSLAB_API_KEY;
  if (!apiKey) throw new Error('MODELSLAB_API_KEY가 설정되지 않았습니다');

  for (const scene of project.scenes) {
    if (scene.video_url || !scene.image_url) continue;

    scene.status = 'video_generating';
    await saveProject(project);
    const startTime = Date.now();

    try {
      const response = await fetch('https://modelslab.com/api/v6/video/kling-3', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          prompt: `Subtle camera zoom in, cinematic movement, ${scene.narration}`,
          image_url: scene.image_url,
          duration: Math.round(scene.duration_sec),
          motion: 'slight_zoom_in',
        }),
      });

      if (!response.ok) throw new Error(`ModelsLab 오류: ${response.status}`);

      const data = await response.json();
      scene.video_url = data.output?.[0] || data.future_links?.[0] || null;
      scene.status = 'video_done';

      await appendJobLog({
        project_id: projectId,
        step: 'video',
        provider: 'modelslab',
        cost_usd: 0.10,
        duration_ms: Date.now() - startTime,
        status: 'success',
      });
    } catch (error) {
      scene.status = 'image_done';
      await appendJobLog({
        project_id: projectId,
        step: 'video',
        provider: 'modelslab',
        duration_ms: Date.now() - startTime,
        status: 'failed',
        error_msg: error instanceof Error ? error.message : String(error),
      });
    }

    await saveProject(project);
  }

  project.status = AUTO_TRANSITIONS['animating']!;
  await saveProject(project);
  return project;
}

export async function generateVoice(projectId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  project.status = 'voicing';
  await saveProject(project);

  const apiKey = process.env.ELEVENLABS_API_KEY;
  if (!apiKey) throw new Error('ELEVENLABS_API_KEY가 설정되지 않았습니다');

  const startTime = Date.now();
  const fullNarration = project.scenes.map((s) => s.narration).join('\n\n');

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${project.voice_id}`,
      {
        method: 'POST',
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: fullNarration,
          model_id: 'eleven_multilingual_v2',
          voice_settings: {
            stability: 0.75,
            similarity_boost: 0.75,
            speed: 1.1,
          },
        }),
      }
    );

    if (!response.ok) throw new Error(`ElevenLabs 오류: ${response.status}`);

    // Save audio locally
    const fs = await import('fs/promises');
    const path = await import('path');
    const audioDir = path.join(process.cwd(), 'data', 'audio');
    await fs.mkdir(audioDir, { recursive: true });
    const audioPath = path.join(audioDir, `${projectId}.mp3`);
    const buffer = Buffer.from(await response.arrayBuffer());
    await fs.writeFile(audioPath, buffer);

    project.output_url = `/api/files/audio/${projectId}.mp3`;
    project.status = AUTO_TRANSITIONS['voicing']!;
    await saveProject(project);

    await appendJobLog({
      project_id: projectId,
      step: 'tts',
      provider: 'elevenlabs',
      cost_usd: 0.15,
      duration_ms: Date.now() - startTime,
      status: 'success',
    });

    return project;
  } catch (error) {
    project.status = 'video_review';
    await saveProject(project);

    await appendJobLog({
      project_id: projectId,
      step: 'tts',
      provider: 'elevenlabs',
      duration_ms: Date.now() - startTime,
      status: 'failed',
      error_msg: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

export async function assembleVideo(projectId: string): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  project.status = 'assembling';
  await saveProject(project);

  const apiKey = process.env.SHOTSTACK_API_KEY;
  if (!apiKey) throw new Error('SHOTSTACK_API_KEY가 설정되지 않았습니다');

  const startTime = Date.now();

  try {
    const totalDuration = project.scenes.reduce((sum, s) => sum + s.duration_sec, 0);
    const timeline = {
      tracks: [
        {
          clips: project.scenes.map((scene, i) => ({
            asset: { type: 'video', src: scene.video_url },
            start: project.scenes.slice(0, i).reduce((sum, s) => sum + s.duration_sec, 0),
            length: scene.duration_sec,
            fit: 'cover',
            transition: { in: 'fade', out: 'fade' },
          })),
        },
        {
          clips: [
            {
              asset: { type: 'audio', src: project.output_url, volume: 1.0 },
              start: 0,
              length: totalDuration,
            },
          ],
        },
      ],
    };

    const response = await fetch('https://api.shotstack.io/edit/v1/render', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        timeline,
        output: { format: 'mp4', resolution: 'hd', aspectRatio: '9:16', fps: 30 },
      }),
    });

    if (!response.ok) throw new Error(`Shotstack 오류: ${response.status}`);

    const data = await response.json();
    project.output_url = data.response?.url || project.output_url;
    project.status = AUTO_TRANSITIONS['assembling']!;
    await saveProject(project);

    await appendJobLog({
      project_id: projectId,
      step: 'assembly',
      provider: 'shotstack',
      cost_usd: 0.05,
      duration_ms: Date.now() - startTime,
      status: 'success',
    });

    return project;
  } catch (error) {
    project.status = 'voice_review';
    await saveProject(project);

    await appendJobLog({
      project_id: projectId,
      step: 'assembly',
      provider: 'shotstack',
      duration_ms: Date.now() - startTime,
      status: 'failed',
      error_msg: error instanceof Error ? error.message : String(error),
    });

    throw error;
  }
}

export async function regenerateScene(
  projectId: string,
  sceneId: string,
  step: 'image' | 'video',
  options?: { newPrompt?: string }
): Promise<Project> {
  const project = await getProject(projectId);
  if (!project) throw new Error('프로젝트를 찾을 수 없습니다');

  const scene = project.scenes.find((s) => s.id === sceneId);
  if (!scene) throw new Error('장면을 찾을 수 없습니다');

  if (options?.newPrompt) {
    scene.image_prompt = options.newPrompt;
  }

  if (step === 'image') {
    scene.image_url = null;
    scene.video_url = null;
    scene.status = 'pending';
  } else {
    scene.video_url = null;
    scene.status = 'image_done';
  }

  await saveProject(project);
  return project;
}
