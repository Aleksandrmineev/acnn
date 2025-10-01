document.addEventListener("DOMContentLoaded", () => {
  (async () => {
    // 1) сначала подставим фрагменты (header, footer и т.п.)
    await loadIncludes();

    // 2) потом — все инициализации, которые требуют уже вставленный header
    initForm();
    initBurger();             // ← теперь burger точно найдёт элементы
    initToTop();
    initServiceModal();
    initInlineVideos();
    initServicesSlider();
    initProjectSliderWithLightbox();
    initProcessTabs();
    initRelatedSlider();
    initStickyCta();

    // advantages (если используешь V3-D без Lottie)
    initAdvV3DMagnet?.();
    revealAdvV3D?.();
    initAdvV3DTilt?.();

    // год в футере
    const y = document.getElementById('year');
    if (y) y.textContent = new Date().getFullYear();
  })();
});



function initAdvV3DTilt() {
  const isTouch = matchMedia('(hover: none)').matches;
  if (isTouch) return;
  document.querySelectorAll('.adv3-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
      card.style.transform = `translateY(0) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
}


/* =========================
   ФОРМА
========================= */
function initForm() {
  const form = document.getElementById("form");
  const successMessage = document.getElementById("formSuccess");
  if (!form) return;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const name = form.name?.value.trim() || "";
    const phone = (form.phone?.value || "").trim().replace(/\D/g, "");
    const email = (form.email?.value || "").trim();
    const messageText = form.message?.value.trim() || "";

    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || phone.length < 10 || !emailOk || !messageText) {
      alert("Проверьте поля: имя, телефон (10+ цифр), email и сообщение.");
      return;
    }

    // ⚠️ Не храни токен в фронте в проде
    const TOKEN = "<TG_BOT_TOKEN>";
    const CHAT_ID = "<CHAT_ID>";
    const TG_URL = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/1goqfnfbv28hf29qpkjxfdd00x9f639j";

    const message =
      `<b>Новая заявка</b>\n<b>Имя:</b> ${name}\n<b>Телефон:</b> ${phone}\n<b>Email:</b> ${email}\n<b>Сообщение:</b> ${messageText}`;

    try {
      await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message: messageText }),
      });

      if (TOKEN !== "<TG_BOT_TOKEN>") {
        await fetch(TG_URL, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ chat_id: CHAT_ID, text: message, parse_mode: "HTML" }),
        });
      }

      if (successMessage) {
        successMessage.style.display = "block";
        setTimeout(() => (successMessage.style.display = "none"), 5000);
      }
      form.reset();
    } catch (err) {
      console.error("Send error:", err);
      alert("Ошибка отправки. Попробуйте ещё раз.");
    }
  });
}

/* =========================
   БУРГЕР-МЕНЮ
========================= */
function initBurger({ moveToBody = false, burgerSel = '.burger', menuSel = '.mobile-menu' } = {}) {
  const burger = document.querySelector(burgerSel);
  const menu = document.querySelector(menuSel);
  if (!burger || !menu) return;

  if (burger.dataset.inited === '1') return; // защита от повторной инициализации
  burger.dataset.inited = '1';

  // опционально переносим меню в body (если мешают transform-родители)
  if (moveToBody && menu.parentElement !== document.body) {
    document.body.appendChild(menu);
  }

  // a11y + id
  if (!menu.id) menu.id = 'mobile-menu';
  burger.setAttribute('aria-controls', menu.id);
  burger.setAttribute('aria-expanded', 'false');
  menu.setAttribute('role', 'dialog');      // или 'navigation'
  menu.setAttribute('aria-modal', 'true');
  menu.setAttribute('aria-hidden', 'true');

  const FOCUSABLE = 'a[href], button:not([disabled]), [role="button"], input, select, textarea, [tabindex]:not([tabindex="-1"])';
  let lastFocus = null;

  const lockScroll = (yes) => {
    document.documentElement.classList.toggle('lock', yes);
    document.body.classList.toggle('lock', yes);
  };

  const open = () => {
    lastFocus = document.activeElement;
    menu.classList.add('active');
    burger.classList.add('burger--active');
    burger.setAttribute('aria-expanded', 'true');
    menu.setAttribute('aria-hidden', 'false');
    lockScroll(true);
    // фокус внутрь
    const first = menu.querySelector(FOCUSABLE) || menu;
    first.focus({ preventScroll: true });
  };

  const close = () => {
    menu.classList.remove('active');
    burger.classList.remove('burger--active');
    burger.setAttribute('aria-expanded', 'false');
    menu.setAttribute('aria-hidden', 'true');
    lockScroll(false);
    // вернуть фокус
    if (lastFocus && document.contains(lastFocus)) lastFocus.focus({ preventScroll: true });
  };

  // клик по бургеру
  burger.addEventListener('click', (e) => {
    e.preventDefault();
    const isOpen = menu.classList.contains('active');
    isOpen ? close() : open();
  });

  // клик по ссылке внутри — закрываем
  menu.addEventListener('click', (e) => {
    const t = e.target;
    if (t.closest('a')) { close(); return; }
    // клик по подложке (если меню — полноэкранный overlay)
    if (e.target === menu) { close(); return; }
    // кнопка-крестик
    if (t.closest('[data-close], .mobile-menu__close')) { close(); return; }
  });

  // клик вне меню — закрыть
  document.addEventListener('click', (e) => {
    if (!menu.classList.contains('active')) return;
    const inMenu = menu.contains(e.target);
    const onBurger = burger.contains(e.target);
    if (!inMenu && !onBurger) close();
  });

  // Esc + trap Tab
  document.addEventListener('keydown', (e) => {
    if (!menu.classList.contains('active')) return;

    if (e.key === 'Escape') {
      e.stopPropagation();
      close();
    } else if (e.key === 'Tab') {
      const f = Array.from(menu.querySelectorAll(FOCUSABLE)).filter(el => el.offsetParent !== null);
      if (!f.length) { e.preventDefault(); return; }
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
}


/* =========================
   КНОПКА "ВВЕРХ"
========================= */
function initToTop({ selector = '.to-top', threshold = 400 } = {}) {
  const btn = document.querySelector(selector);
  if (!btn) return;

  // авто-определение скролл-контейнера
  const candidates = [
    document.scrollingElement || document.documentElement,
    document.querySelector('.wrapper'),
    document.querySelector('main')
  ].filter(Boolean);

  let root = candidates[0];
  for (const el of candidates) {
    const cs = getComputedStyle(el);
    const canScroll = (el.scrollHeight - el.clientHeight) > 50 &&
      /(auto|scroll)/.test(cs.overflowY);
    if (canScroll) { root = el; break; }
  }

  const isDoc = (el) => el === document.documentElement || el === document.body;

  const getY = () => isDoc(root) ? (window.pageYOffset || document.documentElement.scrollTop) : root.scrollTop;
  const onScroll = () => requestAnimationFrame(() => {
    if (getY() > threshold) btn.classList.add('show');
    else btn.classList.remove('show');
  });

  if (isDoc(root)) window.addEventListener('scroll', onScroll, { passive: true });
  else root.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  btn.addEventListener('click', (e) => {
    e.preventDefault();
    const opts = { top: 0, behavior: 'smooth' };
    if (isDoc(root)) window.scrollTo(opts);
    else root.scrollTo(opts);
  });
}



/* =========================
   МОДАЛКА УСЛУГ
========================= */
function initServiceModal() {
  const modal = document.getElementById("serviceModal");
  const closeBtn = document.querySelector(".modal__close");
  if (!modal) return;

  const textEl = document.getElementById("modalText");
  const open = (type) => {
    if (textEl) textEl.textContent = getServiceText(type);
    modal.style.display = "flex";
    document.body.classList.add('lock');
  };
  const close = () => {
    modal.style.display = "none";
    document.body.classList.remove('lock');
  };

  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => open(card.dataset.service));
  });

  closeBtn?.addEventListener("click", close);
  window.addEventListener("click", (e) => { if (e.target === modal) close(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape") close(); });
}

function getServiceText(type) {
  switch (type) {
    case "fire": return "Пожарная сигнализация обеспечивает своевременное обнаружение и оповещение о возгорании...";
    case "security": return "Охранная сигнализация защищает объект от проникновения...";
    case "video": return "Система видеонаблюдения позволяет контролировать происходящее в реальном времени...";
    case "access": return "Контроль доступа обеспечивает безопасность входа и учёт персонала...";
    case "alarm": return "Система оповещения о пожаре обеспечивает звуковое и световое оповещение в случае ЧС.";
    case "smoke": return "Система дымоудаления удаляет продукты горения и обеспечивает безопасную эвакуацию.";
    case "extinguish": return "Автоматическое пожаротушение применяет воду, пену или газ при возгорании.";
    case "audit": return "Пожарный аудит выявляет риски и проверяет соответствие нормативам.";
    case "evacuation": return "План эвакуации с маршрутами выхода под ваш объект.";
    case "fireproofing": return "Огнезащита повышает предел огнестойкости конструкций.";
    default: return "";
  }
}

/* =========================
   ВИДЕО-ОБЁРТКИ
========================= */
function initInlineVideos() {
  document.querySelectorAll("[data-video]").forEach((wrapper) => {
    const video = wrapper.querySelector("video");
    const playBtn = wrapper.querySelector(".video-play");
    if (!video || !playBtn) return;

    const playVideo = () => {
      wrapper.classList.add("playing");
      playBtn.style.display = "none";
      video.play();
    };

    playBtn.addEventListener("click", (e) => { e.stopPropagation(); playVideo(); });

    wrapper.addEventListener("click", () => {
      if (video.paused) playVideo();
      else { video.pause(); playBtn.style.display = "block"; }
    });

    video.addEventListener("ended", () => {
      wrapper.classList.remove("playing");
      playBtn.style.display = "block";
    });
  });
}

/* =========================
   СЛАЙДЕР ДОП. УСЛУГ
========================= */
function initServicesSlider() {
  const el = document.querySelector(".js-services-slider");
  if (!el || !window.Swiper || typeof Swiper !== "function") return;

  const slidesCount = el.querySelectorAll(".swiper-slide").length;

  const perViewForWidth = (w) => {
    if (w >= 1200) return 3;
    if (w >= 940) return 3;
    if (w >= 640) return 2;
    return 1;
  };

  let swiper;

  const setup = () => {
    const perView = perViewForWidth(window.innerWidth);
    const shouldLoop = slidesCount > perView + 1; // небольшой запас, чтобы цикл работал гладко

    swiper = new Swiper(el, {
      slidesPerView: 1,
      spaceBetween: 16,
      slidesPerGroup: 1,
      loop: shouldLoop,
      watchOverflow: true,
      pagination: { el: ".services__pagination", clickable: true },
      navigation: { nextEl: ".services__next", prevEl: ".services__prev" },
      breakpoints: {
        640: { slidesPerView: 2, spaceBetween: 16 },
        940: { slidesPerView: 3, spaceBetween: 20 },
        1200: { slidesPerView: 3, spaceBetween: 24 },
      },
    });

    // если слайдов 1–2 — спрячем навигацию/точки, чтобы не мелькали
    const pag = el.querySelector(".services__pagination");
    const prev = el.querySelector(".services__prev");
    const next = el.querySelector(".services__next");
    const few = slidesCount <= perView;
    pag && (pag.style.display = few ? "none" : "");
    prev && (prev.style.display = few ? "none" : "");
    next && (next.style.display = few ? "none" : "");
  };

  setup();

  // если при ресайзе меняется perView так, что меняется логика loop — пересоздадим
  let lastPerView = perViewForWidth(window.innerWidth);
  window.addEventListener("resize", () => {
    const now = perViewForWidth(window.innerWidth);
    if (now !== lastPerView) {
      swiper && swiper.destroy(true, true);
      lastPerView = now;
      setup();
    }
  }, { passive: true });
}


/* =========================
   ПРОЕКТ: Swiper + GLightbox
========================= */
function initProjectSliderWithLightbox() {
  const el = document.querySelector(".js-project-slider");
  if (!el) return;

  const imgs = el.querySelectorAll(".swiper-slide img");
  const slidesCount = imgs.length;
  const galleryName = el.dataset.gallery || "project-gallery";

  // оборачиваем изображения в ссылки (если ещё не)
  imgs.forEach((img) => {
    if (img.closest("a")) return;
    const a = document.createElement("a");
    a.className = "glightbox";
    a.href = img.getAttribute("data-full") || img.src;
    a.setAttribute("data-gallery", galleryName);
    a.setAttribute("aria-label", img.alt || "Фото проекта");
    img.parentNode.insertBefore(a, img);
    a.appendChild(img);
  });

  let lightbox = null;
  if (typeof GLightbox === "function") {
    lightbox = GLightbox({
      selector: `.js-project-slider .glightbox[data-gallery="${galleryName}"]`,
      touchNavigation: true,
      keyboardNavigation: true,
      closeOnOutsideClick: true,
      loop: true,
      openEffect: "zoom",
      closeEffect: "fade",
      slideEffect: "slide",
    });
  } else {
    console.warn("GLightbox не найден: проверь подключение glightbox.min.js и .css");
  }

  if (slidesCount <= 2) {
    el.classList.add("no-swiper");
    if (slidesCount === 2) el.classList.add("has-2");
    return;
  }

  if (!window.Swiper || typeof Swiper !== "function") return;

  // eslint-disable-next-line no-new
  new Swiper(el, {
    loop: true,
    spaceBetween: 24,
    slidesPerView: 1,
    breakpoints: { 768: { slidesPerView: 2 } },
    pagination: { el: el.querySelector(".project__pagination"), clickable: true },
    navigation: {
      prevEl: el.querySelector(".project__prev"),
      nextEl: el.querySelector(".project__next"),
    },
    observer: true,
    observeParents: true,
    preventClicks: false,
    preventClicksPropagation: false,
  });

  // если будет динамическая подмена слайдов:
  // swiper.on('slideChangeTransitionEnd', () => { lightbox && lightbox.reload(); });
}

/* =========================
   ПРОЦЕСС (табы)
========================= */
function initProcessTabs(selector = '.js-process-tabs') {
  document.querySelectorAll(selector).forEach(root => {
    const tablist = root.querySelector('.process-tabs__list');
    const tabs = Array.from(root.querySelectorAll('.process-tab'));
    const panels = Array.from(root.querySelectorAll('.process-panel'));
    if (!tablist || !tabs.length || !panels.length) return;

    const byId = id => root.querySelector(`#${id}`);
    const activate = (tab) => {
      const targetId = tab.getAttribute('aria-controls');
      const panel = byId(targetId);
      tabs.forEach(t => { t.classList.remove('is-active'); t.setAttribute('aria-selected', 'false'); t.setAttribute('tabindex', '-1'); });
      panels.forEach(p => { p.classList.remove('is-active'); p.hidden = true; });
      tab.classList.add('is-active'); tab.setAttribute('aria-selected', 'true'); tab.setAttribute('tabindex', '0');
      if (panel) { panel.hidden = false; panel.classList.add('is-active'); }
      tab.scrollIntoView({ inline: 'nearest', behavior: 'smooth', block: 'nearest' });
    };

    tabs.forEach(tab => tab.addEventListener('click', () => activate(tab)));

    tablist.addEventListener('keydown', (e) => {
      const current = document.activeElement;
      if (!current.classList.contains('process-tab')) return;
      let idx = tabs.indexOf(current);
      if (e.key === 'ArrowRight' || e.key === 'ArrowDown') { idx = (idx + 1) % tabs.length; e.preventDefault(); tabs[idx].focus(); activate(tabs[idx]); }
      else if (e.key === 'ArrowLeft' || e.key === 'ArrowUp') { idx = (idx - 1 + tabs.length) % tabs.length; e.preventDefault(); tabs[idx].focus(); activate(tabs[idx]); }
      else if (e.key === 'Home') { e.preventDefault(); tabs[0].focus(); activate(tabs[0]); }
      else if (e.key === 'End') { e.preventDefault(); tabs[tabs.length - 1].focus(); activate(tabs[tabs.length - 1]); }
    });

    const openByHash = () => {
      const m = window.location.hash.match(/^#process-([\w-]+)$/i);
      if (!m) return;
      const value = m[1];
      const tab = tabs.find(t => t.dataset.tab === value);
      if (tab) activate(tab);
    };
    openByHash();
    window.addEventListener('hashchange', openByHash);
  });
}
/* =========================
   Слайдер «Похожие проекты»
========================= */
function initRelatedSlider() {
  const el = document.querySelector('.js-related-slider');
  if (!el || !window.Swiper || typeof Swiper !== 'function') return;

  new Swiper(el, {
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,
    watchOverflow: true,
    keyboard: { enabled: true },
    a11y: { enabled: true },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 16 },
      992: { slidesPerView: 3, spaceBetween: 24 }
    },
    pagination: { el: el.querySelector('.related__pagination'), clickable: true },
    navigation: { prevEl: el.querySelector('.related__prev'), nextEl: el.querySelector('.related__next') },
    preventClicks: false,
    preventClicksPropagation: false
  });
}

document.addEventListener('DOMContentLoaded', () => {
  initAdvV3DLottie();
  initAdvV3DMagnet();
  revealAdvV3D();
});


/* =========================
   PROJECT PAGE (Splide + GLightbox)
========================= */
function initProjectPage() {
  // Лайтбокс только для верхнего блока
  if (typeof GLightbox !== 'undefined') {
    GLightbox({
      selector: '.project__hero .glightbox',
      loop: true,
      touchNavigation: true,
      keyboardNavigation: true,
      plyr: { css: '' },
    });
  }

  // Верхний Splide
  const topRoot = document.querySelector('.project__hero .js-project-splide');
  if (topRoot && typeof Splide !== 'undefined') {
    new Splide(topRoot, {
      type: 'loop',
      perPage: 2,
      gap: '16px',
      arrows: true,
      pagination: true,
      speed: 600,
      breakpoints: {
        768: { perPage: 1, gap: '12px' },
        480: { perPage: 1, gap: '10px' },
      },
    }).mount();
  }

  // Нижний Splide (Похожие проекты)
  const relRoot = document.querySelector('.project__related .js-related-splide');
  if (relRoot && typeof Splide !== 'undefined') {
    new Splide(relRoot, {
      type: 'loop',
      perPage: 3,
      gap: '16px',
      arrows: true,
      pagination: true,
      speed: 600,
      breakpoints: {
        1024: { perPage: 3, gap: '14px' },
        768: { perPage: 1, gap: '12px' },
        480: { perPage: 1, gap: '10px' },
      },
    }).mount();
  }
}

// Авто-инициализация
document.addEventListener('DOMContentLoaded', () => {
  initProjectPage();
});


function initAdvV3DLottie() {
  if (!window.lottie) return; // fallback покажет SVG

  document.querySelectorAll('.adv3-lottie').forEach(el => {
    const path = el.dataset.lottie;
    if (!path) return;

    const anim = lottie.loadAnimation({
      container: el,
      renderer: 'svg',
      loop: false,
      autoplay: false,
      path
    });
    el._anim = anim;

    const seg = (el.dataset.seg || '').split(',').map(n => parseInt(n, 10)).filter(n => !isNaN(n));
    const parent = el.closest('.adv3-card');

    // hover play
    parent.addEventListener('mouseenter', () => {
      if (!anim || document.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
      if (seg.length === 2) anim.playSegments(seg, true);
      else anim.goToAndPlay(0, true);
    });
    parent.addEventListener('mouseleave', () => {
      if (!anim) return;
      anim.stop(); // вернёмся к первому кадру
    });
  });

  // play-on-view (один раз, мягко)
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (!en.isIntersecting) return;
      const el = en.target;
      const anim = el._anim;
      if (anim && !document.matchMedia('(prefers-reduced-motion: reduce)').matches) {
        anim.goToAndPlay(0, true);
        setTimeout(() => anim.stop(), 900); // короткий «оживляющий» прогон
      }
      io.unobserve(el);
    });
  }, { threshold: .4 });

  document.querySelectorAll('.adv3-lottie').forEach(el => io.observe(el));
}

/* Magnet hover: иконка чуть тянется к курсору */
function initAdvV3DMagnet() {
  const isTouch = matchMedia('(hover: none)').matches;
  if (isTouch) return;

  document.querySelectorAll('.adv3-card').forEach(card => {
    const wrap = card.querySelector('[data-magnet]');
    if (!wrap) return;
    const strength = 10; // px

    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const x = e.clientX - r.left - r.width / 2;
      const y = e.clientY - r.top - r.height / 2;
      const nx = Math.max(-1, Math.min(1, x / (r.width / 2)));
      const ny = Math.max(-1, Math.min(1, y / (r.height / 2)));
      wrap.style.transform = `translate3d(${nx * strength}px, ${ny * strength}px, 0)`;
    });

    card.addEventListener('mouseleave', () => {
      wrap.style.transform = 'translate3d(0,0,0)';
    });
  });
}

/* Reveal on scroll */
function revealAdvV3D() {
  const cards = document.querySelectorAll('.adv3-card');
  const io = new IntersectionObserver((entries) => {
    entries.forEach(en => {
      if (en.isIntersecting) { en.target.classList.add('is-in'); io.unobserve(en.target); }
    });
  }, { threshold: .25 });
  cards.forEach(c => io.observe(c));
}

// Tilt всей карточки
(function () {
  const isTouch = matchMedia('(hover: none)').matches;
  if (isTouch) return;
  document.querySelectorAll('.adv3-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      const r = card.getBoundingClientRect();
      const rx = ((e.clientY - r.top) / r.height - 0.5) * -6;
      const ry = ((e.clientX - r.left) / r.width - 0.5) * 6;
      card.style.transform = `translateY(0) rotateX(${rx}deg) rotateY(${ry}deg)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = ''; });
  });
})();


// Грузим все фрагменты [data-include] и возвращаем Promise
async function loadIncludes() {
  const nodes = Array.from(document.querySelectorAll('[data-include]'));
  await Promise.all(nodes.map(async (el) => {
    const src = el.getAttribute('data-include');
    if (!src) return;
    const url = new URL(src, location.href).href;
    const res = await fetch(url, { credentials: 'same-origin' });
    if (!res.ok) { console.error('include load error', src, res.status); return; }
    const html = await res.text();
    const tpl = document.createElement('template');
    tpl.innerHTML = html.trim();
    el.replaceWith(tpl.content.cloneNode(true));
  }));
}


// добавляем кнопку "Наверх", если её нет в DOM
function ensureToTopButton() {
  if (document.querySelector('.to-top')) return; // уже есть
  const btn = document.createElement('button');
  btn.className = 'to-top';
  btn.setAttribute('aria-label', 'Наверх');
  btn.innerHTML = `
    <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20"
         viewBox="0 0 24 24" fill="none" stroke="currentColor"
         stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
      <polyline points="18 15 12 9 6 15"></polyline>
    </svg>`;
  document.body.appendChild(btn);
}

document.addEventListener('DOMContentLoaded', () => {
  (async () => {
    await loadIncludes();       // сначала подставляем partials
    ensureToTopButton();        // затем гарантируем наличие кнопки
    initToTop({ threshold: 300 }); // и только потом инициализируем её

    // ...остальные init
  })();
});

function initStickyCta() { 
  if (document.getElementById('stickyCta')) return;

  // Телефон берём из первого tel: на странице (fallback – городской)
  const telFromDom = document.querySelector('a[href^="tel:"]')?.getAttribute('href') || '+78312288022';
  const PHONE = telFromDom.replace(/^tel:/, '');
  // НОВЫЙ номер для WhatsApp (не как у телефона)
  const WA_NUM = '+79534157494';
  const waHref = 'https://wa.me/' + WA_NUM.replace(/\D/g, '');

  const bar = document.createElement('div');
  bar.className = 'sticky-cta';
  bar.id = 'stickyCta';

  const fab = document.createElement('button');
  fab.type = 'button';
  fab.className = 'sticky-cta__fab sticky-cta__fab--wa';
  fab.setAttribute('aria-expanded', 'false');
  fab.setAttribute('aria-label', 'Открыть быстрые действия');
  fab.innerHTML = `
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-chat" viewBox="0 0 16 16">
  <path d="M2.678 11.894a1 1 0 0 1 .287.801 11 11 0 0 1-.398 2c1.395-.323 2.247-.697 2.634-.893a1 1 0 0 1 .71-.074A8 8 0 0 0 8 14c3.996 0 7-2.807 7-6s-3.004-6-7-6-7 2.808-7 6c0 1.468.617 2.83 1.678 3.894m-.493 3.905a22 22 0 0 1-.713.129c-.2.032-.352-.176-.273-.362a10 10 0 0 0 .244-.637l.003-.01c.248-.72.45-1.548.524-2.319C.743 11.37 0 9.76 0 8c0-3.866 3.582-7 8-7s8 3.134 8 7-3.582 7-8 7a9 9 0 0 1-2.347-.306c-.52.263-1.639.742-3.468 1.105"/>
</svg>
`;

  const panel = document.createElement('div');
  panel.className = 'sticky-cta__panel';
  panel.hidden = true;
  panel.innerHTML = `
    <a class="sticky-cta__btn sticky-cta__btn--icon" href="tel:${PHONE}" aria-label="Позвонить">
      <!-- phone svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
     fill="#25D366" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M3.654 1.328a.678.678 0 0 0-1.015-.063L1.605 2.3c-.483.484-.661 1.169-.45 1.77a17.6 17.6 0 0 0 4.168 6.608 17.6 17.6 0 0 0 6.608 4.168c.601.211 1.286.033 1.77-.45l1.034-1.034a.678.678 0 0 0-.063-1.015l-2.307-1.794a.68.68 0 0 0-.58-.122l-2.19.547a1.75 1.75 0 0 1-1.657-.459L5.482 8.062a1.75 1.75 0 0 1-.46-1.657l.548-2.19a.68.68 0 0 0-.122-.58zM1.884.511a1.745 1.745 0 0 1 2.612.163L6.29 2.98c.329.423.445.974.315 1.494l-.547 2.19a.68.68 0 0 0 .178.643l2.457 2.457a.68.68 0 0 0 .644.178l2.189-.547a1.75 1.75 0 0 1 1.494.315l2.306 1.794c.829.645.905 1.87.163 2.611l-1.034 1.034c-.74.74-1.846 1.065-2.877.702a18.6 18.6 0 0 1-7.01-4.42 18.6 18.6 0 0 1-4.42-7.009c-.362-1.03-.037-2.137.703-2.877z"/>
</svg>


    </a>
    <a class="sticky-cta__btn sticky-cta__btn--icon" href="${waHref}" target="_blank" rel="noopener" aria-label="Написать в WhatsApp">
      <!-- whatsapp svg -->
<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16"
     fill="#25D366" class="bi bi-whatsapp" viewBox="0 0 16 16" aria-hidden="true">
  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.965h.004c4.368 0 7.926-3.558 7.93-7.93A7.9 7.9 0 0 0 13.6 2.326zM7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c0-3.626 2.957-6.584 6.591-6.584a6.56 6.56 0 0 1 4.66 1.931 6.56 6.56 0 0 1 1.928 4.66c-.004 3.639-2.961 6.592-6.592 6.592m3.615-4.934c-.197-.099-1.17-.578-1.353-.646-.182-.065-.315-.099-.445.099-.133.197-.513.646-.627.775-.114.133-.232.148-.43.05-.197-.1-.836-.308-1.592-.985-.59-.525-.985-1.175-1.103-1.372-.114-.198-.011-.304.088-.403.087-.088.197-.232.296-.346.1-.114.133-.198.198-.33.065-.134.034-.248-.015-.347-.05-.099-.445-1.076-.612-1.47-.16-.389-.323-.335-.445-.34-.114-.007-.247-.007-.38-.007a.73.73 0 0 0-.529.247c-.182.198-.691.677-.691 1.654s.71 1.916.81 2.049c.098.133 1.394 2.132 3.383 2.992.47.205.84.326 1.129.418.475.152.904.129 1.246.08.38-.058 1.171-.48 1.338-.943.164-.464.164-.86.114-.943-.049-.084-.182-.133-.38-.232"/>
</svg>

    </a>
  `;

  bar.appendChild(panel);
  bar.appendChild(fab);
  document.body.appendChild(bar);
  bar.classList.add('is-active');


  function expand(){ bar.classList.add('is-expanded'); panel.hidden = false; fab.setAttribute('aria-expanded','true'); }
  function collapse(){ bar.classList.remove('is-expanded'); panel.hidden = true; fab.setAttribute('aria-expanded','false'); }

  fab.addEventListener('click', (e)=>{ e.stopPropagation(); bar.classList.contains('is-expanded') ? collapse() : expand(); });
  document.addEventListener('click', (e)=>{ if (!bar.contains(e.target)) collapse(); });
  document.addEventListener('keydown', (e)=>{ if (e.key === 'Escape') collapse(); });

  panel.querySelector('a[href="#form"]')?.addEventListener('click', (e) => {
    e.preventDefault(); collapse();
    document.getElementById('form')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  });

  const formSec = document.getElementById('form');
  if (formSec && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(e => bar.classList.toggle('is-hidden', e.isIntersecting && e.intersectionRatio > 0.5));
    }, { threshold: [0, .5, 1] });
    io.observe(formSec);
  }
}

