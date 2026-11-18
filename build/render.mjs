import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

function md(text) {
  if (!text) return '';
  return marked.parse(text.trim());
}

function mdInline(text) {
  if (!text) return '';
  return marked.parseInline(text.trim());
}

function escHtml(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function renderBlock(block) {
  const attrs = [];
  if (block.neue_seite) attrs.push('data-neue-seite');
  if (block.kopfzeile) attrs.push(`data-kopfzeile="${escHtml(block.kopfzeile)}"`);
  const extra = attrs.length ? ' ' + attrs.join(' ') : '';

  switch (block.typ) {
    case 'freitext':
      return `<div class="block block-freitext"${extra}>${md(block.inhalt)}</div>`;

    case 'hinweis':
      return `<div class="block block-hinweis"${extra}><div class="hinweis-icon">ℹ</div><div class="hinweis-text">${md(block.inhalt)}</div></div>`;

    case 'pruefung': {
      let wertungHtml = '';
      if (block.wertung && typeof block.wertung === 'object') {
        const w = block.wertung;
        wertungHtml = `<div class="pruefung-wertung">
          <table class="wertung-table">
            <tr><td>Mindestpunktzahl</td><td><strong>${escHtml(w.mindestpunktzahl)}</strong></td></tr>
            <tr><td>Durchschnittswert</td><td><strong>${escHtml(w.durchschnittswert)}</strong></td></tr>
            ${w.keine_note_unter ? `<tr><td>Keine Note unter</td><td><strong>${escHtml(w.keine_note_unter)}</strong></td></tr>` : ''}
          </table>
          ${w.noten ? `<table class="noten-table">
            <tr><th>Sehr gut</th><th>Gut</th><th>Befriedigend</th><th>Ausreichend</th><th>Mangelhaft</th></tr>
            <tr><td>${escHtml(w.noten.sehr_gut)}</td><td>${escHtml(w.noten.gut)}</td><td>${escHtml(w.noten.befriedigend)}</td><td>${escHtml(w.noten.ausreichend)}</td><td>${escHtml(w.noten.mangelhaft)}</td></tr>
          </table>` : ''}
        </div>`;
      } else if (block.wertung) {
        wertungHtml = `<div class="pruefung-wertung">${md(block.wertung)}</div>`;
      }

      return `<div class="block block-pruefung"${extra}>
        <h3 class="pruefung-name">${escHtml(block.name)}</h3>
        ${block.elemente ? `<ol class="pruefung-elemente">${block.elemente.map(e => `<li>${mdInline(e)}</li>`).join('')}</ol>` : ''}
        ${block.beschreibung ? `<div class="pruefung-beschreibung">${md(block.beschreibung)}</div>` : ''}
        ${wertungHtml}
      </div>`;
    }

    case 'abschnitt': {
      const kasten = block.kasten ? ` kasten-${block.kasten}` : '';
      return `<div class="block block-abschnitt${kasten}"${extra}>
        ${block.titel ? `<h3>${escHtml(block.titel)}</h3>` : ''}
        <div class="abschnitt-inhalt">${md(block.inhalt)}</div>
        ${block.spalte2 ? `<div class="abschnitt-spalte2">${md(block.spalte2)}</div>` : ''}
      </div>`;
    }

    case 'vorgabe':
      return `<div class="block block-vorgabe"${extra}>
        <h3>${escHtml(block.name)}</h3>
        ${block.regeln ? `<ul class="vorgabe-regeln">${block.regeln.map(r => `<li>${escHtml(r)}</li>`).join('')}</ul>` : ''}
        ${block.pruefung ? `<div class="vorgabe-pruefung"><strong>Prüfungsinhalt:</strong> ${md(block.pruefung)}</div>` : ''}
        ${block.musik ? `<div class="vorgabe-musik"><strong>Musik:</strong> ${escHtml(block.musik)}</div>` : ''}
      </div>`;

    case 'startbedingungen':
      return `<div class="block block-startbedingungen"${extra}>
        <h3>${escHtml(block.klasse)}</h3>
        <table class="startbed-table">
          <tbody>
            <tr><td><strong>Alter</strong></td><td>${escHtml(block.alter)}</td></tr>
            <tr><td><strong>Voraussetzung</strong></td><td>${escHtml(block.voraussetzung)}</td></tr>
          </tbody>
        </table>
        ${block.programm ? `<div class="startbed-programm">${md(block.programm)}</div>` : ''}
      </div>`;

    case 'bogenklasse':
      return `<div class="block block-bogenklasse"${extra}>
        <h3>${escHtml(block.name)}</h3>
        ${block.boegen ? `<ul>${block.boegen.map(b => `<li>${escHtml(b)}</li>`).join('')}</ul>` : ''}
      </div>`;

    case 'boegen':
      return `<div class="block block-boegen"${extra}>
        <h3>${escHtml(block.name)}</h3>
        <div class="boegen-grid">
          ${(block.bilder || []).map(b => `
            <figure class="bogen-fig">
              <img src="${escHtml(b.datei)}" alt="${escHtml(b.titel)}" />
              <figcaption>${escHtml(b.titel)}</figcaption>
            </figure>
          `).join('')}
        </div>
      </div>`;

    case 'pirouette':
      return `<div class="block block-pirouette"${extra}>
        <div class="pirouette-text">
          <h3>${escHtml(block.name)}</h3>
          ${md(block.beschreibung)}
        </div>
        ${block.bild ? `<div class="pirouette-bild"><img src="${escHtml(block.bild)}" alt="${escHtml(block.name)}" /></div>` : ''}
      </div>`;

    case 'bild':
      return `<div class="block block-bild"${extra}>
        <img src="${escHtml(block.datei)}" alt="${escHtml(block.titel || '')}" />
        ${block.titel ? `<p class="bild-caption">${escHtml(block.titel)}</p>` : ''}
      </div>`;

    case 'kontakte':
      return `<div class="block block-kontakte"${extra}>
        ${(block.eintraege || []).map(k => `
          <div class="kontakt">
            <div class="kontakt-rolle">${escHtml(k.rolle)}</div>
            <div class="kontakt-name">${escHtml(k.name)}</div>
            ${k.adresse ? `<div class="kontakt-adresse">${escHtml(k.adresse)}</div>` : ''}
            ${k.telefon ? `<div class="kontakt-telefon">Tel: ${escHtml(k.telefon)}</div>` : ''}
            ${k.email ? `<div class="kontakt-email"><a href="mailto:${escHtml(k.email)}">${escHtml(k.email)}</a></div>` : ''}
          </div>
        `).join('')}
      </div>`;

    default:
      return `<div class="block block-unknown">${md(block.inhalt || '')}</div>`;
  }
}

function renderToc(doc) {
  return `<nav class="toc">
    <h2>Inhaltsverzeichnis</h2>
    <ol>${doc.kapitel.map(k =>
      `<li><a href="#${escHtml(k.id)}">${escHtml(k.titel)}</a></li>`
    ).join('')}</ol>
  </nav>`;
}

function renderChapter(kapitel) {
  const attrs = [];
  if (kapitel.neue_seite) attrs.push('data-neue-seite');
  if (kapitel.kopfzeile) attrs.push(`data-kopfzeile="${escHtml(kapitel.kopfzeile)}"`);
  const extra = attrs.length ? ' ' + attrs.join(' ') : '';

  return `<section class="kapitel" id="${escHtml(kapitel.id)}"${extra}>
    <h2>${escHtml(kapitel.titel)}</h2>
    ${kapitel.bloecke.map(renderBlock).join('\n')}
  </section>`;
}

export function renderWebPage(doc, slug) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escHtml(doc.titel)} – Rollkunstlauf NRW</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css" />
  <link rel="stylesheet" href="../web.css" />
</head>
<body class="page-doc">
  <header class="site-header">
    <a href="../" class="site-logo">Rollkunstlauf NRW</a>
    <nav class="site-nav">
      <a href="../pruefungsordnung/">Prüfungsordnung</a>
      <a href="../wettkampfordnung/">Wettkampfordnung</a>
    </nav>
  </header>
  <main>
    <div class="doc-header">
      <h1>${escHtml(doc.titel)}</h1>
      <p class="doc-meta">${escHtml(doc.untertitel)} · Stand: ${escHtml(doc.stand)}</p>
      <a class="pdf-link" href="${slug}.pdf" download>PDF herunterladen</a>
    </div>
    ${renderToc(doc)}
    <div class="doc-content">
      ${doc.kapitel.map(renderChapter).join('\n')}
    </div>
  </main>
  <footer class="site-footer">
    <p>© Rollsport-Verband Nordrhein-Westfalen · Stand: ${escHtml(doc.stand)}</p>
  </footer>
</body>
</html>`;
}

export function renderPrintPage(doc, slug) {
  const registerTabs = doc.kapitel.map((k, i) => ({
    id: k.id,
    titel: k.kopfzeile || k.titel,
    index: i,
  }));

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escHtml(doc.titel)}</title>
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css" />
  <link rel="stylesheet" href="../print.css" />
</head>
<body class="page-print" data-slug="${escHtml(slug)}">
  <div id="register-tabs-data" data-tabs='${JSON.stringify(registerTabs)}'></div>

  <div class="print-cover">
    <div class="cover-content">
      <h1>${escHtml(doc.titel)}</h1>
      <p class="cover-subtitle">${escHtml(doc.untertitel)}</p>
      <p class="cover-stand">Stand: ${escHtml(doc.stand)}</p>
    </div>
  </div>

  <div class="print-toc">
    <h2>Inhaltsverzeichnis</h2>
    <ol>${doc.kapitel.map(k =>
      `<li><a href="#${escHtml(k.id)}">${escHtml(k.titel)}</a></li>`
    ).join('')}</ol>
  </div>

  <div class="print-content">
    ${doc.kapitel.map(renderChapter).join('\n')}
  </div>

  <script>window.__paginateReady = false;</script>
</body>
</html>`;
}

export function renderLandingPage(documents) {
  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Rollkunstlauf NRW – Ordnungen</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin />
  <link href="https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700&display=swap" rel="stylesheet" />
  <link rel="stylesheet" href="styles.css" />
  <link rel="stylesheet" href="web.css" />
</head>
<body class="page-landing">
  <header class="site-header">
    <a href="/" class="site-logo">Rollkunstlauf NRW</a>
  </header>
  <main class="landing">
    <h1>Ordnungen Rollkunstlauf NRW</h1>
    <p class="landing-intro">Prüfungsordnung und Wettkampfordnung (Meisterschaftsordnung)
      des Rollsport-Verbandes Nordrhein-Westfalen.</p>
    <div class="card-grid">
      ${documents.map(d => `
        <a class="card" href="${d.slug}/">
          <h2>${escHtml(d.doc.titel)}</h2>
          <p>${escHtml(d.doc.untertitel)}</p>
          <span class="card-action">Öffnen →</span>
        </a>
      `).join('')}
    </div>
  </main>
  <footer class="site-footer">
    <p>© Rollsport-Verband Nordrhein-Westfalen</p>
  </footer>
</body>
</html>`;
}
