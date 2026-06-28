import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getDatabase, getDocuments, createDocument } from '@/lib/db';

export async function GET(request, { params }) {
  const payload = authenticate(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const collectionId = searchParams.get('collectionId');

  const documents = await getDocuments(params.id, collectionId);
  return NextResponse.json({ documents });
}

export async function POST(request, { params }) {
  const payload = authenticate(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const body = await request.json();
  if (!body.collectionId || !body.data) {
    return NextResponse.json({ error: 'collectionId and data required' }, { status: 400 });
  }

  const doc = await createDocument(params.id, body.collectionId, body.data);
  return NextResponse.json({ document: doc }, { status: 201 });
}
