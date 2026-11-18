(() => {
  const PAGE_H = 1122.5;
  const MARGIN_TOP = 80;
  const MARGIN_BOTTOM = 60;
  const TAB_HEIGHT_RATIO = 0.8;
  const CONTENT_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;

  const tabsData = JSON.parse(
    document.getElementById('register-tabs-data').dataset.tabs
  );
  const content = document.querySelector('.print-content');
  const sections = Array.from(content.querySelectorAll('.kapitel'));

  const pages = [];
  let currentKopfzeile = '';
  let currentTabIndex = -1;

  function createPage() {
    const p = {
      content: document.createElement('div'),
      kopfzeile: currentKopfzeile,
      tabIndex: currentTabIndex,
    };
    p.content.className = 'page-content';
    pages.push(p);
    return p;
  }

  function fitsOnPage(page, element) {
    page.content.appendChild(element);
    document.body.appendChild(page.content);
    const h = page.content.scrollHeight;
    document.body.removeChild(page.content);
    page.content.removeChild(element);
    return h <= CONTENT_H;
  }

  let currentPage = createPage();

  for (const section of sections) {
    const kopfzeile = section.dataset.kopfzeile || '';
    if (kopfzeile) currentKopfzeile = kopfzeile;

    const tabIdx = tabsData.findIndex(t => t.id === section.id);
    if (tabIdx >= 0) currentTabIndex = tabIdx;

    if (section.dataset.neueSeite !== undefined && currentPage.content.children.length > 0) {
      currentPage = createPage();
    }

    const heading = section.querySelector('h2');
    const blocks = Array.from(section.querySelectorAll('.block'));

    if (heading) {
      const clone = heading.cloneNode(true);
      clone.id = section.id;
      if (!fitsOnPage(currentPage, clone)) {
        currentPage = createPage();
      }
      currentPage.content.appendChild(clone);
      currentPage.kopfzeile = currentKopfzeile;
      currentPage.tabIndex = currentTabIndex;
    }

    for (const block of blocks) {
      if (block.dataset.neueSeite !== undefined && currentPage.content.children.length > 0) {
        currentPage = createPage();
      }
      if (block.dataset.kopfzeile) {
        currentKopfzeile = block.dataset.kopfzeile;
      }

      const clone = block.cloneNode(true);
      if (!fitsOnPage(currentPage, clone)) {
        currentPage = createPage();
      }
      currentPage.content.appendChild(clone);
      currentPage.kopfzeile = currentKopfzeile;
      currentPage.tabIndex = currentTabIndex;
    }
  }

  content.remove();

  const wrapper = document.createElement('div');
  wrapper.className = 'print-pages';

  const toc = document.querySelector('.print-toc');
  const cover = document.querySelector('.print-cover');

  if (cover) {
    const coverPage = document.createElement('div');
    coverPage.className = 'a4-page cover-page';
    coverPage.appendChild(cover);
    wrapper.appendChild(coverPage);
  }

  if (toc) {
    const tocPage = document.createElement('div');
    tocPage.className = 'a4-page toc-page';
    tocPage.appendChild(toc);
    wrapper.appendChild(tocPage);
  }

  const totalContentPages = pages.length;
  pages.forEach((p, i) => {
    const page = document.createElement('div');
    page.className = 'a4-page content-page';

    if (p.kopfzeile) {
      const header = document.createElement('div');
      header.className = 'page-header';
      header.textContent = p.kopfzeile;
      page.appendChild(header);
    }

    page.appendChild(p.content);

    const footer = document.createElement('div');
    footer.className = 'page-footer';
    footer.textContent = (i + 1) + ' / ' + totalContentPages;
    page.appendChild(footer);

    if (tabsData.length > 0) {
      const tabStrip = document.createElement('div');
      tabStrip.className = 'register-strip';
      const totalTabs = tabsData.length;
      const availableHeight = PAGE_H * TAB_HEIGHT_RATIO;
      const tabH = Math.min(availableHeight / totalTabs, 80);
      const startY = (PAGE_H - totalTabs * tabH) / 2;

      tabsData.forEach((tab, ti) => {
        const el = document.createElement('a');
        el.className = 'register-tab' + (ti === p.tabIndex ? ' active' : '');
        el.href = '#' + tab.id;
        el.style.top = startY + ti * tabH + 'px';
        el.style.height = tabH + 'px';
        el.style.lineHeight = tabH + 'px';

        const span = document.createElement('span');
        span.className = 'tab-label';
        span.textContent = tab.titel;
        el.appendChild(span);
        tabStrip.appendChild(el);
      });

      page.appendChild(tabStrip);
    }

    wrapper.appendChild(page);
  });

  document.body.appendChild(wrapper);
})();
