document.addEventListener("DOMContentLoaded", () => {
  initForm();
  initBurger();
  initToTop();
  initServiceModal();
  initInlineVideos();
  initServicesSlider();
  initProjectSliderWithLightbox();
});

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

    // простая валидация
    const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
    if (!name || phone.length < 10 || !emailOk || !messageText) {
      alert("Проверьте поля: имя, телефон (10+ цифр), email и сообщение.");
      return;
    }

    // ⚠️ РЕКОМЕНДАЦИЯ: не хранить токен в фронтенде! Отправляйте только на вебхук
    const TOKEN = "<TG_BOT_TOKEN>";      // заполните на сервере, а не в браузере
    const CHAT_ID = "<CHAT_ID>";         // заполните на сервере, а не в браузере
    const TG_URL = `https://api.telegram.org/bot${TOKEN}/sendMessage`;
    const MAKE_WEBHOOK_URL = "https://hook.eu2.make.com/1goqfnfbv28hf29qpkjxfdd00x9f639j";

    const message =
      `<b>Новая заявка</b>\n<b>Имя:</b> ${name}\n<b>Телефон:</b> ${phone}\n<b>Email:</b> ${email}\n<b>Сообщение:</b> ${messageText}`;

    try {
      // Минимум — отправка в Make (серверная прокладка)
      await fetch(MAKE_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, email, message: messageText }),
      });

      // (необязательно) прямой запрос в Telegram — лучше убрать в проде
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
function initBurger() {
  const burger = document.querySelector(".burger");
  const mobileMenu = document.querySelector(".mobile-menu");
  if (!burger || !mobileMenu) return;

  burger.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
    burger.classList.toggle("burger--active");
  });

  mobileMenu.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      burger.classList.remove("burger--active");
    });
  });

  // закрытие по клику на подложку
  mobileMenu.addEventListener("click", (e) => {
    if (e.target === mobileMenu) {
      mobileMenu.classList.remove("active");
      burger.classList.remove("burger--active");
    }
  });
}

/* =========================
   КНОПКА "ВВЕРХ"
========================= */
function initToTop() {
  const toTopBtn = document.querySelector(".to-top");
  if (!toTopBtn) return;

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) toTopBtn.classList.add("show");
    else toTopBtn.classList.remove("show");
  }, { passive: true });

  toTopBtn.addEventListener("click", () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  });
}

/* =========================
   МОДАЛКА УСЛУГ
========================= */
function initServiceModal() {
  const modal = document.getElementById("serviceModal");
  const closeBtn = document.querySelector(".modal__close");
  if (!modal) return;

  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.service;
      const text = document.getElementById("modalText");
      if (text) {
        text.textContent = getServiceText(type);
      }
      modal.style.display = "flex";
    });
  });

  closeBtn?.addEventListener("click", () => (modal.style.display = "none"));
  window.addEventListener("click", (e) => {
    if (e.target === modal) modal.style.display = "none";
  });
}

function getServiceText(type) {
  switch (type) {
    case "fire":
      return "Пожарная сигнализация обеспечивает своевременное обнаружение и оповещение о возгорании...";
    case "security":
      return "Охранная сигнализация защищает объект от проникновения...";
    case "video":
      return "Система видеонаблюдения позволяет контролировать происходящее в реальном времени...";
    case "access":
      return "Контроль доступа обеспечивает безопасность входа и учёт персонала...";
    case "alarm":
      return "Система оповещения о пожаре обеспечивает звуковое и световое оповещение в случае ЧС.";
    case "smoke":
      return "Система дымоудаления удаляет продукты горения и обеспечивает безопасную эвакуацию.";
    case "extinguish":
      return "Автоматическое пожаротушение применяет воду, пену или газ при возгорании.";
    case "audit":
      return "Пожарный аудит выявляет риски и проверяет соответствие нормативам.";
    case "evacuation":
      return "План эвакуации с маршрутами выхода под ваш объект.";
    case "fireproofing":
      return "Огнезащита повышает предел огнестойкости конструкций.";
    default:
      return "";
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

    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playVideo();
    });

    wrapper.addEventListener("click", () => {
      if (video.paused) playVideo();
      else {
        video.pause();
        playBtn.style.display = "block";
      }
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
  if (!el || typeof Swiper !== "function") return;

  // eslint-disable-next-line no-new
  new Swiper(el, {
    slidesPerView: 1,
    spaceBetween: 16,
    loop: true,
    pagination: { el: ".services__pagination", clickable: true },
    navigation: { nextEl: ".services__next", prevEl: ".services__prev" },
    breakpoints: {
      640: { slidesPerView: 2, spaceBetween: 16 },
      940: { slidesPerView: 3, spaceBetween: 20 },
      1200: { slidesPerView: 3, spaceBetween: 24 },
    },
  });
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

  // Обернём <img> в <a> для GLightbox (если ещё не обёрнуты)
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

  // Лайтбокс
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

  // Если 1–2 слайда — свайпер не нужен
  if (slidesCount <= 2) {
    el.classList.add("no-swiper");
    if (slidesCount === 2) el.classList.add("has-2");
    return;
  }

  if (typeof Swiper !== "function") return;

  // Swiper (разрешаем клики по <a> для лайтбокса)
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

  // Если будете динамически менять слайды:
  // swiper.on('slideChangeTransitionEnd', () => { lightbox && lightbox.reload(); });
}
