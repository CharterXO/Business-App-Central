import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const auth = verifyAuth(req.headers.get('authorization') || '');
  if (!auth || auth.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  await sql`delete from apps where id=${params.id}`;
  return NextResponse.json({ ok: true });
}
