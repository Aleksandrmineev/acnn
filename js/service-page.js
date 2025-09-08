(async function () {
  if (window.includesReady) await window.includesReady;

  const $ = (id) => document.getElementById(id);

  // чтение slug + загрузка данных
  let data;
  try {
    const params = new URLSearchParams(location.search);
    const slug = params.get('slug') || 'aps';
    const res = await fetch(`../data/uslugi/${slug}.json`, { cache: 'no-store' });
    if (!res.ok) throw new Error(`JSON ${slug} not found`);
    data = await res.json();
  } catch (e) {
    console.error(e);
    // мягкое сообщение пользователю
    const c = $('features');
    if (c) c.innerHTML = `<div class="card">Не удалось загрузить данные услуги. Проверьте файл JSON.</div>`;
    return;
  }

  // SEO
  const setAttr = (id, attr, val) => { const el = $(id); if (el && val) el.setAttribute(attr, val); };
  $('seo-title').textContent = data.seo?.title || data.title || '';
  setAttr('seo-desc', 'content', data.seo?.description || '');
  setAttr('seo-canonical', 'href', data.seo?.canonical || '');
  setAttr('og-title', 'content', data.seo?.title || data.title || '');
  setAttr('og-desc', 'content', data.seo?.description || '');
  setAttr('og-image', 'content', data.seo?.ogImage || '');

  // Hero
  // HERO: фон с preload + тексты + CTA
  if (data.hero?.bg) {
    const preload = document.createElement('link');
    preload.rel = 'preload';
    preload.as = 'image';
    preload.href = data.hero.bg;
    document.head.appendChild(preload);

    hero.style.backgroundImage = `url(${data.hero.bg})`;
  }

  title.textContent = data.title;
  subtitle.textContent = data.subtitle || '';

  // CTA c дефолтами
  // CTA с дефолтами
  const pri = data.hero?.ctaPrimary ?? { label: 'Получить смету', href: '#form' };
  const sec = data.hero?.ctaSecondary ?? { label: 'Позвонить', href: 'tel:+78312288022' };

  const ctaPrimary = document.getElementById('cta-primary');
  const ctaSecondary = document.getElementById('cta-secondary');

  // ── основная «Получить смету»
  ctaPrimary.textContent = pri.label;
  ctaPrimary.href = pri.href;
  // нужные атрибуты для трекинга/скролла к форме
  ctaPrimary.dataset.cta = 'quote';   // общий обработчик поймёт
  ctaPrimary.dataset.source = 'hero';    // откуда кликнули
  if (pri.package) ctaPrimary.dataset.package = pri.package; // опционально

  // ── вторичная «Позвонить»
  if (sec?.label && sec?.href) {
    ctaSecondary.textContent = sec.label;
    ctaSecondary.href = sec.href;
  } else {
    ctaSecondary.style.display = 'none';
  }

  // USP (буллеты под заголовком)
  const uspEl = document.getElementById('usp');
  uspEl.innerHTML = (data.usp || [])
    .map(text => `<li class="card"><span class="usp-bullet" aria-hidden="true">✓</span>${text}</li>`)
    .join('');



  // ---------- Steps / Timeline ----------
  const MAX_STEPS_VISIBLE = 4;

  const pickIcon = (t = "") => {
    const s = (t || "").toLowerCase();
    if (s.includes("проект")) return "📐";
    if (s.includes("поставка")) return "📦";
    if (s.includes("монтаж")) return "🛠";
    if (s.includes("пнр") || s.includes("настрой")) return "⚙️";
    if (s.includes("сдача") || s.includes("док")) return "🧾";
    if (s.includes("договор") || s.includes("оплата")) return "💳";
    if (s.includes("выезд") || s.includes("объект")) return "📍";
    return "✅";
  };

  function renderSteps(items = []) {
    const hidden = Math.max(items.length - MAX_STEPS_VISIBLE, 0);

    features.innerHTML = `
    <h2>Что выполняется поэтапно</h2>
    <ol class="steps" id="steps">
      ${items.map((f, i) => `
        <li class="step ${i >= MAX_STEPS_VISIBLE ? 'is-hidden' : ''}" data-open="false">
          <div class="step__num" aria-hidden="true"></div>
          <button class="step__q" type="button" aria-expanded="false" aria-controls="step-a-${i}" id="step-q-${i}">
            <span class="step__icon" aria-hidden="true">${f.icon || pickIcon(f.title)}</span>
            <span class="step__title">${f.title || ""}</span>
          </button>
          <div class="step__a" id="step-a-${i}" role="region" aria-labelledby="step-q-${i}" style="height:0">
            <div class="step__a-inner">${f.desc || ""}</div>
          </div>
        </li>
      `).join('')}
    </ol>
    ${hidden ? `<div class="steps-more"><button class="btn btn--ghost" id="steps-more-btn">Показать ещё ${hidden}</button></div>` : ''}
  `;

    const toggle = (item) => {
      const btn = item.querySelector('.step__q');
      const ans = item.querySelector('.step__a');
      const open = item.dataset.open === 'true';

      if (open) {
        ans.style.height = ans.scrollHeight + 'px';
        void ans.offsetHeight;
        ans.style.height = '0';
        item.dataset.open = 'false';
        btn.setAttribute('aria-expanded', 'false');
      } else {
        ans.style.height = ans.scrollHeight + 'px';
        const onEnd = () => { ans.style.height = 'auto'; ans.removeEventListener('transitionend', onEnd); };
        ans.addEventListener('transitionend', onEnd);
        item.dataset.open = 'true';
        btn.setAttribute('aria-expanded', 'true');
      }
    };

    // клики/клавиатура
    document.querySelectorAll('.step .step__q').forEach(btn => {
      const item = btn.closest('.step');
      btn.addEventListener('click', () => toggle(item));
      btn.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && item.dataset.open === 'true') toggle(item);
      });
    });

    // Показать скрытые
    const moreBtn = document.getElementById('steps-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        document.querySelectorAll('.step.is-hidden').forEach(el => el.classList.remove('is-hidden'));
        moreBtn.parentElement.remove();
      });
    }
  }

  // вызов после загрузки JSON:
  renderSteps(data.features || []);



  // Packages
  $('packages').innerHTML = `
      <h2>Комплектации и стоимость</h2>
      <div class="grid grid--3">
        ${(data.packages || []).map(p => `
          <div class="card">
            <h3>${p.name}</h3>
            <p><b>${p.priceFrom || ''}</b></p>
            <ul>${(p.items || []).map(i => `<li>${i}</li>`).join('')}</ul>
            <a class="btn btn--primary" href="#form">Получить смету</a>
          </div>`).join('')}
      </div>`;

  // Standards

  packages.innerHTML = `
    <h2>Комплектации и стоимость</h2>
    <div class="grid grid--3">
      ${(data.packages || []).map(p => `
        <div class="card">
          <div class="plan__head">
            <h3 class="plan__title">${p.name}</h3>
            <div class="plan__price">${p.priceFrom || ''}</div>
          </div>
          <ul class="plan__list">
            ${(p.items || []).map(i => `<li>${i}</li>`).join('')}
          </ul>
          <a class="btn btn--primary" href="#form">Получить смету</a>
        </div>`).join('')}
    </div>`;



  // Cases (Swiper)
  const wrap = $('cases-wrapper');
  wrap.innerHTML = (data.cases || []).map(c => `
      <div class="swiper-slide">
        <figure class="card">
          <img src="${c.cover}" alt="${c.title}" loading="lazy" style="width:100%;border-radius:12px">
          <figcaption><b>${c.title}</b><br>${c.meta || ''}</figcaption>
          ${(c.gallery && c.gallery.length)
      ? `<div class="case-gallery" data-items='${JSON.stringify(c.gallery)}'></div>` : ''}
        </figure>
      </div>`).join('');

  new Swiper('.cases-swiper', {
    slidesPerView: 1, spaceBetween: 16,
    breakpoints: { 768: { slidesPerView: 2 }, 1024: { slidesPerView: 3 } },
    pagination: { el: '.swiper-pagination', clickable: true },
    navigation: { nextEl: '.swiper-button-next', prevEl: '.swiper-button-prev' }
  });

  // Glightbox для кейсов
  document.querySelectorAll('.case-gallery').forEach((g, i) => {
    const imgs = JSON.parse(g.dataset.items || '[]');
    if (!imgs.length) return;
    g.insertAdjacentHTML('beforebegin', `<a href="${imgs[0]}" class="btn btn--ghost" data-gallery="case${i}">Смотреть фото</a>`);
    const links = imgs.map(src => ({ href: src, type: 'image' }));
    const lb = GLightbox({ selector: `a[data-gallery="case${i}"]` });
    lb.on('open', () => links.slice(1).forEach(x => lb.insertSlide(x)));
  });

  // Licenses → Swiper + Glightbox
  $('licenses').innerHTML = (data.licenses || []).length ? `
  <h2>Лицензии и сертификаты</h2>
  <div class="swiper licenses-swiper">
    <div class="swiper-wrapper">
      ${(data.licenses || []).map(l => `
        <div class="swiper-slide">
          <a class="card" href="${l.img}" data-gallery="lic" data-type="image">
            <div class="thumb">
              <img src="${l.img}" alt="${l.name}" loading="lazy">
            </div>
            <p>${l.name}</p>
          </a>
        </div>
      `).join('')}
    </div>
    <div class="swiper-button-prev"></div>
    <div class="swiper-button-next"></div>
    <div class="swiper-pagination"></div>
  </div>` : '';

  // Swiper init (адаптив)
  if (document.querySelector('.licenses-swiper')) {
    new Swiper('.licenses-swiper', {
      slidesPerView: 1,
      spaceBetween: 16,
      breakpoints: {
        480: { slidesPerView: 2 },
        768: { slidesPerView: 3 },
        1024: { slidesPerView: 4 }
      },
      navigation: { nextEl: '.licenses-swiper .swiper-button-next', prevEl: '.licenses-swiper .swiper-button-prev' },
      pagination: { el: '.licenses-swiper .swiper-pagination', clickable: true },
      watchOverflow: true
    });

    // Лайтбокс на изображения
    GLightbox({ selector: '#licenses a[data-gallery="lic"]' });
  }


  // Docs
  // Docs: карточки с типом файла, кнопками и lightbox для изображений
  const extOf = (path = "") => (path.split(".").pop() || "").toLowerCase();
  const typeOf = (ext) => {
    if (/^(png|jpe?g|webp|avif|gif|svg)$/.test(ext)) return "img";
    if (/^pdf$/.test(ext)) return "pdf";
    if (/^(docx?|rtf)$/.test(ext)) return "doc";
    if (/^(xlsx?|csv)$/.test(ext)) return "xls";
    if (/^(pptx?)$/.test(ext)) return "ppt";
    if (/^(zip|rar|7z)$/.test(ext)) return "zip";
    return "file";
  };

  $('docs').innerHTML = (data.docs || []).length ? `
  <h2>Документы</h2>
  <ul class="doc-grid">
    ${(data.docs || []).map(d => {
    const ext = extOf(d.file);
    const t = typeOf(ext);
    const isImg = t === 'img' || d.preview === true;
    const metaBits = [t.toUpperCase(), d.size, d.updated].filter(Boolean).join(' · ');
    const mainAttrs = isImg
      ? `href="${d.file}" class="doc-link glightbox" data-gallery="docs" data-type="image"`
      : `href="${d.file}" class="doc-link" target="_blank" rel="noopener"`;
    const openAttrs = isImg
      ? `href="${d.file}" class="btn btn--primary glightbox" data-gallery="docs" data-type="image"`
      : `href="${d.file}" class="btn btn--primary" target="_blank" rel="noopener"`;
    return `
        <li class="doc-card">
          <a ${mainAttrs} aria-label="${d.name}">
            <span class="doc-icon doc-icon--${t}" aria-hidden="true"></span>
            <span class="doc-text">
              <span class="doc-title">${d.name}</span>
              <span class="doc-meta">${metaBits}</span>
            </span>
          </a>
          <div class="doc-actions">
            <a ${openAttrs}>Открыть</a>
            <a href="${d.file}" class="btn btn--ghost doc-download" download>Скачать</a>
          </div>
        </li>`;
  }).join('')}
  </ul>` : '';

  // Lightbox только для изображений
  if (document.querySelector('#docs .glightbox')) {
    GLightbox({ selector: '#docs .glightbox' });
  }


  // FAQ / GEO / Warranty
  // ===== FAQ (современный аккордеон на div, с анимацией) =====
  const MAX_FAQ_VISIBLE = 6; // сколько показывать сразу (остальные — по кнопке)

  function renderFAQ(items = []) {
    if (!items.length) { $('faq').innerHTML = ''; return; }

    const hidden = Math.max(items.length - MAX_FAQ_VISIBLE, 0);

    $('faq').innerHTML = `
    <h2>Частые вопросы</h2>
    <div class="faq-grid" id="faq-grid">
      ${items.map((f, i) => `
        <div class="faq-item ${i >= MAX_FAQ_VISIBLE ? 'is-hidden' : ''}" data-open="false">
          <div class="faq-q" role="button" tabindex="0"
               aria-expanded="false" aria-controls="faq-a-${i}" id="faq-q-${i}">
            <span class="faq-q-text">${f.q}</span>
          </div>
          <div class="faq-a" id="faq-a-${i}" role="region" aria-labelledby="faq-q-${i}" style="height:0">
            <div class="faq-a-inner">${f.a}</div>
          </div>
        </div>
      `).join('')}
    </div>
    ${hidden ? `<div class="faq-more"><button class="btn btn--ghost" id="faq-more-btn">Показать ещё ${hidden}</button></div>` : ''}
  `;

    // анимация раскрытия/скрытия
    const toggle = (item) => {
      const q = item.querySelector('.faq-q');
      const a = item.querySelector('.faq-a');
      const open = item.dataset.open === 'true';

      if (open) {
        // закрыть
        a.style.height = a.scrollHeight + 'px';
        // форс-рефлоу
        void a.offsetHeight;
        a.style.height = '0';
        item.dataset.open = 'false';
        q.setAttribute('aria-expanded', 'false');
      } else {
        // открыть
        a.style.height = a.scrollHeight + 'px';
        const onEnd = () => {
          a.style.height = 'auto';
          a.removeEventListener('transitionend', onEnd);
        };
        a.addEventListener('transitionend', onEnd);
        item.dataset.open = 'true';
        q.setAttribute('aria-expanded', 'true');
      }
    };

    // слушатели
    document.querySelectorAll('.faq-item .faq-q').forEach(q => {
      q.addEventListener('click', () => toggle(q.closest('.faq-item')));
      q.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(q.closest('.faq-item')); }
        if (e.key === 'Escape') {
          const it = q.closest('.faq-item');
          if (it?.dataset.open === 'true') toggle(it);
        }
      });
    });

    // показать скрытые
    const moreBtn = document.getElementById('faq-more-btn');
    if (moreBtn) {
      moreBtn.addEventListener('click', () => {
        document.querySelectorAll('.faq-item.is-hidden').forEach(el => el.classList.remove('is-hidden'));
        moreBtn.parentElement.remove();
      });
    }
  }

  // вызов после загрузки данных:
  renderFAQ(data.faq || []);


  // Quote / Founder
  if (data.quote?.text && data.quote?.photo) {
    const flip = data.quote.align === 'right' ? 'is-reverse' : '';
    $('quote').innerHTML = `
    <div class="founder-quote ${flip}">
      <figure class="fq-media">
        <img src="${data.quote.photo}" alt="${data.quote.author}" loading="lazy">
      </figure>
      <div class="fq-text">
        <span class="fq-accent" aria-hidden="true"></span>
        <blockquote class="fq-block">
          <p>${data.quote.text}</p>
        </blockquote>
        <div class="fq-author">
          <div class="fq-name">${data.quote.author}</div>
          <div class="fq-role">${data.quote.role || ''}</div>
        </div>
      </div>
    </div>`;
  }


  // ===== Videos gallery (inline players, no modal)
  {
    const vids = Array.isArray(data.videos) && data.videos.length
      ? data.videos
      : (data.video ? [data.video] : []);

    if (vids.length) {
      $('video').innerHTML = `
      <h2>${vids.length > 1 ? 'Видео' : (vids[0].title || 'Видео')}</h2>
      <div class="video-gallery">
        ${vids.map((v) => `
          <div class="video-card">
  <div class="video-inline" data-src="${v.src}"
       ${v.poster ? `data-poster="${v.poster}"` : ''}
       ${v.captions ? `data-captions="${v.captions}"` : ''}>

    ${v.poster ? `<img class="video-thumb" src="${v.poster}" alt="${v.title || 'Видео'}" loading="lazy" decoding="async">` : ''}

    <!-- ⬇️ бейдж длительности -->
    <span class="video-duration" aria-hidden="true"></span>

    <button class="video-play" aria-label="Смотреть видео"></button>
    <span class="video-overlay" aria-hidden="true"></span>
  </div>

  ${(v.title || v.author || v.note) ? `
    <div class="video-meta">
      ${v.title ? `<div class="video-title">${v.title}</div>` : ''}
      ${(v.author || v.note) ? `<div class="video-sub">${v.author ? `<b>${v.author}</b>` : ''}${v.note ? ` <span>· ${v.note}</span>` : ''}</div>` : ''}
    </div>` : ''}
</div>

        `).join('')}
      </div>
    `;

      let current; // текущее <video>

      const startPlay = (wrap) => {
        // создаём <video> при первом клике
        let vid = wrap.querySelector('video');
        if (!vid) {
          vid = document.createElement('video');
          vid.playsInline = true;
          vid.setAttribute('playsinline', '');
          vid.preload = 'metadata';
          const src = wrap.dataset.src;
          const poster = wrap.dataset.poster;
          if (poster) vid.poster = poster;
          vid.src = src;

          const caps = wrap.dataset.captions;
          if (caps) {
            const track = document.createElement('track');
            track.kind = 'subtitles';
            track.srclang = 'ru';
            track.label = 'Русские';
            track.src = caps;
            track.default = true;
            vid.appendChild(track);
          }

          // вставляем видео ПЕРЕД всем контентом
          wrap.insertBefore(vid, wrap.firstChild);

          // удаляем постер-изображение, чтобы не увеличивать высоту контейнера
          const thumb = wrap.querySelector('.video-thumb');
          if (thumb) thumb.remove();
        }

        // пауза у предыдущего ролика
        if (current && current !== vid) current.pause();

        vid.muted = false;
        vid.controls = true;
        vid.play().catch(() => { vid.muted = true; vid.play(); });

        wrap.classList.add('is-playing');
        current = vid;

        vid.onclick = () => (vid.paused ? vid.play() : vid.pause());
        vid.onpause = () => wrap.classList.remove('is-playing');
        vid.onplay = () => wrap.classList.add('is-playing');
      };

      // клики по кнопкам play
      document.querySelectorAll('#video .video-inline .video-play').forEach(btn => {
        btn.addEventListener('click', () => startPlay(btn.closest('.video-inline')));
      });

      // IntersectionObserver: ставим на паузу, когда карточка уходит из зоны видимости
      const io = new IntersectionObserver((entries) => {
        entries.forEach((e) => {
          const wrap = e.target;
          const vid = wrap.querySelector('video');
          if (!vid) return;
          if (!e.isIntersecting && !vid.paused) {
            vid.pause();
          }
        });
      }, { threshold: 0.25 }); // ~25% карточки вне экрана — пауза

      document.querySelectorAll('#video .video-inline').forEach(w => io.observe(w));
    }
  };

  // формат 0:42 / 1:02:03
  const fmtDur = (sec) => {
    sec = Math.max(0, Math.floor(sec || 0));
    const h = Math.floor(sec / 3600);
    const m = Math.floor((sec % 3600) / 60);
    const s = sec % 60;
    return h ? `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
      : `${m}:${String(s).padStart(2, '0')}`;
  };

  const ensureDuration = (wrap) => {
    const badge = wrap.querySelector('.video-duration');
    if (!badge || badge.textContent) return;

    const probe = document.createElement('video');
    probe.preload = 'metadata';
    probe.src = wrap.dataset.src;
    probe.addEventListener('loadedmetadata', () => {
      badge.textContent = fmtDur(probe.duration);
      badge.classList.add('is-ready');
      probe.src = ''; // освобождаем ресурсы
    }, { once: true });
  };

  // лениво подтягиваем длительность, когда карточка рядом с вьюпортом
  const durIO = new IntersectionObserver((entries) => {
    entries.forEach(e => {
      if (e.isIntersecting) {
        ensureDuration(e.target);
        durIO.unobserve(e.target);
      }
    });
  }, { rootMargin: '200px 0px', threshold: 0.1 });

  document.querySelectorAll('#video .video-inline').forEach(w => durIO.observe(w));

  // ==== STICKY CTA (мобилка): FAB WhatsApp + раскрывающаяся панель
  {
    const PHONE = '+78312288022';
    const WA_NUM = '79534157494';
    const waText = encodeURIComponent('Здравствуйте! Хочу получить смету по вашей услуге.');
    const waHref = `https://wa.me/${WA_NUM}?text=${waText}`;

    // контейнер
    const bar = document.createElement('div');
    bar.className = 'sticky-cta';

    // FAB (круглая) — WhatsApp
    const fab = document.createElement('button');
    fab.className = 'sticky-cta__fab sticky-cta__fab--wa';
    fab.type = 'button';
    fab.setAttribute('aria-expanded', 'false');
    fab.setAttribute('aria-controls', 'stickyPanel');
    fab.setAttribute('aria-label', 'Открыть быстрые действия (WhatsApp)');
    fab.innerHTML = `
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <path fill="currentColor" d="M19.11 17.62c-.27-.14-1.57-.78-1.82-.87c-.24-.09-.42-.14-.6.14c-.18.27-.69.86-.84 1.04c-.15.18-.31.2-.57.07c-.27-.14-1.12-.41-2.13-1.31c-.79-.7-1.32-1.57-1.47-1.83c-.15-.27-.02-.41.12-.55c.12-.12.27-.31.41-.46c.14-.16.18-.27.27-.46c.09-.18.05-.34-.02-.48c-.07-.14-.6-1.45-.82-1.98c-.22-.53-.44-.46-.6-.46c-.16 0-.34-.02-.53-.02s-.48.07-.73.34c-.25.27-.96.94-.96 2.29c0 1.35.99 2.65 1.13 2.84c.14.18 1.95 2.98 4.72 4.04c.66.26 1.18.41 1.59.52c.67.17 1.29.15 1.77.09c.54-.08 1.57-.64 1.79-1.26c.22-.62.22-1.15.15-1.26c-.07-.11-.25-.18-.52-.32z"/>
      <path fill="currentColor" d="M16 3.2c-7.04 0-12.8 5.76-12.8 12.8c0 2.26.61 4.38 1.67 6.2L3.2 28.8l6.77-1.64c1.76.96 3.76 1.52 5.9 1.52c7.04 0 12.8-5.76 12.8-12.8S23.04 3.2 16 3.2zm0 23.04c-1.92 0-3.7-.55-5.2-1.49l-.37-.23l-4.02.98l1.07-3.91l-.24-.4a9.57 9.57 0 0 1-1.47-5.1c0-5.29 4.3-9.6 9.6-9.6s9.6 4.31 9.6 9.6s-4.31 9.6-9.6 9.6z"/>
    </svg>
  `;

    // панель с действиями
    const panel = document.createElement('div');
    panel.className = 'sticky-cta__panel';
    panel.id = 'stickyPanel';
    panel.hidden = true;
    panel.innerHTML = `
    <a class="sticky-cta__btn sticky-cta__btn--primary" href="#form">Смета</a>
    <a class="sticky-cta__btn" href="tel:${PHONE}">Позвонить</a>
    <a class="sticky-cta__btn" href="${waHref}" target="_blank" rel="noopener">WhatsApp</a>
  `;

    // помечаем кнопку "Смета" для общего обработчика
    const panelQuote = panel.querySelector('a[href="#form"]');
    if (panelQuote) {
      panelQuote.dataset.cta = 'quote';
      panelQuote.dataset.source = 'sticky';
    }


    bar.appendChild(panel);
    bar.appendChild(fab);
    document.body.appendChild(bar);

    // раскрытие/сворачивание (function declarations)
    function expand() { bar.classList.add('is-expanded'); panel.hidden = false; fab.setAttribute('aria-expanded', 'true'); }
    function collapse() { bar.classList.remove('is-expanded'); panel.hidden = true; fab.setAttribute('aria-expanded', 'false'); }

    // показать только на мобилке — можно оставить в текущем месте
    const mq = window.matchMedia('(max-width: 768px)');
    const applyMQ = () => {
      bar.classList.toggle('is-active', mq.matches);
      if (!mq.matches) collapse();
    };
    applyMQ();
    mq.addEventListener('change', applyMQ);

    fab.addEventListener('click', (e) => {
      e.stopPropagation();
      bar.classList.contains('is-expanded') ? collapse() : expand();
    });
    document.addEventListener('click', (e) => { if (!bar.contains(e.target)) collapse(); });
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') collapse(); });

    // плавный скролл до формы
    panel.querySelector('a[href="#form"]')?.addEventListener('click', (e) => {
      e.preventDefault(); collapse();
      document.getElementById('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });

    // скрывать возле формы
    const formSec = document.getElementById('form');
    if (formSec && 'IntersectionObserver' in window) {
      const io = new IntersectionObserver((entries) => {
        entries.forEach(e => {
          bar.classList.toggle('is-hidden', e.isIntersecting && e.intersectionRatio > 0.5);
        });
      }, { threshold: [0, 0.5, 1] });
      io.observe(formSec);
    }
  }

  // ==== Scroll To Top (локальная для страницы услуг)
  {
    if (!document.getElementById('toTopLocal')) {
      const btn = document.createElement('button');
      btn.id = 'toTopLocal';
      btn.className = 'to-top-local';
      btn.type = 'button';
      btn.setAttribute('aria-label', 'Наверх');
      btn.innerHTML = `
      <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
        viewBox="0 0 24 24" fill="none" stroke="currentColor"
        stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="18 15 12 9 6 15"></polyline>
      </svg>`;
      document.body.appendChild(btn);

      const showAt = 250; // показываем раньше
      const updateVisibility = () => {
        btn.classList.toggle('show', window.scrollY > showAt);
        updateOffset();
      };

      const updateOffset = () => {
        const sticky = document.querySelector('.sticky-cta');
        const isMobile = window.matchMedia('(max-width: 768px)').matches;
        const isExpanded = sticky && sticky.classList.contains('is-expanded');
        const fab = sticky?.querySelector('.sticky-cta__fab');

        // режим "рядом с WhatsApp" — ТОЛЬКО на мобиле и когда панель раскрыта
        if (isMobile && isExpanded && fab) {
          const r = fab.getBoundingClientRect();
          // ставим кнопку чуть правее FAB и на ту же высоту снизу
          btn.style.left = (r.left + window.scrollX + r.width + 12) + 'px';
          btn.style.right = 'auto';
          btn.style.bottom = 'calc(env(safe-area-inset-bottom) + 12px)';
        } else {
          // обычный режим справа
          btn.style.left = 'auto';
          btn.style.right = '20px';

          let bottom = 20;
          // если просто виден FAB (панель свёрнута) — поднимем выше круга
          if (isMobile) bottom = 72;
          btn.style.bottom = `calc(env(safe-area-inset-bottom) + ${bottom}px)`;
        }
      };
      ;

      btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
      window.addEventListener('scroll', updateVisibility, { passive: true });
      window.addEventListener('resize', updateOffset);

      const sticky = document.querySelector('.sticky-cta');
      if (sticky && 'MutationObserver' in window) {
        const mo = new MutationObserver(updateOffset);
        mo.observe(sticky, { attributes: true, attributeFilter: ['class'] });
      }

      updateVisibility();
    }
  }


  // Контекст для "Смета"
  // === Универсальный обработчик кнопок "Смета"
  (() => {
    const serviceSlug = new URLSearchParams(location.search).get('slug') || 'aps';

    // гарантируем скрытые поля в форме
    const ensureHidden = () => {
      const f = document.getElementById('leadForm');
      if (!f) return null;
      const need = [
        ['leadService', 'service', serviceSlug],
        ['leadPackage', 'package', ''],
        ['leadSource', 'source', '']
      ];
      need.forEach(([id, name, val]) => {
        if (!f.querySelector('#' + id)) {
          const i = document.createElement('input');
          i.type = 'hidden'; i.name = name; i.id = id; i.value = val;
          f.appendChild(i);
        }
      });
      return f;
    };

    const setContextAndFocus = ({ source, pack }) => {
      const f = ensureHidden();
      if (!f) return;

      f.querySelector('#leadService').value = serviceSlug;
      f.querySelector('#leadSource').value = source || 'unknown';
      f.querySelector('#leadPackage').value = pack || '';

      // подсказка в сообщении
      const msg = f.querySelector('textarea[name="message"]');
      if (msg && pack && !msg.value) msg.placeholder = `Пакет: ${pack}. Коротко опишите объект…`;

      // если открыта панель FAB — сворачиваем, чтобы не перекрывала
      document.querySelector('.sticky-cta.is-expanded')?.classList.remove('is-expanded');

      // плавный скролл и фокус
      document.getElementById('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setTimeout(() => {
        (f.querySelector('input[name="phone"]') || f.querySelector('input,textarea'))?.focus();
      }, 350);

      // аналитика (если нужно)
      window.dataLayer?.push({ event: 'cta_quote_click', service: serviceSlug, source, package: pack || '' });
    };

    // делегирование по всем data-cta="quote"
    document.addEventListener('click', (e) => {
      const el = e.target.closest('[data-cta="quote"]');
      if (!el) return;
      e.preventDefault();
      setContextAndFocus({
        source: el.dataset.source || 'unknown',
        pack: el.dataset.package || ''
      });
    });
  })();

  // делегирование по всем data-cta="quote"
  document.addEventListener('click', (e) => {
    const el = e.target.closest('[data-cta="quote"]');
    if (!el) return;
    e.preventDefault();

    const source = el.dataset.source || 'unknown';
    const pack = el.dataset.package || '';

    // прокрутка к форме всегда
    document.getElementById('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });

    // и только если форма есть — подставим контекст и фокус
    const f = document.getElementById('leadForm');
    if (f) {
      $('leadService').value = (new URLSearchParams(location.search).get('slug')) || 'aps';
      $('leadSource').value = source;
      $('leadPackage').value = pack;

      const msg = f.querySelector('textarea[name="message"]');
      if (msg && pack && !msg.value) msg.placeholder = `Пакет: ${pack}. Коротко опишите объект…`;

      setTimeout(() => (f.querySelector('input[name="phone"]') || f.querySelector('input,textarea'))?.focus(), 300);
    }
  });



})();
