import { sql } from '@vercel/postgres';

async function main() {
  await sql`create extension if not exists pgcrypto;`;

  await sql`create table if not exists users (
    id uuid primary key default gen_random_uuid(),
    username text unique not null,
    password_hash text not null,
    role text not null check (role in ('admin','user'))
  )`;

  await sql`create table if not exists apps (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    login_url text not null,
    category text,
    icon_url text,
    description text
  )`;

  await sql`create table if not exists user_recent (
    user_id uuid not null references users(id) on delete cascade,
    app_id uuid not null references apps(id) on delete cascade,
    used_at timestamptz not null default now(),
    primary key (user_id, app_id)
  )`;
}

main().then(()=>{ console.log('Migration complete'); process.exit(0); }).catch(e=>{ console.error(e); process.exit(1); });
