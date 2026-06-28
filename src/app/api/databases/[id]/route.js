import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getDatabase, updateDatabase, deleteDatabase, getDatabaseStats } from '@/lib/db';

export async function GET(request, { params }) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  // Enrich with live stats from the real NexDb engine
  const stats = await getDatabaseStats(params.id);

  return NextResponse.json({
    database: {
      ...db,
      docCount: stats.docCount,
      storageBytes: stats.storageBytes,
      collectionsCount: stats.collectionsCount,
    },
  });
}

export async function PATCH(request, { params }) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  const body = await request.json();
  const updated = updateDatabase(params.id, body);

  return NextResponse.json({ database: updated });
}

export async function DELETE(request, { params }) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  deleteDatabase(params.id);
  return NextResponse.json({ ok: true });
}
