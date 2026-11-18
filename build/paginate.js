(() => {
  const PAGE_H = 1122.5;
  const MARGIN_TOP = 55;
  const MARGIN_BOTTOM = 50;
  const TAB_HEIGHT_RATIO = 0.85;
  const CONTENT_H = PAGE_H - MARGIN_TOP - MARGIN_BOTTOM;

  const tabsData = JSON.parse(
    document.getElementById('register-tabs-data').dataset.tabs
  );
  const content = document.querySelector('.print-content');
  const sections = Array.from(content.querySelectorAll('.kapitel'));

  const pages = [];
  let currentKopfzeile = '';
  let currentTabIndex = -1;

  function createPage(type) {
    const p = {
      type: type || 'content',
      content: document.createElement('div'),
      kopfzeile: currentKopfzeile,
      tabIndex: currentTabIndex,
      dividerTitle: '',
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

    if (section.dataset.neueSeite !== undefined) {
      // Insert a section divider page
      const dividerTitle = section.dataset.dividerTitle || kopfzeile || '';
      if (dividerTitle) {
        const divider = createPage('divider');
        divider.dividerTitle = dividerTitle;
        divider.kopfzeile = currentKopfzeile;
        divider.tabIndex = currentTabIndex;
      }
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

  // Cover page
  const cover = document.querySelector('.print-cover');
  if (cover) {
    const coverPage = document.createElement('div');
    coverPage.className = 'a4-page cover-page';
    coverPage.appendChild(cover);
    addRegisterTabs(coverPage, -1);
    wrapper.appendChild(coverPage);
  }

  // Content pages (including dividers)
  const contentPages = pages.filter(p => p.type === 'content');
  const totalContentPages = contentPages.length;
  let contentPageNum = 0;

  pages.forEach((p) => {
    const page = document.createElement('div');

    if (p.type === 'divider') {
      page.className = 'a4-page divider-page';
      const title = document.createElement('div');
      title.className = 'divider-title';
      title.textContent = p.dividerTitle;
      page.appendChild(title);
      addRegisterTabs(page, p.tabIndex);
      wrapper.appendChild(page);
      return;
    }

    contentPageNum++;
    page.className = 'a4-page content-page';

    // Header with chapter name + page number
    const header = document.createElement('div');
    header.className = 'page-header';
    const headerTitle = document.createElement('span');
    headerTitle.className = 'page-header-title';
    headerTitle.textContent = p.kopfzeile || '';
    const headerPageNum = document.createElement('span');
    headerPageNum.className = 'page-header-pagenum';
    headerPageNum.textContent = contentPageNum + ' / ' + totalContentPages;
    header.appendChild(headerTitle);
    header.appendChild(headerPageNum);
    page.appendChild(header);

    page.appendChild(p.content);

    addRegisterTabs(page, p.tabIndex);
    wrapper.appendChild(page);
  });

  function addRegisterTabs(page, activeIndex) {
    if (tabsData.length === 0) return;

    const tabStrip = document.createElement('div');
    tabStrip.className = 'register-strip';
    const totalTabs = tabsData.length;
    const availableHeight = PAGE_H * TAB_HEIGHT_RATIO;
    const tabH = Math.min(availableHeight / totalTabs, 90);
    const startY = 40 + (PAGE_H - 40 - totalTabs * tabH) / 2;

    // Menu icon at top
    const menu = document.createElement('div');
    menu.className = 'register-menu';
    menu.innerHTML = '&#9776;';
    tabStrip.appendChild(menu);

    tabsData.forEach((tab, ti) => {
      const el = document.createElement('div');
      el.className = 'register-tab' + (ti === activeIndex ? ' active' : '');
      el.style.top = startY + ti * tabH + 'px';
      el.style.height = tabH + 'px';
      el.style.lineHeight = tabH + 'px';

      const num = document.createElement('span');
      num.className = 'tab-num';
      num.textContent = (ti + 1);
      el.appendChild(num);
      tabStrip.appendChild(el);
    });

    page.appendChild(tabStrip);
  }

  document.body.appendChild(wrapper);
})();
