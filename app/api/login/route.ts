import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import bcrypt from 'bcryptjs';
import { signToken } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const { username, password } = await req.json();
  if (!username || !password) return NextResponse.json({ error: 'Missing' }, { status: 400 });
  const { rows } = await sql`select id, password_hash, role from users where username=${username}`;
  const user = rows[0];
  if (!user) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  const ok = await bcrypt.compare(password, user.password_hash);
  if (!ok) return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });

  const token = signToken({ uid: user.id, role: user.role, username });
  return NextResponse.json({ token, username, role: user.role });
}
