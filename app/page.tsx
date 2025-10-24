'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Role = 'admin' | 'user';

type AppItem = {
  id: string;
  name: string;
  login_url: string;
  description?: string | null;
  category?: string | null;
  icon_url?: string | null;
};

type Session = { token: string; username: string; role: Role } | null;

function Tile({ app, onOpen }: { app: AppItem; onOpen: (a: AppItem) => void }) {
  const hrefOk = /^https?:\/\//i.test(app.login_url);
  return (
    <a
      href={hrefOk ? app.login_url : undefined}
      target={hrefOk ? '_blank' : undefined}
      rel={hrefOk ? 'noopener noreferrer' : undefined}
      onClick={(e) => { if (!hrefOk) e.preventDefault(); onOpen(app); }}
      className="block text-left rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:shadow-md transition"
    >
      <div className="size-10 rounded-md bg-slate-100 grid place-items-center overflow-hidden">
        {app.icon_url ? <img src={app.icon_url} alt={app.name} className="object-cover w-full h-full"/> : <span className="text-slate-500 font-semibold">{app.name.charAt(0)}</span>}
      </div>
      <div className="mt-3 font-semibold text-sm">{app.name}</div>
      <div className="text-xs text-slate-500">{app.description}</div>
    </a>
  );
}

export default function Page() {
  const [session, setSession] = useState<Session>(null);
  const [apps, setApps] = useState<AppItem[]>([]);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showRecent, setShowRecent] = useState(false);
  const [showAdmin, setShowAdmin] = useState(false);
  const [showPw, setShowPw] = useState(false);
  const [err, setErr] = useState('');

  const [lu, setLu] = useState('admin');
  const [lp, setLp] = useState('admin123');

  const [editing, setEditing] = useState<AppItem | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const categories = useMemo(() => Array.from(new Set(apps.map(a => a.category).filter(Boolean))) as string[], [apps]);

  const filtered = useMemo(() => {
    return apps.filter(a => {
      const s = query.toLowerCase();
      const matchQ = !s || a.name.toLowerCase().includes(s) || (a.description||'').toLowerCase().includes(s);
      const matchC = !activeCategory || (a.category||'') === activeCategory;
      return matchQ && matchC;
    });
  }, [apps, query, activeCategory]);

  async function fetchApps() {
    const res = await fetch('/api/apps', { cache: 'no-store' });
    if (res.ok) { setApps(await res.json()); }
  }

  async function onOpen(app: AppItem) {
    if (session) {
      await fetch('/api/recent', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.token }, body: JSON.stringify({ appId: app.id }) });
    }
  }

  async function login(u: string, p: string) {
    const res = await fetch('/api/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ username: u, password: p }) });
    if (!res.ok) throw new Error('Invalid credentials');
    const data = await res.json();
    setSession({ token: data.token, username: data.username, role: data.role });
  }

  async function logout() {
    setSession(null);
  }

  async function submitApp() {
    if (!session) return;
    const body: any = {
      id: editing?.id,
      name: (document.getElementById('appName') as HTMLInputElement).value.trim(),
      loginUrl: (document.getElementById('appUrl') as HTMLInputElement).value.trim(),
      category: (document.getElementById('appCat') as HTMLInputElement).value.trim(),
      description: (document.getElementById('appDesc') as HTMLTextAreaElement).value.trim(),
      iconUrl: editing?.icon_url || null,
    };
    const file = fileRef.current?.files?.[0];
    if (file) {
      const fd = new FormData();
      fd.append('file', file);
      const up = await fetch('/api/upload-icon', { method: 'POST', headers: { 'Authorization': 'Bearer ' + session.token }, body: fd });
      if (!up.ok) throw new Error('Icon upload failed');
      const j = await up.json();
      body.iconUrl = j.url;
    }
    const res = await fetch('/api/apps', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.token }, body: JSON.stringify(body)});
    if (!res.ok) throw new Error('Save failed');
    setEditing(null);
    if (fileRef.current) fileRef.current.value='';
    await fetchApps();
  }

  async function deleteApp(id: string) {
    if (!session) return;
    const res = await fetch('/api/apps/' + id, { method: 'DELETE', headers: { 'Authorization': 'Bearer ' + session.token } });
    if (res.ok) await fetchApps();
  }

  async function changePassword() {
    if (!session) return;
    const cur = (document.getElementById('pwCur') as HTMLInputElement).value;
    const n1 = (document.getElementById('pwNew') as HTMLInputElement).value;
    const n2 = (document.getElementById('pwNew2') as HTMLInputElement).value;
    const res = await fetch('/api/change-password', { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + session.token }, body: JSON.stringify({ current: cur, next: n1, confirm: n2 }) });
    const j = await res.json();
    if (!res.ok) throw new Error(j.error || 'Change failed');
    setShowPw(false);
    alert('Password changed.');
  }

  useEffect(() => { fetchApps(); }, []);

  async function handleLogin() {
    try { setErr(''); await login(lu, lp); } catch(e: any){ setErr(e.message || 'Invalid'); }
  }

  return (
    <div className="min-h-screen bg-slate-100">
      <div className="mx-auto max-w-[1200px] grid grid-cols-1 md:grid-cols-[16rem_1fr]">
        <aside className="hidden md:block w-64 border-r bg-slate-50">
          <div className="flex items-center gap-2 px-4 h-14 border-b">
            <div className="size-6 rounded-md bg-gradient-to-br from-blue-600 to-blue-400" />
            <div className="font-semibold">My Apps</div>
          </div>
          <nav className="p-3">
            <div className="space-y-1 mb-3">
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50" onClick={()=>{ setActiveCategory(null); setShowRecent(false); }}>🏠 My Apps</button>
              <button className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50" onClick={()=>{ setShowRecent(true); setActiveCategory(null); }}>🕑 Recently used</button>
            </div>
            <div className="uppercase text-[11px] tracking-wide text-slate-500 px-3 mb-2">Sections</div>
            <div className="space-y-1">
              {Array.from(new Set(apps.map(a=>a.category).filter(Boolean))).map((c: any) => (
                <button key={c} onClick={()=>{ setActiveCategory(c); setShowRecent(false); }} className="w-full text-left px-3 py-2 rounded-lg hover:bg-blue-50">{c}</button>
              ))}
            </div>
          </nav>
        </aside>

        <main className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="relative flex-1">
              <input value={query} onChange={(e)=>setQuery(e.target.value)} placeholder="Search your apps" className="w-full rounded-full border border-slate-200 bg-white pl-10 pr-3 py-2 outline-none focus:ring-4 focus:ring-blue-100"/>
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">🔍</span>
            </div>
            {session ? (
              <div className="flex items-center gap-2 text-sm relative">
                <span className="text-slate-500">Signed in as</span>
                <span className="font-medium">{session.username}{session.role==='admin'?' (admin)':''}</span>
                {session.role==='admin' && <button className="rounded-lg border px-3 py-1.5" onClick={()=>setShowAdmin(true)}>Admin</button>}
                <button className="rounded-lg border px-3 py-1.5" onClick={()=>setShowPw(true)}>⚙️</button>
                <button className="rounded-lg border px-3 py-1.5 text-rose-700" onClick={logout}>Log out</button>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-sm">
                <input value={lu} onChange={e=>setLu(e.target.value)} className="rounded-lg border px-2 py-1" placeholder="username" />
                <input type="password" value={lp} onChange={e=>setLp(e.target.value)} className="rounded-lg border px-2 py-1" placeholder="password" />
                <button className="rounded-lg border px-3 py-1.5" onClick={handleLogin}>Sign in</button>
                <span className="text-rose-600 text-xs min-h-4">{err}</span>
              </div>
            )}
          </div>

          {filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed p-10 text-center text-slate-500 bg-white">No apps match your filters.</div>
          ) : (
            <div className="grid grid-cols-[repeat(auto-fill,minmax(10rem,1fr))] gap-3">
              {filtered.map(app => <Tile key={app.id} app={app} onOpen={onOpen} />)}
            </div>
          )}

          {showAdmin && session?.role==='admin' && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
              <div className="w-[720px] max-w-[95vw] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Manage Apps</h2>
                  <button className="rounded-lg border px-3 py-1.5" onClick={()=>{ setShowAdmin(false); setEditing(null); if(fileRef.current) fileRef.current.value=''; }}>Close</button>
                </div>
                <div className="grid md:grid-cols-2 gap-3 mb-3">
                  <input id="appName" defaultValue={editing?.name ?? ''} placeholder="App name" className="rounded-xl border border-slate-200 px-3 py-2"/>
                  <input id="appUrl" defaultValue={editing?.login_url ?? ''} placeholder="Login URL (https://...)" className="rounded-xl border border-slate-200 px-3 py-2"/>
                  <input id="appCat" defaultValue={editing?.category ?? ''} placeholder="Category" className="rounded-xl border border-slate-200 px-3 py-2"/>
                  <input id="appIcon" type="file" ref={fileRef} accept="image/*" className="rounded-xl border border-slate-200 px-3 py-2"/>
                </div>
                <textarea id="appDesc" defaultValue={editing?.description ?? ''} placeholder="Short description" className="w-full rounded-xl border border-slate-200 px-3 py-2 mb-3" rows={2}/>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-sm text-slate-500">{editing ? 'Editing app' : 'Add a new app'}</span>
                  <div className="flex gap-2">
                    <button onClick={submitApp} className="rounded-xl bg-blue-600 text-white px-3 py-1.5">Add / Update</button>
                  </div>
                </div>
                <div className="max-h-64 overflow-auto rounded-xl border">
                  {apps.map(a => (
                    <div key={a.id} className="flex items-center justify-between px-3 py-2 border-b last:border-b-0">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="size-6 rounded-md bg-slate-100 overflow-hidden grid place-items-center">
                          {a.icon_url ? <img src={a.icon_url} className="object-cover w-full h-full"/> : <span className="text-xs text-slate-500 font-semibold">{a.name.charAt(0)}</span>}
                        </div>
                        <div className="min-w-0">
                          <div className="font-medium truncate max-w-[320px]">{a.name}</div>
                          <div className="text-xs text-slate-500 truncate max-w-[420px]">{a.login_url}</div>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button className="rounded-lg border px-2 py-1" onClick={()=>setEditing(a)}>Edit</button>
                        <button className="rounded-lg border px-2 py-1 text-rose-600" onClick={()=>deleteApp(a.id)}>Delete</button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {showPw && session && (
            <div className="fixed inset-0 z-50 grid place-items-center bg-black/40">
              <div className="w-[480px] max-w-[92vw] rounded-2xl border border-slate-200 bg-white p-6 shadow-xl">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-lg font-semibold">Change Password</h2>
                  <button className="rounded-lg border px-3 py-1.5" onClick={()=>setShowPw(false)}>Close</button>
                </div>
                <div className="grid gap-3">
                  <input id="pwCur" type="password" placeholder="Current password" className="rounded-xl border border-slate-200 px-3 py-2"/>
                  <input id="pwNew" type="password" placeholder="New password (min 6)" className="rounded-xl border border-slate-200 px-3 py-2"/>
                  <input id="pwNew2" type="password" placeholder="Confirm new password" className="rounded-xl border border-slate-200 px-3 py-2"/>
                  <button onClick={changePassword} className="rounded-xl bg-blue-600 text-white px-3 py-2">Save</button>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
