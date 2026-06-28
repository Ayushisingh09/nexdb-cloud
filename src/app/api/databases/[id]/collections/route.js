import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getDatabase, getCollections, createCollection } from '@/lib/db';

export async function GET(request, { params }) {
  const payload = authenticate(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const collections = await getCollections(params.id);
  return NextResponse.json({ collections });
}

export async function POST(request, { params }) {
  const payload = authenticate(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  const name = body.name?.trim();
  if (!name) return NextResponse.json({ error: 'Name required' }, { status: 400 });

  const existing = (await getCollections(params.id)).find(c => c.name === name);
  if (existing) return NextResponse.json({ error: 'Collection already exists' }, { status: 409 });

  const col = await createCollection(params.id, name);
  return NextResponse.json({ collection: col }, { status: 201 });
}
