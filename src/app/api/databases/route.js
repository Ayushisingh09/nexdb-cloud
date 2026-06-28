import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getUserDatabases, createDatabase, getDatabaseStats } from '@/lib/db';

export async function GET(request) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const databases = getUserDatabases(payload.id);

  // Enrich with live stats from the real NexDb engine
  const enriched = await Promise.all(databases.map(async (db) => {
    const stats = await getDatabaseStats(db.id);
    return {
      ...db,
      docCount: stats.docCount,
      storageBytes: stats.storageBytes,
      collectionsCount: stats.collectionsCount,
    };
  }));

  return NextResponse.json({ databases: enriched });
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
