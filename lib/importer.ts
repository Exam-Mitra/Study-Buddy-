import * as cheerio from 'cheerio';
import slugify from 'slugify';

export type ImportedItem = {
  title: string;
  slug: string;
  type: 'video' | 'pdf' | 'resource' | 'batch' | 'link';
  description?: string;
  file_url?: string;
  video_url?: string;
  thumbnail_url?: string;
  source_name: string;
  source_url: string;
  source_id: string;
  is_published: boolean;
};

function absolute(base: string, href?: string | null) {
  if (!href) return null;
  try { return new URL(href, base).toString(); } catch { return null; }
}

function detectType(url: string, text: string): ImportedItem['type'] {
  const u = url.toLowerCase();
  const t = text.toLowerCase();
  if (u.includes('.pdf') || t.includes('pdf')) return 'pdf';
  if (u.includes('youtube') || u.includes('youtu.be') || u.includes('.m3u8') || u.includes('.mp4') || t.includes('lecture') || t.includes('video')) return 'video';
  if (t.includes('batch') || t.includes('course')) return 'batch';
  return 'resource';
}

function cleanTitle(text: string, fallback: string) {
  const title = text.replace(/\s+/g, ' ').trim();
  return title.length > 2 ? title.slice(0, 140) : fallback;
}

export async function scrapeStudyRatnaPublicPage(sourceUrl: string): Promise<ImportedItem[]> {
  const res = await fetch(sourceUrl, {
    headers: {
      'user-agent': 'ExamMitraImporter/1.0 (+permission from Study Ratna; public pages only)'
    },
    next: { revalidate: 0 }
  });
  if (!res.ok) throw new Error(`Fetch failed ${res.status} ${res.statusText}`);
  const html = await res.text();
  const $ = cheerio.load(html);
  const items = new Map<string, ImportedItem>();

  // Import links/buttons/cards available in public HTML.
  $('a[href]').each((_, el) => {
    const href = absolute(sourceUrl, $(el).attr('href'));
    if (!href) return;
    if (href.includes('whatsapp.com')) return;
    if (href.startsWith('mailto:') || href.startsWith('tel:')) return;

    const text = cleanTitle($(el).text(), new URL(href).pathname.split('/').filter(Boolean).pop() || 'Study Resource');
    const type = detectType(href, text);
    const slug = slugify(text, { lower: true, strict: true }) || Buffer.from(href).toString('base64url').slice(0, 12);
    const img = $(el).find('img').first().attr('src') || $(el).closest('div').find('img').first().attr('src');
    const thumbnail = absolute(sourceUrl, img || null);

    items.set(href, {
      title: text,
      slug,
      type,
      description: `Imported from a public Study Ratna page.`,
      file_url: type === 'pdf' ? href : undefined,
      video_url: type === 'video' ? href : undefined,
      thumbnail_url: thumbnail || undefined,
      source_name: 'Study Ratna',
      source_url: href,
      source_id: href,
      is_published: false
    });
  });

  // Import visible modules/cards even when their button has no useful unique URL.
  $('h1,h2,h3').each((_, el) => {
    const title = cleanTitle($(el).text(), 'Study Ratna Resource');
    if (title.length < 3 || /hello|welcome|all modules/i.test(title)) return;
    const parent = $(el).closest('div,section,article');
    const href = absolute(sourceUrl, parent.find('a[href]').first().attr('href')) || sourceUrl + '#' + slugify(title, { lower: true, strict: true });
    const img = absolute(sourceUrl, parent.find('img').first().attr('src')) || undefined;
    const desc = parent.text().replace(/\s+/g, ' ').trim().slice(0, 260);
    const type = /batch|course|module/i.test(desc) ? 'batch' : detectType(href, title);
    const slug = slugify(title, { lower: true, strict: true });
    if (!items.has(href)) {
      items.set(href, { title, slug, type, description: desc || 'Study resource.', thumbnail_url: img, source_name: 'Study Ratna', source_url: href, source_id: href, is_published: false });
    }
  });

  return Array.from(items.values()).filter(x => x.title && x.source_url);
}
