import { NextRequest } from 'next/server';
import { getAllProjects, createProject } from '@/lib/storage';

export async function GET() {
  const projects = await getAllProjects();
  return Response.json(projects);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const project = await createProject({
    title: body.title || body.topic,
    topic: body.topic,
    style_preset: body.style_preset || 'oil_painting',
    voice_id: body.voice_id || 'korean_male_narrator',
    duration_sec: body.duration_sec || 55,
  });
  return Response.json(project);
}
