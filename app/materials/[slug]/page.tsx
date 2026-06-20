import { supabaseServerAnon, Resource } from '@/lib/supabase';

async function getResource(slug: string) {
  try {
    const supabase = supabaseServerAnon();
    const { data } = await supabase.from('resources').select('*').eq('slug', slug).eq('is_published', true).single();
    return data as Resource | null;
  } catch { return null; }
}

export default async function MaterialPage({ params }: { params: { slug: string } }) {
  const r = await getResource(params.slug);
  if (!r) return <main className="container section"><div className="panel"><h1>Material not found</h1><p className="muted">It may be unpublished or removed.</p></div></main>;
  const url = r.file_url || r.video_url || r.source_url || '';
  const isPdf = r.type === 'pdf' || url.toLowerCase().includes('.pdf');
  const isVideo = r.type === 'video' || /youtube|youtu\.be|\.mp4|\.m3u8/i.test(url);
  return <main className="container section">
    <div className="section-head"><div><span className="pill">{r.type}</span><h1>{r.title}</h1><p className="muted">{r.description}</p></div><div className="ad">Minimal ad space</div></div>
    <div className="panel">
      {isPdf ? <iframe className="viewer" src={url} /> : isVideo ? <iframe className="video" src={url} allowFullScreen /> : <p><a className="btn primary" href={url} target="_blank">Open resource</a></p>}
      <p className="muted" style={{marginTop:16}}>Having trouble? <a href={url} target="_blank">Open original link</a></p>
    </div>
  </main>;
}
