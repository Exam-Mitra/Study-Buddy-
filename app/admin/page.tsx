'use client';

import { useEffect, useMemo, useState } from 'react';
import { supabaseBrowser } from '@/lib/supabase';

type Row = { id: string; title: string; type: string; source_url: string; is_published: boolean; created_at: string };

export default function AdminPage() {
  const supabase = useMemo(() => supabaseBrowser(), []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [logged, setLogged] = useState(false);
  const [rows, setRows] = useState<Row[]>([]);
  const [sourceUrl, setSourceUrl] = useState('https://app.studyratna.org/');
  const [log, setLog] = useState('');

  async function refresh() {
    const { data } = await supabase.from('resources').select('id,title,type,source_url,is_published,created_at').order('created_at', { ascending: false }).limit(100);
    setRows((data || []) as Row[]);
  }

  useEffect(() => { supabase.auth.getSession().then(({data}) => { if (data.session) { setLogged(true); refresh(); } }); }, []);

  async function login(e: React.FormEvent) {
    e.preventDefault();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setLog(error.message);
    setLogged(true); refresh();
  }

  async function runImport() {
    setLog('Import running...');
    const res = await fetch('/api/import/studyratna', { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}` }, body: JSON.stringify({ sourceUrl, autoPublish: false }) });
    const json = await res.json();
    setLog(JSON.stringify(json, null, 2));
    refresh();
  }

  async function toggle(id: string, is_published: boolean) {
    await supabase.from('resources').update({ is_published: !is_published }).eq('id', id);
    refresh();
  }

  async function remove(id: string) {
    if (!confirm('Delete this item?')) return;
    await supabase.from('resources').delete().eq('id', id);
    refresh();
  }

  if (!logged) return <main className="container section"><div className="panel"><h1>Admin Login</h1><form className="form" onSubmit={login}><input className="input" placeholder="Email" value={email} onChange={e=>setEmail(e.target.value)} /><input className="input" placeholder="Password" type="password" value={password} onChange={e=>setPassword(e.target.value)} /><button className="btn primary">Login</button></form><pre className="muted">{log}</pre></div></main>;

  return <main className="container section">
    <div className="section-head"><div><h1>Admin Panel</h1><p className="muted">Import public Study Ratna pages as drafts, then publish after review.</p></div><button className="btn" onClick={() => supabase.auth.signOut().then(()=>setLogged(false))}>Logout</button></div>
    <div className="panel form">
      <h2>Study Ratna Importer</h2>
      <label>Public page URL</label><input className="input" value={sourceUrl} onChange={e=>setSourceUrl(e.target.value)} />
      <p className="muted">Manual import uses your admin login. No service-role key or import secret is needed for this button.</p>
      <button className="btn primary" onClick={runImport}>Run Import Now</button>
      {log && <pre className="card" style={{whiteSpace:'pre-wrap',overflow:'auto'}}>{log}</pre>}
    </div>
    <div className="panel" style={{marginTop:18, overflow:'auto'}}>
      <h2>Imported Resources</h2>
      <table className="table"><thead><tr><th>Title</th><th>Type</th><th>Status</th><th>Actions</th></tr></thead><tbody>{rows.map(r => <tr key={r.id}><td>{r.title}<br/><span className="muted">{r.source_url}</span></td><td>{r.type}</td><td>{r.is_published ? 'Published' : 'Draft'}</td><td><button className="btn" onClick={()=>toggle(r.id, r.is_published)}>{r.is_published ? 'Unpublish' : 'Publish'}</button> <button className="btn" onClick={()=>remove(r.id)}>Delete</button></td></tr>)}</tbody></table>
    </div>
  </main>;
}
