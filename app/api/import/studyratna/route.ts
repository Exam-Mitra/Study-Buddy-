import { NextRequest, NextResponse } from 'next/server';
import { scrapeStudyRatnaPublicPage } from '@/lib/importer';
import { createClient } from '@supabase/supabase-js';

function publicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anon) throw new Error('Missing Supabase public URL/key');
  return { url, anon };
}

async function manualImportWithLoggedInUser(req: NextRequest, autoPublish = false) {
  const body = await req.json().catch(() => ({}));
  const sourceUrl = body.sourceUrl || process.env.STUDY_RATNA_SOURCE_URL || 'https://app.studyratna.org/';
  const { url, anon } = publicConfig();
  const auth = req.headers.get('authorization') || '';
  const token = auth.replace('Bearer ', '');
  const supabase = createClient(url, anon, { global: { headers: { Authorization: auth } }, auth: { persistSession: false } });

  const { data: userData, error: userError } = await supabase.auth.getUser(token);
  if (userError || !userData.user) return NextResponse.json({ error: 'Login required' }, { status: 401 });

  const items = await scrapeStudyRatnaPublicPage(sourceUrl);
  let imported = 0;
  let skipped = 0;
  const errors: string[] = [];

  const { data: source } = await supabase
    .from('import_sources')
    .upsert({ name: 'Study Ratna', url: sourceUrl, type: 'public_page', status: 'running', last_checked_at: new Date().toISOString() }, { onConflict: 'url' })
    .select('id')
    .single();

  for (const item of items) {
    const row = { ...item, is_published: autoPublish ? true : item.is_published };
    const { error } = await supabase.from('resources').upsert(row, { onConflict: 'source_url' });
    if (error) { errors.push(`${item.title}: ${error.message}`); skipped++; }
    else imported++;
  }

  await supabase.from('import_logs').insert({ source_id: source?.id || null, status: errors.length ? 'partial' : 'success', items_found: items.length, items_imported: imported, items_skipped: skipped, error_message: errors.slice(0, 5).join('\n') || null });
  await supabase.from('import_sources').update({ status: 'success', last_checked_at: new Date().toISOString() }).eq('url', sourceUrl);
  return NextResponse.json({ ok: true, sourceUrl, found: items.length, imported, skipped, draftMode: !autoPublish, sample: items.slice(0, 5) });
}

export async function POST(req: NextRequest) {
  try {
    // Manual admin import: requires only logged-in Supabase user. No service_role key needed.
    const auth = req.headers.get('authorization') || '';
    if (auth.startsWith('Bearer ey') || auth.startsWith('Bearer sb_')) {
      return await manualImportWithLoggedInUser(req, false);
    }

    // Optional cron import: requires IMPORT_SECRET + SUPABASE_SERVICE_ROLE_KEY.
    const secret = process.env.IMPORT_SECRET;
    if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    const { supabaseAdmin } = await import('@/lib/supabase');
    const body = await req.json().catch(() => ({}));
    const sourceUrl = body.sourceUrl || process.env.STUDY_RATNA_SOURCE_URL || 'https://app.studyratna.org/';
    const autoPublish = Boolean(body.autoPublish);
    const supabase = supabaseAdmin();
    const items = await scrapeStudyRatnaPublicPage(sourceUrl);
    let imported = 0, skipped = 0;
    const errors: string[] = [];
    const { data: source } = await supabase.from('import_sources').upsert({ name: 'Study Ratna', url: sourceUrl, type: 'public_page', status: 'running', last_checked_at: new Date().toISOString() }, { onConflict: 'url' }).select('id').single();
    for (const item of items) {
      const { error } = await supabase.from('resources').upsert({ ...item, is_published: autoPublish ? true : item.is_published }, { onConflict: 'source_url' });
      if (error) { errors.push(`${item.title}: ${error.message}`); skipped++; } else imported++;
    }
    await supabase.from('import_logs').insert({ source_id: source?.id || null, status: errors.length ? 'partial' : 'success', items_found: items.length, items_imported: imported, items_skipped: skipped, error_message: errors.slice(0, 5).join('\n') || null });
    return NextResponse.json({ ok: true, sourceUrl, found: items.length, imported, skipped, draftMode: !autoPublish, sample: items.slice(0, 5) });
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 });
  }
}
