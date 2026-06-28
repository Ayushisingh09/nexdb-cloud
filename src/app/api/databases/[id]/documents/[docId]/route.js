import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { getDatabase, deleteDocument } from '@/lib/db';

export async function DELETE(request, { params }) {
  const payload = authenticate(request);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const db = getDatabase(params.id);
  if (!db || db.userId !== payload.id) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const { searchParams } = new URL(request.url);
  const collectionId = searchParams.get('collectionId');
  if (!collectionId) return NextResponse.json({ error: 'collectionId required' }, { status: 400 });

  const deleted = await deleteDocument(params.id, collectionId, params.docId);
  if (!deleted) return NextResponse.json({ error: 'Document not found' }, { status: 404 });

  return NextResponse.json({ ok: true });
}
