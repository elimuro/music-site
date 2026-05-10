/**
 * generate-json.js
 * Reads Webflow CMS CSV exports and writes clean JSON to content/
 * Run: node scripts/generate-json.js   (or: npm run build)
 */
const fs   = require('fs');
const path = require('path');
const Papa = require('papaparse');

const ROOT        = path.join(__dirname, '..');
const CMS_DIR     = path.join(ROOT, 'fonts', 'cms content');
const CONTENT_DIR = path.join(ROOT, 'content');

function parseCSV(filePath) {
  const raw = fs.readFileSync(filePath, 'utf-8');
  const result = Papa.parse(raw, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });
  if (result.errors.length) {
    result.errors.slice(0, 3).forEach(e =>
      console.warn(`  ⚠ ${path.basename(filePath)} row ${e.row}: ${e.message}`)
    );
  }
  return result.data;
}

function findCSV(keyword) {
  const file = fs.readdirSync(CMS_DIR).find(f => f.includes(keyword) && f.endsWith('.csv'));
  if (!file) throw new Error(`No CSV found matching "${keyword}" in ${CMS_DIR}`);
  return path.join(CMS_DIR, file);
}

fs.mkdirSync(CONTENT_DIR, { recursive: true });

// ── Social Media ──────────────────────────────────────────────────────────────
const socialMedia = parseCSV(findCSV('Social Media'))
  .filter(r => r.Archived !== 'true' && r.Draft !== 'true')
  .map(r => ({
    Name: r.Name,
    Slug: r.Slug,
    Url:  r.Url,
    icon: r.icon,
  }));

fs.writeFileSync(
  path.join(CONTENT_DIR, 'social-media.json'),
  JSON.stringify(socialMedia, null, 2)
);
console.log(`✓ content/social-media.json  (${socialMedia.length} items)`);

// ── Releases ──────────────────────────────────────────────────────────────────
const releases = parseCSV(findCSV('Releases'))
  .filter(r => r.Archived !== 'true' && r.Draft !== 'true')
  .map(r => ({
    Name:               r.Name,
    Slug:               r.Slug,
    'Info Text':        r['Info Text'],
    'Pre release':      r['Pre release'] === 'true',
    Highlighted:        r['Highlighted'] === 'true',
    'Music Video':      r['Music Video'],
    'Release type':     r['Release type'],
    Year:               r['Year'],
    'Release Date':     r['Release Date'],
    'Main Cover image': r['Main Cover image'],
    'Background-image': r['Background-image'],
    'Logo-type':        r['Logo-type'],
    'Primary-colour':   r['Primary-colour'],
    'text colour':      r['text colour'],
    'BG embed link':    r['BG embed link'],
    'Soundcloud Embed SRC': r['Soundcloud Embed SRC'],
    'Spotify Embed SRC':    r['Spotify Embed SRC'],
    'Spotify URL':      r['Spotify URL'],
    'iTunes URL':       r['iTunes URL'],
    'Soundcloud URL':   r['Soundcloud URL'],
    'Bandcamp URL':     r['Bandcamp URL'],
    'Deezer URL':       r['Deezer URL'],
    'Apple Music URL':  r['Apple Music URL'],
    'Amazon URL':       r['Amazon URL'],
    'Tidal URL':        r['Tidal URL'],
  }));

// Sort: most recent year first, then alphabetically
releases.sort((a, b) => {
  const yearDiff = parseInt(b.Year || 0) - parseInt(a.Year || 0);
  return yearDiff !== 0 ? yearDiff : a.Name.localeCompare(b.Name);
});

fs.writeFileSync(
  path.join(CONTENT_DIR, 'releases.json'),
  JSON.stringify(releases, null, 2)
);
console.log(`✓ content/releases.json      (${releases.length} items)`);
console.log('\nDone. Commit the content/ folder and deploy.');
