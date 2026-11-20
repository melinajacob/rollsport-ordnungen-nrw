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

function slugify(text) {
  return text.toLowerCase()
    .replace(/[äÄ]/g, 'ae').replace(/[öÖ]/g, 'oe').replace(/[üÜ]/g, 'ue').replace(/ß/g, 'ss')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function getBlockLabel(block) {
  switch (block.typ) {
    case 'pruefung': return block.name;
    case 'vorgabe': return block.name;
    case 'abschnitt': return block.titel;
    case 'boegen': return block.name;
    case 'bogenklasse': return block.name;
    case 'startbedingungen': return block.klasse;
    case 'pirouette': return block.name;
    default: return null;
  }
}

function renderBlock(block) {
  const attrs = [];
  if (block.neue_seite) attrs.push('data-neue-seite');
  if (block.kopfzeile) attrs.push(`data-kopfzeile="${escHtml(block.kopfzeile)}"`);
  const label = getBlockLabel(block);
  if (label) attrs.push(`id="${slugify(label)}"`);
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
    <ol>${doc.kapitel.map(k => {
      const subs = (k.bloecke || [])
        .map(b => ({ label: getBlockLabel(b), slug: getBlockLabel(b) ? slugify(getBlockLabel(b)) : null }))
        .filter(s => s.label);
      const subList = subs.length
        ? `<ul class="toc-sub">${subs.map(s =>
            `<li><a href="#${escHtml(s.slug)}">${escHtml(s.label)}</a></li>`
          ).join('')}</ul>`
        : '';
      return `<li><a href="#${escHtml(k.id)}">${escHtml(k.titel)}</a>${subList}</li>`;
    }).join('')}</ol>
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
    <div class="header-left">
      <button class="menu-btn" id="menu-btn" aria-label="Navigation öffnen">
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none"><path d="M3 5h14M3 10h14M3 15h14" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
      </button>
      <a href="../" class="site-logo">Rollkunstlauf NRW</a>
    </div>
    <nav class="site-nav">
      <a href="../pruefungsordnung/">Prüfungsordnung</a>
      <a href="../wettkampfordnung/">Wettkampfordnung</a>
    </nav>
  </header>
  <div class="doc-layout">
    <aside class="sidebar" id="sidebar">
      <div class="sidebar-head">
        <span class="sidebar-title">Inhaltsverzeichnis</span>
        <button class="sidebar-close" id="sidebar-close" aria-label="Navigation schließen">
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5 5l8 8M13 5l-8 8" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/></svg>
        </button>
      </div>
      <div class="search-box">
        <input type="search" id="search-input" placeholder="Suchen…" autocomplete="off" />
        <div class="search-results" id="search-results"></div>
      </div>
      ${renderToc(doc)}
    </aside>
    <div class="sidebar-overlay" id="sidebar-overlay"></div>
    <main>
      <div class="doc-header">
        <h1>${escHtml(doc.titel)}</h1>
        <p class="doc-meta">${escHtml(doc.untertitel)} · Stand: ${escHtml(doc.stand)}</p>
        <a class="pdf-link" href="${slug}.pdf" download>PDF herunterladen</a>
      </div>
      <div class="doc-content">
        ${doc.kapitel.map(renderChapter).join('\n')}
      </div>
    </main>
  </div>
  <footer class="site-footer">
    <p>&copy; Rollsport-Verband Nordrhein-Westfalen &middot; Stand: ${escHtml(doc.stand)}</p>
  </footer>
  <script>
    const menuBtn = document.getElementById('menu-btn');
    const closeBtn = document.getElementById('sidebar-close');
    const overlay = document.getElementById('sidebar-overlay');
    const sidebar = document.getElementById('sidebar');

    function toggleSidebar() {
      if (window.innerWidth > 900) {
        document.body.classList.toggle('sidebar-closed');
      } else {
        document.body.classList.toggle('sidebar-open');
      }
    }
    function closeSidebar() {
      document.body.classList.remove('sidebar-open');
      if (window.innerWidth > 900) {
        document.body.classList.add('sidebar-closed');
      }
    }
    menuBtn.addEventListener('click', toggleSidebar);
    closeBtn.addEventListener('click', closeSidebar);
    overlay.addEventListener('click', closeSidebar);
    sidebar.querySelectorAll('.toc a').forEach(a => {
      a.addEventListener('click', () => {
        if (window.innerWidth <= 900) closeSidebar();
      });
    });

    // Table filter for "Klasse" columns
    document.querySelectorAll('table').forEach(table => {
      const headers = Array.from(table.querySelectorAll('thead th'));
      const klasseIdx = headers.findIndex(th => th.textContent.trim() === 'Klasse');
      if (klasseIdx === -1) return;

      const rows = Array.from(table.querySelectorAll('tbody tr'));
      const values = [...new Set(rows.map(r => {
        const cells = r.querySelectorAll('td');
        return cells[klasseIdx] ? cells[klasseIdx].textContent.trim() : '';
      }).filter(Boolean))];

      if (values.length < 2) return;

      const bar = document.createElement('div');
      bar.className = 'table-filter';
      bar.innerHTML = '<span class="filter-label">Klasse filtern:</span>';

      const allBtn = document.createElement('button');
      allBtn.textContent = 'Alle';
      allBtn.className = 'filter-btn active';
      allBtn.addEventListener('click', () => {
        rows.forEach(r => r.style.display = '');
        bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
        allBtn.classList.add('active');
      });
      bar.appendChild(allBtn);

      values.forEach(val => {
        const btn = document.createElement('button');
        btn.textContent = val;
        btn.className = 'filter-btn';
        btn.addEventListener('click', () => {
          rows.forEach(r => {
            const cells = r.querySelectorAll('td');
            const cell = cells[klasseIdx] ? cells[klasseIdx].textContent.trim() : '';
            r.style.display = cell === val ? '' : 'none';
          });
          bar.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
          btn.classList.add('active');
        });
        bar.appendChild(btn);
      });

      table.parentElement.insertBefore(bar, table);
    });

    // Search
    const searchInput = document.getElementById('search-input');
    const searchResults = document.getElementById('search-results');
    let searchIndex = null;

    function buildIndex() {
      const entries = [];
      document.querySelectorAll('.doc-content .block').forEach(block => {
        const text = block.textContent;
        const heading = block.querySelector('h3');
        const kapitel = block.closest('.kapitel');
        const label = heading ? heading.textContent.trim() : '';
        const section = kapitel ? kapitel.querySelector('h2').textContent.trim() : '';
        const id = block.id || (kapitel ? kapitel.id : '');
        entries.push({ el: block, text: text.toLowerCase(), label, section, id });
      });
      document.querySelectorAll('.doc-content .kapitel').forEach(kap => {
        const h2 = kap.querySelector('h2');
        if (!h2) return;
        const text = h2.textContent;
        entries.push({ el: kap, text: text.toLowerCase(), label: text.trim(), section: '', id: kap.id });
      });
      return entries;
    }

    function doSearch(query) {
      if (!searchIndex) searchIndex = buildIndex();
      const q = query.toLowerCase().trim();
      if (q.length < 2) { searchResults.innerHTML = ''; searchResults.classList.remove('visible'); return; }

      const hits = searchIndex
        .filter(e => e.text.includes(q))
        .slice(0, 20);

      if (!hits.length) {
        searchResults.innerHTML = '<div class="search-empty">Keine Treffer</div>';
        searchResults.classList.add('visible');
        return;
      }

      searchResults.innerHTML = hits.map(h => {
        const title = h.label || h.section || 'Abschnitt';
        const ctx = getContext(h.text, q);
        return '<a class="search-hit" href="#' + (h.id || '') + '" data-id="' + (h.id || '') + '">'
          + '<span class="hit-title">' + escH(title) + '</span>'
          + (h.section && h.label ? '<span class="hit-section">' + escH(h.section) + '</span>' : '')
          + '<span class="hit-ctx">' + ctx + '</span>'
          + '</a>';
      }).join('');
      searchResults.classList.add('visible');

      searchResults.querySelectorAll('.search-hit').forEach(a => {
        a.addEventListener('click', e => {
          e.preventDefault();
          const id = a.dataset.id;
          const target = id ? document.getElementById(id) : null;
          if (target) {
            target.scrollIntoView({ behavior: 'smooth', block: 'start' });
            target.classList.add('search-highlight');
            setTimeout(() => target.classList.remove('search-highlight'), 2000);
          }
          searchResults.innerHTML = '';
          searchResults.classList.remove('visible');
          searchInput.value = '';
          if (window.innerWidth <= 900) closeSidebar();
        });
      });
    }

    function getContext(text, q) {
      const i = text.indexOf(q);
      if (i === -1) return '';
      const start = Math.max(0, i - 30);
      const end = Math.min(text.length, i + q.length + 30);
      let snippet = (start > 0 ? '…' : '') + text.slice(start, end).replace(/\\s+/g, ' ') + (end < text.length ? '…' : '');
      const esc = escH(snippet);
      const qEsc = escH(q);
      return esc.replace(new RegExp(qEsc.replace(/[.*+?^\${}()|[\\]\\\\]/g, '\\\\$&'), 'gi'), '<mark>$&</mark>');
    }

    function escH(s) { return s.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }

    let searchTimer;
    searchInput.addEventListener('input', () => {
      clearTimeout(searchTimer);
      searchTimer = setTimeout(() => doSearch(searchInput.value), 150);
    });

    document.addEventListener('click', e => {
      if (!e.target.closest('.search-box')) {
        searchResults.innerHTML = '';
        searchResults.classList.remove('visible');
      }
    });
  </script>
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
