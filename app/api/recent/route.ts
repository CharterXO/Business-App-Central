import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = verifyAuth(req.headers.get('authorization') || '');
  if (!auth) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  const { appId } = await req.json();
  if (!appId) return NextResponse.json({ error: 'missing appId' }, { status: 400 });
  await sql`insert into user_recent (user_id, app_id, used_at) values (${auth.uid}, ${appId}, now())
           on conflict (user_id, app_id) do update set used_at = excluded.used_at`;
  return NextResponse.json({ ok: true });
}
