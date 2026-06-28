import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getUserApiKeys, createApiKey, revokeApiKey } from '@/lib/db';

export async function GET(request) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const keys = getUserApiKeys(payload.id);
  return NextResponse.json({ keys });
}

export async function POST(request) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { label } = await request.json();
  const key = createApiKey(payload.id, label || 'API Key');
  return NextResponse.json({ key }, { status: 201 });
}

export async function DELETE(request) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await request.json();
  revokeApiKey(id);
  return NextResponse.json({ ok: true });
}
