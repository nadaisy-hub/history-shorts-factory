import { NextRequest } from 'next/server';
import { approveGate } from '@/lib/pipeline';
import { generateImages, generateVideos, generateVoice, assembleVideo } from '@/lib/pipeline';

type RouteParams = { params: Promise<{ id: string }> };

export async function POST(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  try {
    const project = await approveGate(id);

    const autoStepMap: Record<string, (id: string) => Promise<unknown>> = {
      imaging: generateImages,
      animating: generateVideos,
      voicing: generateVoice,
      assembling: assembleVideo,
    };

    const autoFn = autoStepMap[project.status];
    if (autoFn) {
      autoFn(id).catch(console.error);
    }

    return Response.json(project);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '승인 실패' },
      { status: 400 }
    );
  }
}
