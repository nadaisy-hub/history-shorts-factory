export async function GET() {
  const keys = [
    'ANTHROPIC_API_KEY',
    'FAL_API_KEY',
    'MODELSLAB_API_KEY',
    'ELEVENLABS_API_KEY',
    'SHOTSTACK_API_KEY',
    'YOUTUBE_CLIENT_ID',
    'YOUTUBE_CLIENT_SECRET',
  ];

  const status: Record<string, boolean> = {};
  for (const key of keys) {
    status[key] = !!process.env[key];
  }

  return Response.json(status);
}
