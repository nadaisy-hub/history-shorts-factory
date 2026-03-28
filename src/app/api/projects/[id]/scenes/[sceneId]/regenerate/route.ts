import { NextRequest } from 'next/server';
import { regenerateScene } from '@/lib/pipeline';

type RouteParams = { params: Promise<{ id: string; sceneId: string }> };

export async function POST(request: NextRequest, { params }: RouteParams) {
  const { id, sceneId } = await params;
  const { step, newPrompt } = await request.json();

  try {
    const project = await regenerateScene(id, sceneId, step, { newPrompt });
    return Response.json(project);
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : '재생성 실패' },
      { status: 500 }
    );
  }
}
