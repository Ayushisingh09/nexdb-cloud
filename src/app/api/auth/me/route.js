import { NextResponse } from 'next/server';
import { authenticate } from '@/lib/auth';
import { findUserById, getUserDatabases } from '@/lib/db';

export async function GET(request) {
  const payload = authenticate(request);
  if (!payload) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const user = findUserById(payload.id);
  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 });
  }

  const databases = getUserDatabases(user.id);

  return NextResponse.json({
    user: { id: user.id, email: user.email, name: user.name },
    databases,
  });
}
