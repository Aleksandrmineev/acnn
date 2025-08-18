// /js/projects.js
document.addEventListener('DOMContentLoaded', () => {
  const root = document;
  const grid = root.querySelector('.projects__grid');
  if (!grid) return;

  const cards = Array.from(grid.querySelectorAll('.project-card'));

  // Controls: чипы категорий + поиск (в aside)
  const chips = Array.from(root.querySelectorAll('.projects__aside .chip'));
  const searchInput = root.querySelector('.projects__aside .projects-toolbar input[name="q"]');

  const emptyState = root.querySelector('.projects__empty');
  const loadMoreBtn = root.querySelector('.js-load-more');
  const nav = root.querySelector('.projects__pagination');
  const contentTop = root.querySelector('.projects__content');

  const PAGE_SIZE = 6;

  // mode: 'paged' — показываем СТРОГО выбранную страницу
  //       'cumulative' — показываем всё до текущей страницы (для «Показать ещё»)
  const state = {
    cat: 'all',
    q: '',
    page: 1,
    mode: 'paged'
  };

  const norm = s => (s ?? '').toString().trim().toLowerCase();
  const parseDate = el => new Date(el.dataset.date || '1970-01-01').getTime();

  function getFiltered() {
    const q = norm(state.q);
    const filtered = cards.filter(el => {
      if (!(state.cat === 'all' || el.dataset.category === state.cat)) return false;
      if (q) {
        const hay = norm([
          el.querySelector('.project-card__title')?.textContent,
          el.querySelector('.project-card__excerpt')?.textContent,
          el.querySelector('.project-card__meta')?.textContent
        ].join(' '));
        if (!hay.includes(q)) return false;
      }
      return true;
    });

    // новые сверху
    filtered.sort((a, b) => parseDate(b) - parseDate(a));
    return filtered;
  }

  function render() {
    const filtered = getFiltered();

    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (state.page > totalPages) state.page = totalPages;

    // диапазон показа
    let startIndex, endIndex;
    if (state.mode === 'paged') {
      startIndex = (state.page - 1) * PAGE_SIZE;
      endIndex = startIndex + PAGE_SIZE;
    } else { // cumulative
      startIndex = 0;
      endIndex = state.page * PAGE_SIZE;
    }

    // показать/скрыть карточки
    cards.forEach(el => (el.hidden = true));
    filtered.slice(startIndex, endIndex).forEach(el => (el.hidden = false));

    // empty state
    if (filtered.length === 0) emptyState?.removeAttribute('hidden');
    else emptyState?.setAttribute('hidden', '');

    // «Показать ещё» — показываем, если есть следующая страница
    if (loadMoreBtn) {
      const hasMore = state.page < totalPages && filtered.length > 0;
      loadMoreBtn.hidden = !hasMore;
      loadMoreBtn.setAttribute('aria-disabled', hasMore ? 'false' : 'true');
    }

    buildPagination(totalPages);
  }

  function buildPagination(totalPages) {
    if (!nav) return;

    // пересобрать UL
    const old = nav.querySelector('.pagination');
    if (old) old.remove();

    const ul = document.createElement('ul');
    ul.className = 'pagination';

    const prevDisabled = state.page <= 1;
    const nextDisabled = state.page >= totalPages;

    ul.appendChild(makeLi(
      `<a class="pagination__link ${prevDisabled ? 'is-disabled' : ''}" ${prevDisabled ? 'aria-disabled="true"' : ''} data-page="prev" aria-label="Предыдущая страница">‹</a>`
    ));

    getCompactRange(totalPages, state.page, 5).forEach(p => {
      if (p === '…') {
        ul.appendChild(makeLi(`<span class="pagination__link" aria-hidden="true">…</span>`));
      } else {
        ul.appendChild(makeLi(
          `<a class="pagination__link ${p === state.page ? 'is-active' : ''}" href="#" data-page="${p}" aria-current="${p === state.page ? 'page' : 'false'}">${p}</a>`
        ));
      }
    });

    ul.appendChild(makeLi(
      `<a class="pagination__link ${nextDisabled ? 'is-disabled' : ''}" ${nextDisabled ? 'aria-disabled="true"' : ''} data-page="next" aria-label="Следующая страница">›</a>`
    ));

    nav.appendChild(ul);

    // клики по пагинации
    ul.addEventListener('click', (e) => {
      const link = e.target.closest('a.pagination__link');
      if (!link) return;
      e.preventDefault();

      const filtered = getFiltered();
      const totalPagesNow = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));

      const val = link.getAttribute('data-page');
      if (val === 'prev' && state.page > 1) {
        state.mode = 'paged';
        state.page--;
        render();
        contentTop?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
      if (val === 'next' && state.page < totalPagesNow) {
        state.mode = 'paged';
        state.page++;
        render();
        contentTop?.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }

      const num = Number(val);
      if (Number.isFinite(num)) {
        state.mode = 'paged';
        state.page = num;
        render();
        contentTop?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  }

  function makeLi(html) {
    const li = document.createElement('li');
    li.className = 'pagination__item';
    li.innerHTML = html;
    return li;
  }

  function getCompactRange(total, current, span) {
    const arr = [];
    const addRange = (a, b) => { for (let i = a; i <= b; i++) arr.push(i); };
    const first = 1, last = total;
    const half = Math.floor(span / 2);

    let start = Math.max(first, current - half);
    let end = Math.min(last, start + span - 1);
    start = Math.max(first, end - span + 1);

    if (start > first) { arr.push(first); if (start > first + 1) arr.push('…'); }
    addRange(start, end);
    if (end < last) { if (end < last - 1) arr.push('…'); arr.push(last); }
    return arr;
  }

  // Events
  chips.forEach(btn => btn.addEventListener('click', () => {
    chips.forEach(c => { c.classList.remove('is-active'); c.setAttribute('aria-selected','false'); });
    btn.classList.add('is-active'); btn.setAttribute('aria-selected','true');
    state.cat = btn.dataset.filter || 'all';
    state.page = 1;
    state.mode = 'paged';
    render();
    contentTop?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  searchInput?.addEventListener('input', e => {
    state.q = e.target.value;
    state.page = 1;
    state.mode = 'paged';
    render();
  });

  loadMoreBtn?.addEventListener('click', () => {
    const filtered = getFiltered();
    const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
    if (state.page < totalPages) {
      state.mode = 'cumulative';
      state.page++;
      render();
    }
  });

  // На случай, если reset сломал [hidden]
  if (!document.querySelector('style[data-hidden-fix]')) {
    const style = document.createElement('style');
    style.setAttribute('data-hidden-fix','');
    style.textContent = '[hidden]{display:none !important;}';
    document.head.appendChild(style);
  }

  render();
});
