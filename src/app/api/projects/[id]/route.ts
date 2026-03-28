import { NextRequest } from 'next/server';
import { getProject, saveProject, deleteProject } from '@/lib/storage';

type RouteParams = { params: Promise<{ id: string }> };

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return Response.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 });
  return Response.json(project);
}

export async function PATCH(request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  const project = await getProject(id);
  if (!project) return Response.json({ error: '프로젝트를 찾을 수 없습니다' }, { status: 404 });

  const updates = await request.json();
  Object.assign(project, updates);
  await saveProject(project);
  return Response.json(project);
}

export async function DELETE(_request: NextRequest, { params }: RouteParams) {
  const { id } = await params;
  await deleteProject(id);
  return Response.json({ ok: true });
}
