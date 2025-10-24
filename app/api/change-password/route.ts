import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';
import bcrypt from 'bcryptjs';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = verifyAuth(req.headers.get('authorization') || '');
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { current, next, confirm } = await req.json();

  if (!current || !next || !confirm) return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  if (String(next).length < 6) return NextResponse.json({ error: 'New password must be at least 6 characters' }, { status: 400 });
  if (next !== confirm) return NextResponse.json({ error: 'New passwords do not match' }, { status: 400 });

  const { rows } = await sql`select password_hash from users where id=${auth.uid}`;
  const u = rows[0];
  if (!u) return NextResponse.json({ error: 'user not found' }, { status: 404 });
  const ok = await bcrypt.compare(current, u.password_hash);
  if (!ok) return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 });

  const hash = await bcrypt.hash(next, 10);
  await sql`update users set password_hash=${hash} where id=${auth.uid}`;
  return NextResponse.json({ ok: true });
}
