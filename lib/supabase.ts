import { createClient } from '@supabase/supabase-js';

export type Resource = {
  id: string;
  batch_id: string | null;
  title: string;
  slug: string;
  type: 'video' | 'pdf' | 'resource' | 'batch' | 'link';
  description: string | null;
  file_url: string | null;
  video_url: string | null;
  thumbnail_url: string | null;
  source_name: string | null;
  source_url: string | null;
  is_published: boolean;
  created_at: string;
};

function getPublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://example.supabase.co';
  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'missing-anon-key';
  return { url, anon };
}

export function supabaseBrowser() {
  const { url, anon } = getPublicConfig();
  return createClient(url, anon);
}

export function supabaseServerAnon() {
  const { url, anon } = getPublicConfig();
  return createClient(url, anon, { auth: { persistSession: false } });
}

export function supabaseAdmin() {
  const { url } = getPublicConfig();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, serviceKey, { auth: { persistSession: false } });
}
