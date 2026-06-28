import { NextResponse } from 'next/server';
import { createUser } from '@/lib/db';
import { signToken } from '@/lib/auth';

export async function POST(request) {
  try {
    const { email, password, name } = await request.json();
    if (!email || !password || !name) {
      return NextResponse.json({ error: 'Name, email, and password required' }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: 'Password must be at least 6 characters' }, { status: 400 });
    }

    const result = createUser(email, password, name);
    if (!result) {
      return NextResponse.json({ error: 'Email already registered' }, { status: 409 });
    }

    const token = signToken({ id: result.user.id, email: result.user.email, name: result.user.name });

    const response = NextResponse.json({
      token,
      user: result.user,
      databases: result.databases,
    });

    response.cookies.set('nexdb_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/',
    });

    return response;
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
