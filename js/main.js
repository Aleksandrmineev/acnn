document.addEventListener("DOMContentLoaded", () => {
  // === Формы ===
  const form = document.getElementById("form");
  const successMessage = document.getElementById("formSuccess");

  if (form) {
    form.addEventListener("submit", function (e) {
      e.preventDefault();

      const name = form.name.value.trim();
      const phone = form.phone.value.trim().replace(/\D/g, "");
      const email = form.email.value.trim();
      const messageText = form.message.value.trim();

      if (!name || phone.length < 10 || !email.includes("@") || !messageText) {
        alert("Please fill in all fields correctly");
        return;
      }

      const TOKEN = "8042188223:AAGiQLFwnSYK86FX0O3dMUbsj6dPK-1xwLc";
      const CHAT_ID = "303648524";
      const URL = `https://api.telegram.org/bot${TOKEN}/sendMessage`;

      const message = `<b>New Client</b>\n<b>Name:</b> ${name}\n<b>Telefon:</b> ${phone}\n<b>Email:</b> ${email}\n<b>Nachricht:</b> ${messageText}`;

      fetch(URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          chat_id: CHAT_ID,
          text: message,
          parse_mode: "HTML",
        }),
      })
        .then(() => {
          const MAKE_WEBHOOK_URL =
            "https://hook.eu2.make.com/1goqfnfbv28hf29qpkjxfdd00x9f639j";

          return fetch(MAKE_WEBHOOK_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name,
              phone: phone,
              email: email,
              message: messageText,
            }),
          });
        })
        .then(() => {
          successMessage.style.display = "block";
          form.reset();
          setTimeout(() => {
            successMessage.style.display = "none";
          }, 5000);
        })
        .catch((error) => {
          console.error("Send error:", error);
          alert("An error occurred while sending.");
        });
    });
  }

  // === Бургер ===
  const burger = document.querySelector(".burger");
  const mobileMenu = document.querySelector(".mobile-menu");

  burger?.addEventListener("click", () => {
    mobileMenu.classList.toggle("active");
    burger.classList.toggle("burger--active");
  });

  // Закрытие по клику на ссылку
  document.querySelectorAll(".mobile-menu a").forEach((link) => {
    link.addEventListener("click", () => {
      mobileMenu.classList.remove("active");
      burger.classList.remove("burger--active");
    });
  });

  // Закрытие по клику вне пунктов меню
  mobileMenu?.addEventListener("click", (e) => {
    if (e.target === mobileMenu) {
      mobileMenu.classList.remove("active");
      burger.classList.remove("burger--active");
    }
  });

  // кнопка TOTOP
  const toTopBtn = document.querySelector(".to-top");

  window.addEventListener("scroll", () => {
    if (window.scrollY > 400) {
      toTopBtn.classList.add("show");
    } else {
      toTopBtn.classList.remove("show");
    }
  });

  toTopBtn?.addEventListener("click", () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  });

  // МОДАЛЬНОЕ ОКНО УСЛУГ
  document.querySelectorAll(".service-card").forEach((card) => {
    card.addEventListener("click", () => {
      const type = card.dataset.service;
      const modal = document.getElementById("serviceModal");
      const text = document.getElementById("modalText");

      // Здесь можно подгрузить текст индивидуально для каждой услуги
      switch (type) {
        case "fire":
          text.textContent =
            "Пожарная сигнализация обеспечивает своевременное обнаружение и оповещение о возгорании...";
          break;
        case "security":
          text.textContent =
            "Охранная сигнализация защищает объект от проникновения...";
          break;
        case "video":
          text.textContent =
            "Система видеонаблюдения позволяет контролировать происходящее в реальном времени...";
          break;
        case "access":
          text.textContent =
            "Контроль доступа обеспечивает безопасность входа и учёт персонала...";
          break;
        case "alarm":
          text.textContent =
            "Система оповещения о пожаре обеспечивает звуковое и световое оповещение персонала и посетителей в случае ЧС.";
          break;
        case "smoke":
          text.textContent =
            "Система дымоудаления удаляет продукты горения из помещения, обеспечивая безопасную эвакуацию.";
          break;
        case "extinguish":
          text.textContent =
            "Автоматическая система пожаротушения активируется при возгорании, применяя воду, пену или газ.";
          break;
        case "audit":
          text.textContent =
            "Пожарный аудит выявляет риски и проверяет соответствие действующим нормативам пожарной безопасности.";
          break;
        case "evacuation":
          text.textContent =
            "План эвакуации разрабатывается индивидуально с учётом объекта и содержит схемы с маршрутами выхода.";
          break;
        case "fireproofing":
          text.textContent =
            "Огнезащита конструкций увеличивает предел огнестойкости и замедляет распространение огня.";
          break;
      }

      modal.style.display = "flex";
    });
  });

document.addEventListener('DOMContentLoaded', () => {
  const closeBtn = document.querySelector('.modal__close');
  if (!closeBtn) return; // На странице нет модалки — выходим

  const modal = document.getElementById('serviceModal');
  closeBtn.addEventListener('click', () => {
    if (modal) modal.style.display = 'none';
  });
});


  window.addEventListener("click", (e) => {
    const modal = document.getElementById("serviceModal");
    if (e.target === modal) modal.style.display = "none";
  });

  document.querySelectorAll("[data-video]").forEach((wrapper) => {
    const video = wrapper.querySelector("video");
    const playBtn = wrapper.querySelector(".video-play");

    const playVideo = () => {
      wrapper.classList.add("playing");
      playBtn.style.display = "none";
      video.play();
    };

    // Кнопка запуска
    playBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      playVideo();
    });

    // Клик по видео — пауза/воспроизведение
    wrapper.addEventListener("click", () => {
      if (video.paused) {
        playVideo();
      } else {
        video.pause();
        playBtn.style.display = "block";
      }
    });

    // Если видео завершилось — вернуть кнопку
    video.addEventListener("ended", () => {
      wrapper.classList.remove("playing");
      playBtn.style.display = "block";
    });
  });
});

// Слайдер доп услуги на главной странице
document.addEventListener("DOMContentLoaded", () => {
  new Swiper(".js-services-slider", {
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
});


// Слайдер на странице проекта
document.addEventListener('DOMContentLoaded', () => {
  const el = document.querySelector('.js-project-slider');
  if (!el) return;

  const slidesCount = el.querySelectorAll('.swiper-slide').length;

  // 1–2 слайда: не инициализируем Swiper
  if (slidesCount <= 2) {
    el.classList.add('no-swiper');
    if (slidesCount === 2) el.classList.add('has-2');
    return;
  }

  // 3+ слайда: полноценный Swiper
  new Swiper(el, {
    loop: true,
    spaceBetween: 24,
    slidesPerView: 1,
    breakpoints: {
      768: { slidesPerView: 2 }
    },
    pagination: {
      el: el.querySelector('.project__pagination'),
      clickable: true
    },
    navigation: {
      prevEl: el.querySelector('.project__prev'),
      nextEl: el.querySelector('.project__next')
    },
    // чтобы не прыгал при скрытии/появлении
    observer: true,
    observeParents: true
  });
});
