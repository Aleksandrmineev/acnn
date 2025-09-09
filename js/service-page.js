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
    .map(text => `<li class="cardservice"><span class="usp-bullet" aria-hidden="true">✓</span>${text}</li>`)
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


})();
