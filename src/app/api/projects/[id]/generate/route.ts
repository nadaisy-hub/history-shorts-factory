import { NextRequest } from 'next/server';
import { generateScript, generateImages, generateVideos, generateVoice, assembleVideo } from '@/lib/pipeline';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const { step } = await request.json();

  try {
    const stepMap: Record<string, (id: string) => Promise<unknown>> = {
      script: generateScript,
      image: generateImages,
      video: generateVideos,
      voice: generateVoice,
      assembly: assembleVideo,
    };

    const fn = stepMap[step];
    if (!fn) {
      return Response.json({ error: `알 수 없는 단계: ${step}` }, { status: 400 });
    }

    const project = await fn(id);
    return Response.json(project);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '생성 실패' },
      { status: 500 }
    );
  }
}
