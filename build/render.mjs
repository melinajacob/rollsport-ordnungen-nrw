import { marked } from 'marked';

marked.setOptions({ gfm: true, breaks: true });

const FONT_URL = 'https://fonts.googleapis.com/css2?family=Outfit:wght@300;400;500;600;700;800;900&display=swap';

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
      return `<div class="block block-hinweis"${extra}>${md(block.inhalt)}</div>`;

    case 'pruefung': {
      let elementeHtml = '';
      if (block.elemente && block.elemente_rechts) {
        elementeHtml = `<div class="pruefung-elemente-grid">
          <div class="pruefung-elemente-col">${block.elemente.map(e => `<div class="pruefung-element">${mdInline(e)}</div>`).join('')}</div>
          <div class="pruefung-elemente-col">${block.elemente_rechts.map(e => `<div class="pruefung-element">${mdInline(e)}</div>`).join('')}</div>
        </div>`;
      } else if (block.elemente) {
        elementeHtml = `<div class="pruefung-elemente">${block.elemente.map(e => `<div class="pruefung-element">${mdInline(e)}</div>`).join('')}</div>`;
      }

      let wertungHtml = '';
      if (block.wertung && typeof block.wertung === 'object') {
        const w = block.wertung;
        wertungHtml = `<div class="pruefung-wertung">
          <div class="wertung-title">Wertung</div>
          <div class="wertung-row">
            <div class="wertung-item">Mindestpunktzahl <span>${escHtml(w.mindestpunktzahl)}</span></div>
            <div class="wertung-item">Durchschnittswert <span>${escHtml(w.durchschnittswert)}</span></div>
            ${w.keine_note_unter ? `<div class="wertung-item">Keine Note unter <span>${escHtml(w.keine_note_unter)}</span></div>` : ''}
          </div>
          ${w.noten ? `<hr class="wertung-divider"><div class="noten-row">
            <div class="note-col"><div class="note-label">Sehr gut</div><div class="note-value">${escHtml(w.noten.sehr_gut)}</div></div>
            <div class="note-col"><div class="note-label">Gut</div><div class="note-value">${escHtml(w.noten.gut)}</div></div>
            <div class="note-col"><div class="note-label">Befriedigend</div><div class="note-value">${escHtml(w.noten.befriedigend)}</div></div>
            <div class="note-col"><div class="note-label">Ausreichend</div><div class="note-value">${escHtml(w.noten.ausreichend)}</div></div>
            <div class="note-col"><div class="note-label">Mangelhaft</div><div class="note-value">${escHtml(w.noten.mangelhaft)}</div></div>
          </div>` : ''}
        </div>`;
      } else if (block.wertung) {
        wertungHtml = `<div class="pruefung-wertung">${md(block.wertung)}</div>`;
      }

      return `<div class="block block-pruefung"${extra}>
        <h3 class="pruefung-name">${escHtml(block.name)}</h3>
        ${elementeHtml}
        ${block.beschreibung ? `<div class="pruefung-beschreibung">${md(block.beschreibung)}</div>` : ''}
        ${wertungHtml}
      </div>`;
    }

    case 'abschnitt': {
      const kasten = block.kasten ? ` kasten-${block.kasten}` : '';
      let contentHtml;
      if (block.spalte2) {
        contentHtml = `<div class="abschnitt-columns">
          <div class="abschnitt-inhalt">${md(block.inhalt)}</div>
          <div class="abschnitt-spalte2">${md(block.spalte2)}</div>
        </div>`;
      } else {
        contentHtml = `<div class="abschnitt-inhalt">${md(block.inhalt)}</div>`;
      }
      return `<div class="block block-abschnitt${kasten}"${extra}>
        ${block.titel ? `<h3>${escHtml(block.titel)}</h3>` : ''}
        ${contentHtml}
      </div>`;
    }

    case 'vorgabe': {
      let regelnHtml = '';
      if (block.regeln) {
        regelnHtml = `<div class="pruefung-elemente">${block.regeln.map(r => `<div class="pruefung-element">${mdInline(r)}</div>`).join('')}</div>`;
      }

      let tagsHtml = '';
      if (block.pflicht) {
        const items = Array.isArray(block.pflicht) ? block.pflicht : [block.pflicht];
        tagsHtml += items.map(p => `<div class="vorgabe-pflicht"><strong>Pflicht</strong> ${escHtml(p)}</div>`).join('');
      }
      if (block.beschraenkung) {
        const items = Array.isArray(block.beschraenkung) ? block.beschraenkung : [block.beschraenkung];
        tagsHtml += items.map(b => `<div class="vorgabe-beschraenkung"><strong>Beschränkung</strong> ${escHtml(b)}</div>`).join('');
      }
      if (block.untersagt) {
        const items = Array.isArray(block.untersagt) ? block.untersagt : [block.untersagt];
        tagsHtml += items.map(u => `<div class="vorgabe-untersagt"><strong>Untersagt</strong> ${escHtml(u)}</div>`).join('');
      }

      let infoHtml = '';
      if (block.pruefung_name || block.musiklaenge) {
        infoHtml = `<div class="vorgabe-info">
          <div class="vorgabe-info-row">
            ${block.pruefung_name ? `<div>Prüfung <span>${escHtml(block.pruefung_name)}</span></div>` : ''}
            ${block.musiklaenge ? `<div>Musiklänge <span>${escHtml(block.musiklaenge)}</span></div>` : ''}
            ${block.gesang !== undefined ? `<div>Gesang <span>${escHtml(block.gesang)}</span></div>` : ''}
          </div>
          ${block.abzug_regelverstoss || block.abzug_pflichtelemente ? `<hr class="wertung-divider"><div class="vorgabe-abzuege">
            ${block.abzug_regelverstoss ? `<div>Abzüge bei Regelverstoß <span class="abzug-value">${escHtml(block.abzug_regelverstoss)}</span></div>` : ''}
            ${block.abzug_pflichtelemente ? `<div>Abzüge fehlende Pflichtelementen <span class="abzug-value">${escHtml(block.abzug_pflichtelemente)}</span></div>` : ''}
          </div>` : ''}
        </div>`;
      }

      return `<div class="block block-vorgabe"${extra}>
        <h3 class="vorgabe-name">${escHtml(block.name)}</h3>
        ${regelnHtml}
        ${tagsHtml}
        ${block.pruefung ? `<div class="vorgabe-pruefung">${md(block.pruefung)}</div>` : ''}
        ${block.musik ? `<div class="vorgabe-musik">${md(block.musik)}</div>` : ''}
        ${infoHtml}
      </div>`;
    }

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
        ${block.boegen ? `<div class="pruefung-elemente">${block.boegen.map(b => `<div class="pruefung-element">${escHtml(b)}</div>`).join('')}</div>` : ''}
      </div>`;

    case 'boegen':
      return `<div class="block block-boegen"${extra}>
        <h3>${escHtml(block.name)}</h3>
        <div class="boegen-grid">
          ${(block.bilder || []).map(b => `
            <figure class="bogen-fig">
              <figcaption>${escHtml(b.titel)}</figcaption>
              <img src="${escHtml(b.datei)}" alt="${escHtml(b.titel)}" />
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
            <div class="kontakt-body">
              <div class="kontakt-left">
                <div class="kontakt-name">${escHtml(k.name)}</div>
                ${k.adresse ? `<div class="kontakt-adresse">${escHtml(k.adresse)}</div>` : ''}
              </div>
              <div class="kontakt-phone-email">
                ${k.telefon ? `<div class="kontakt-telefon">${escHtml(k.telefon)}</div>` : ''}
                ${k.email ? `<div class="kontakt-email">${escHtml(k.email)}</div>` : ''}
              </div>
            </div>
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
  attrs.push(`data-divider-title="${escHtml(kapitel.kopfzeile || kapitel.titel)}"`);
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
  <link href="${FONT_URL}" rel="stylesheet" />
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
    <p>&copy; Rollsport-Verband Nordrhein-Westfalen &middot; Stand: ${escHtml(doc.stand)}</p>
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

  const coverTocRows = doc.kapitel.map((k, i) =>
    `<tr><td class="toc-num">${i + 1}</td><td class="toc-label">${escHtml(k.titel)}</td></tr>`
  ).join('');

  const standLine = doc.stand_wr
    ? `Letzte Änderung: <strong>${escHtml(doc.stand)}</strong> &nbsp;&nbsp; Letzte Änderung WR: <strong>${escHtml(doc.stand_wr)}</strong>`
    : `Letzte Änderung: <strong>${escHtml(doc.stand)}</strong>`;

  return `<!DOCTYPE html>
<html lang="de">
<head>
  <meta charset="utf-8" />
  <title>${escHtml(doc.titel)}</title>
  <link href="${FONT_URL}" rel="stylesheet" />
  <link rel="stylesheet" href="../styles.css" />
  <link rel="stylesheet" href="../print.css" />
</head>
<body class="page-print" data-slug="${escHtml(slug)}">
  <div id="register-tabs-data" data-tabs='${JSON.stringify(registerTabs)}'></div>

  <div class="print-cover">
    <div class="cover-saison">Saison ${escHtml(doc.saison || '2026')}</div>
    <div class="cover-logo">
      <img src="../content/rkb-logo.png" alt="RKB Logo" onerror="this.style.display='none'" />
    </div>
    <div class="cover-content">
      <h1>${escHtml(doc.untertitel || doc.titel)}</h1>
      ${doc.unterzeile ? `<p class="cover-unterzeile">${escHtml(doc.unterzeile)}</p>` : ''}
    </div>
    <table class="cover-toc">
      ${coverTocRows}
    </table>
    <p class="cover-stand">${standLine}</p>
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
  <link href="${FONT_URL}" rel="stylesheet" />
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
          <span class="card-action">Öffnen &rarr;</span>
        </a>
      `).join('')}
    </div>
  </main>
  <footer class="site-footer">
    <p>&copy; Rollsport-Verband Nordrhein-Westfalen</p>
  </footer>
</body>
</html>`;
}
