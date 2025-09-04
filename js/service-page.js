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
  if (data.hero?.bg) $('hero').style.backgroundImage = `url(${data.hero.bg})`;
  $('title').textContent = data.title || '';
  $('subtitle').textContent = data.subtitle || '';
  $('usp').innerHTML = (data.usp || []).map(i => `<li class="card">${i}</li>`).join('');

  // Features
  // Features (красивые карточки с иконками и кликом при наличии href)
  const pickIcon = (t = "") => {
    const s = t.toLowerCase();
    if (s.includes("проект")) return "📐";
    if (s.includes("поставка")) return "📦";
    if (s.includes("монтаж")) return "🛠";
    if (s.includes("пнр") || s.includes("настрой")) return "⚙️";
    if (s.includes("сдача") || s.includes("док")) return "🧾";
    if (s.includes("сервис") || s.includes("то")) return "🔧";
    return "✅";
  };

  features.innerHTML = `
  <h2>Что входит</h2>
  <div class="grid grid--3">
    ${(data.features || []).map(f => {
    const icon = f.icon || pickIcon(f.title);
    const inner = `
        <div class="card__icon" aria-hidden="true">${icon}</div>
        <h3 class="card__title">${f.title || ""}</h3>
        ${f.desc ? `<p class="card__text">${f.desc}</p>` : ""}
        ${f.href ? `<div class="card__footer"><span class="card__link">Подробнее</span></div>` : ""}
      `;
    return f.href
      ? `<a class="card card--clickable" href="${f.href}">${inner}</a>`
      : `<div class="card">${inner}</div>`;
  }).join("")}
  </div>`;


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

  // Licenses
  $('licenses').innerHTML = (data.licenses || []).length ? `
      <h2>Лицензии и сертификаты</h2>
      <div class="grid grid--4">
        ${data.licenses.map(l => `
          <a class="card" href="${l.img}" data-gallery="lic">
            <img src="${l.img}" alt="${l.name}" loading="lazy" style="width:100%;border-radius:12px">
            <p>${l.name}</p>
          </a>`).join('')}
      </div>` : '';
  if (document.querySelector('#licenses a[data-gallery="lic"]')) GLightbox({ selector: '#licenses a[data-gallery="lic"]' });

  // Docs
  $('docs').innerHTML = (data.docs || []).length ? `
      <h2>Документы</h2>
      <ul class="doc-list">
        ${data.docs.map(d => {
    const isImg = d.preview === true || /\.(png|jpe?g|webp|avif)$/i.test(d.file);
    return isImg
      ? `<li><a href="${d.file}" data-gallery="docs">${d.name}</a></li>`
      : `<li><a href="${d.file}" target="_blank" rel="noopener">${d.name}</a></li>`;
  }).join('')}
      </ul>` : '';
  if (document.querySelector('#docs a[data-gallery="docs"]')) GLightbox({ selector: '#docs a[data-gallery="docs"]' });

  // FAQ / GEO / Warranty
  $('faq').innerHTML = (data.faq || []).length
    ? `<h2>Частые вопросы</h2>${data.faq.map(f => `<details><summary>${f.q}</summary><div>${f.a}</div></details>`).join('')}` : '';
  $('geo').innerHTML = (data.areas || []).length ? `<h2>География работ</h2><div class="card">${data.areas.join(', ')}</div>` : '';
  $('warranty').innerHTML = data.warranty ? `<h2>Гарантия и сервис</h2><div class="card">${data.warranty}</div>` : '';

  // Schema.org
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    "name": data.title,
    "description": data.seo?.description || data.subtitle,
    "areaServed": data.areas || []
  };
  const faqSchema = (data.faq || []).length ? {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": data.faq.map(x => ({
      "@type": "Question", "name": x.q,
      "acceptedAnswer": { "@type": "Answer", "text": x.a }
    }))
  } : null;
  $('schema').textContent = JSON.stringify(faqSchema ? [serviceSchema, faqSchema] : [serviceSchema]);

  // Активный пункт меню
  document.querySelectorAll('a[href*="/uslugi/"]').forEach(a => a.classList.add('is-active'));
})();
