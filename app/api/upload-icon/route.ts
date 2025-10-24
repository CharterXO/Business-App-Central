import { NextResponse } from 'next/server';
import { verifyAuth } from '@/lib/auth';
import { put } from '@vercel/blob';

export const runtime = 'nodejs';

export async function POST(req: Request) {
  const auth = verifyAuth(req.headers.get('authorization') || '');
  if (!auth || auth.role !== 'admin') return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  const form = await req.formData();
  const file = form.get('file') as File | null;
  if (!file) return NextResponse.json({ error: 'missing file' }, { status: 400 });

  const key = `app-icons/${crypto.randomUUID()}-${file.name}`;
  const blob = await put(key, file, { access: 'public' });
  return NextResponse.json({ url: blob.url });
}
