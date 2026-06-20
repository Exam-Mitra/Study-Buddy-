import { supabaseServerAnon, Resource } from '@/lib/supabase';

async function getResources() {
  try {
    const supabase = supabaseServerAnon();
    const { data } = await supabase
      .from('resources')
      .select('*')
      .eq('is_published', true)
      .order('created_at', { ascending: false })
      .limit(12);
    return (data || []) as Resource[];
  } catch {
    return [] as Resource[];
  }
}

export default async function HomePage() {
  const resources = await getResources();
  return (
    <main>
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <span className="badge">Free study web app • PWA • Auto import ready</span>
            <h1 className="h1">Study smarter with free batches, PDFs and videos.</h1>
            <p className="lead">ExamMitra helps students find useful study resources, saved batches, video lectures and PDFs in one clean web app.</p>
            <div className="actions">
              <a className="btn primary" href="#materials">Browse materials</a>
              <a className="btn" href="/credits">View credits</a>
            </div>
          </div>
          <div className="panel">
            <h2>What is included?</h2>
            <div className="grid" style={{gridTemplateColumns:'1fr'}}>
              <div className="card"><b>Auto Import</b><p className="muted">Fetch public Study Ratna pages and save new links as drafts.</p></div>
              <div className="card"><b>Backend</b><p className="muted">Supabase database, admin panel, import logs, publish/unpublish.</p></div>
              <div className="card"><b>Minimal Ads</b><p className="muted">A clean student-friendly layout with small ad placements only.</p></div>
            </div>
          </div>
        </div>
      </section>

      <section className="section">
        <div className="container grid">
          <div className="card"><span className="pill">Videos</span><h3>Lectures</h3><p className="muted">Open video resources from imported public links.</p></div>
          <div className="card"><span className="pill">PDF</span><h3>Notes</h3><p className="muted">Read notes and resources directly inside the app.</p></div>
          <div className="card"><span className="pill">Batches</span><h3>Courses</h3><p className="muted">Organize batches by exam, subject and provider.</p></div>
        </div>
      </section>

      <section className="section" id="materials">
        <div className="container">
          <div className="section-head">
            <div><h2>Latest materials</h2><p className="muted">Published resources from your backend.</p></div>
            <div className="ad">Ad space: one small banner only</div>
          </div>
          {resources.length === 0 ? (
            <div className="panel"><h3>No published resources yet</h3><p className="muted">Go to Admin → run importer → publish imported drafts.</p></div>
          ) : (
            <div className="list">
              {resources.map((r) => <a className="card" key={r.id} href={`/materials/${r.slug}`}><div className="thumb">{r.thumbnail_url ? <img src={r.thumbnail_url} alt=""/> : r.type.toUpperCase()}</div><p><span className="pill">{r.type}</span></p><h3>{r.title}</h3><p className="muted">{r.description || 'Study resource'}</p></a>)}
            </div>
          )}
        </div>
      </section>
    </main>
  );
}
