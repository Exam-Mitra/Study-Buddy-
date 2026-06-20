// Optional script for GitHub Actions. It calls your deployed import endpoint.
const endpoint = process.env.IMPORT_ENDPOINT; // e.g. https://yourapp.vercel.app/api/import/studyratna
const secret = process.env.IMPORT_SECRET;
const sourceUrl = process.env.STUDY_RATNA_SOURCE_URL || 'https://app.studyratna.org/';
if (!endpoint || !secret) throw new Error('Missing IMPORT_ENDPOINT or IMPORT_SECRET');
const res = await fetch(endpoint, { method: 'POST', headers: { 'content-type': 'application/json', authorization: `Bearer ${secret}` }, body: JSON.stringify({ sourceUrl, autoPublish: false }) });
console.log(await res.text());
if (!res.ok) process.exit(1);
