import { readFileSync, writeFileSync, mkdirSync, cpSync, existsSync, readdirSync } from 'node:fs';
import { join, resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { parse as parseYaml } from 'yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, '..');
const CONTENT_DIR = join(ROOT, 'content');
const BUILD_DIR = __dirname;
const DIST = join(ROOT, 'dist');
const noPdf = process.argv.includes('--no-pdf');

const { renderLandingPage, renderWebPage, renderPrintPage } = await import('./render.mjs');

const slugs = ['pruefungsordnung', 'wettkampfordnung'];

const documents = slugs
  .filter(s => existsSync(join(CONTENT_DIR, s + '.yml')))
  .map(slug => {
    const raw = readFileSync(join(CONTENT_DIR, slug + '.yml'), 'utf8');
    return { slug, doc: parseYaml(raw) };
  });

mkdirSync(DIST, { recursive: true });

writeFileSync(join(DIST, 'styles.css'), readFileSync(join(BUILD_DIR, 'styles.css')));
writeFileSync(join(DIST, 'web.css'), readFileSync(join(BUILD_DIR, 'web.css')));
writeFileSync(join(DIST, 'print.css'), readFileSync(join(BUILD_DIR, 'print.css')));

// Copy content assets before PDF generation so images resolve
if (existsSync(join(CONTENT_DIR, 'boegen'))) {
  for (const { slug } of documents) {
    const target = join(DIST, slug, 'boegen');
    mkdirSync(target, { recursive: true });
    cpSync(join(CONTENT_DIR, 'boegen'), target, { recursive: true });
  }
}
if (existsSync(join(CONTENT_DIR, 'wko'))) {
  for (const { slug } of documents) {
    const target = join(DIST, slug, 'wko');
    mkdirSync(target, { recursive: true });
    cpSync(join(CONTENT_DIR, 'wko'), target, { recursive: true });
  }
}
const logoSrc = join(CONTENT_DIR, 'rkb-logo.png');
if (existsSync(logoSrc)) {
  mkdirSync(join(DIST, 'content'), { recursive: true });
  cpSync(logoSrc, join(DIST, 'content', 'rkb-logo.png'));
  for (const { slug } of documents) {
    const target = join(DIST, slug, 'content');
    mkdirSync(target, { recursive: true });
    cpSync(logoSrc, join(target, 'rkb-logo.png'));
  }
}

writeFileSync(join(DIST, 'index.html'), renderLandingPage(documents));
console.log('✓ index.html');

const paginateCode = readFileSync(join(BUILD_DIR, 'paginate.js'), 'utf8');

for (const { slug, doc } of documents) {
  const dir = join(DIST, slug);
  mkdirSync(dir, { recursive: true });

  writeFileSync(join(dir, 'index.html'), renderWebPage(doc, slug));
  console.log(`✓ ${slug}/index.html`);

  if (!noPdf) {
    const printHtml = renderPrintPage(doc, slug);
    const tempHtml = join(dir, '_print.html');
    writeFileSync(tempHtml, printHtml);

    try {
      const { chromium } = await import('playwright');
      const browser = await chromium.launch();
      const page = await browser.newPage();
      await page.setViewportSize({ width: 794, height: 1123 });
      await page.goto('file://' + tempHtml, { waitUntil: 'domcontentloaded' });
      await page.waitForTimeout(1000);

      await page.evaluate(paginateCode);

      await page.pdf({
        path: join(dir, slug + '.pdf'),
        format: 'A4',
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      await browser.close();
      console.log(`✓ ${slug}/${slug}.pdf`);
    } catch (err) {
      console.error(`✗ PDF-Erzeugung für ${slug} fehlgeschlagen:`, err.message);
    }

    try { const { unlinkSync } = await import('node:fs'); unlinkSync(tempHtml); } catch {}
  }
}

const adminSrc = join(ROOT, 'admin');
if (existsSync(adminSrc)) {
  const adminDist = join(DIST, 'admin');
  mkdirSync(adminDist, { recursive: true });
  cpSync(adminSrc, adminDist, { recursive: true });
}

console.log('\nBuild abgeschlossen → dist/');
