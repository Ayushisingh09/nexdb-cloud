import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getUserDatabases, createDatabase } from '@/lib/db';

export async function GET(request) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const databases = getUserDatabases(payload.id);
  return NextResponse.json({ databases });
}

export async function POST(request) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { name } = await request.json();
  const db = createDatabase(payload.id, name);
  return NextResponse.json({ database: db }, { status: 201 });
}
