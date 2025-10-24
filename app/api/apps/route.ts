import { NextResponse } from 'next/server';
import { sql } from '@/lib/db';
import { verifyAuth } from '@/lib/auth';

export const runtime = 'nodejs';

export async function GET() {
  const { rows } = await sql`select id, name, login_url, category, icon_url, description from apps order by name`;
  return NextResponse.json(rows);
}

export async function POST(req: Request) {
  const auth = verifyAuth(req.headers.get('authorization') || '');
  if (!auth || auth.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const body = await req.json();
  const { id, name, loginUrl, category, iconUrl, description } = body;
  if (!name || !/^https?:\/\//i.test(loginUrl)) return NextResponse.json({ error: 'invalid input' }, { status: 400 });

  if (id) {
    await sql`update apps set name=${name}, login_url=${loginUrl}, category=${category}, icon_url=${iconUrl}, description=${description} where id=${id}`;
  } else {
    await sql`insert into apps (name, login_url, category, icon_url, description) values (${name}, ${loginUrl}, ${category}, ${iconUrl}, ${description})`;
  }
  return NextResponse.json({ ok: true });
}
