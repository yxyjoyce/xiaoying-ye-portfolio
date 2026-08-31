(() => {
  const page = document.body.dataset.page || "";
  const root = document.body.dataset.root || ".";
  const works = Array.isArray(window.PORTFOLIO_WORKS) ? window.PORTFOLIO_WORKS : [];

  const route = (path) => `${root}/${path}`;
  const asset = (path) => route(path);

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const playIcon = () => `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M8 5.4v13.2a1 1 0 0 0 1.55.83l9.2-6.6a1 1 0 0 0 0-1.66l-9.2-6.6A1 1 0 0 0 8 5.4Z" fill="currentColor"/>
    </svg>`;

  const pauseIcon = () => `
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path d="M7 5h3v14H7zM14 5h3v14h-3z" fill="currentColor"/>
    </svg>`;

  const arrowIcon = (direction) => direction === "previous"
    ? `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m14.5 5-7 7 7 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`
    : `<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="m9.5 5 7 7-7 7" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"/></svg>`;

  function wireNavigation() {
    const isLocalFile = window.location.protocol === "file:";
    const routes = isLocalFile
      ? {
        home: route("index.html"),
        additional: route("additional-works/index.html"),
        about: route("about/index.html"),
        contact: route("contact/index.html")
      }
      : {
        home: route(""),
        additional: route("additional-works/"),
        about: route("about/"),
        contact: route("contact/")
      };

    document.querySelectorAll("[data-nav]").forEach((link) => {
      const destination = routes[link.dataset.nav];
      if (destination) link.href = destination;
      if (link.dataset.nav === page || (page === "home" && link.dataset.nav === "home")) {
        link.setAttribute("aria-current", "page");
      }
    });
  }

  function renderWorkCard(work, index) {
    const title = escapeHtml(work.title);
    const label = escapeHtml(`${work.title}，${work.duration}`);
    return `
      <article class="work-card" data-index="${index}" aria-roledescription="slide" aria-label="${escapeHtml(`${index + 1} / ${works.length}：${work.title}`)}">
        <div class="work-media">
          <video class="work-video" data-video-index="${index}" controls preload="metadata" playsinline poster="${escapeHtml(asset(work.poster))}">
            <source src="${escapeHtml(asset(work.video))}" type="video/mp4">
            <p>你的浏览器不支持 HTML5 视频。</p>
          </video>
          <button class="video-toggle" data-video-toggle="${index}" type="button" aria-label="播放 ${label}" aria-pressed="false">
            ${playIcon()}<span class="sr-only">播放影片</span>
          </button>
        </div>
        <div class="work-meta">
          <div class="work-heading">
            <h3>${title}</h3>
            <time datetime="PT${work.durationSeconds}S">${escapeHtml(work.duration)}</time>
          </div>
          <label class="sr-only" for="seek-${work.slug}">拖动 ${title} 的播放进度</label>
          <input class="seek-control" id="seek-${escapeHtml(work.slug)}" data-seek-index="${index}" type="range" min="0" max="0" value="0" step="0.01" aria-valuemin="0" aria-valuemax="0" aria-valuenow="0" aria-label="拖动 ${label} 的播放进度">
          <p class="work-description">${escapeHtml(work.description)}</p>
        </div>
      </article>`;
  }

  function initHome() {
    const track = document.querySelector("[data-reel-track]");
    const viewport = document.querySelector("[data-reel-viewport]");
    const previous = document.querySelector("[data-carousel-previous]");
    const next = document.querySelector("[data-carousel-next]");
    const dots = document.querySelector("[data-carousel-dots]");
    if (!track || !viewport || !previous || !next || !dots || works.length === 0) return;

    track.innerHTML = works.map(renderWorkCard).join("");
    dots.innerHTML = works.map((work, index) => `
      <button type="button" class="carousel-dot" data-carousel-dot="${index}" aria-label="查看第 ${index + 1} 部作品：${escapeHtml(work.title)}"></button>`).join("");

    let current = 0;
    const cards = () => [...track.querySelectorAll(".work-card")];
    const visibleCount = () => window.matchMedia("(min-width: 760px)").matches ? 2 : 1;
    const maxIndex = () => Math.max(0, works.length - visibleCount());

    function syncCarousel() {
      current = Math.min(current, maxIndex());
      const firstCard = track.querySelector(".work-card");
      if (!firstCard) return;
      const styles = getComputedStyle(track);
      const gap = Number.parseFloat(styles.columnGap || styles.gap || "0") || 0;
      const step = firstCard.getBoundingClientRect().width + gap;
      track.style.transform = `translate3d(-${Math.round(current * step)}px, 0, 0)`;
      track.dataset.current = String(current);
      previous.disabled = current === 0;
      next.disabled = current === maxIndex();
      dots.querySelectorAll("[data-carousel-dot]").forEach((dot, index) => {
        const active = index === current;
        dot.classList.toggle("is-active", active);
        dot.setAttribute("aria-current", active ? "true" : "false");
      });
      cards().forEach((card, index) => card.classList.toggle("is-current", index === current));
    }

    function moveTo(index) {
      current = Math.max(0, Math.min(index, maxIndex()));
      syncCarousel();
    }

    previous.innerHTML = arrowIcon("previous");
    next.innerHTML = arrowIcon("next");
    previous.addEventListener("click", () => moveTo(current - 1));
    next.addEventListener("click", () => moveTo(current + 1));
    dots.addEventListener("click", (event) => {
      const dot = event.target.closest("[data-carousel-dot]");
      if (dot) moveTo(Number(dot.dataset.carouselDot));
    });

    const videoCards = cards();
    function updateVideoUi(card) {
      const video = card.querySelector("video");
      const toggle = card.querySelector("[data-video-toggle]");
      const seek = card.querySelector("[data-seek-index]");
      const title = card.querySelector("h3")?.textContent || "影片";
      if (!video || !toggle || !seek) return;
      const isPlaying = !video.paused && !video.ended;
      toggle.innerHTML = `${isPlaying ? pauseIcon() : playIcon()}<span class="sr-only">${isPlaying ? "暂停" : "播放"}影片</span>`;
      toggle.setAttribute("aria-label", `${isPlaying ? "暂停" : "播放"} ${title}`);
      toggle.setAttribute("aria-pressed", String(isPlaying));
      if (Number.isFinite(video.duration) && video.duration > 0) {
        const value = Number.isFinite(video.currentTime) ? video.currentTime : 0;
        seek.max = String(video.duration);
        seek.value = String(value);
        seek.setAttribute("aria-valuemax", String(Math.round(video.duration)));
        seek.setAttribute("aria-valuenow", String(Math.round(value)));
      }
    }

    videoCards.forEach((card) => {
      const video = card.querySelector("video");
      const toggle = card.querySelector("[data-video-toggle]");
      const seek = card.querySelector("[data-seek-index]");
      if (!video || !toggle || !seek) return;
      toggle.addEventListener("click", () => {
        videoCards.forEach((otherCard) => {
          const otherVideo = otherCard.querySelector("video");
          if (otherVideo && otherVideo !== video) otherVideo.pause();
        });
        if (video.paused || video.ended) {
          const playResult = video.play();
          if (playResult && typeof playResult.catch === "function") playResult.catch(() => {});
        } else {
          video.pause();
        }
        updateVideoUi(card);
      });
      ["loadedmetadata", "durationchange", "timeupdate", "play", "pause", "ended"].forEach((eventName) => {
        video.addEventListener(eventName, () => updateVideoUi(card));
      });
      seek.addEventListener("input", () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Number(seek.value);
          updateVideoUi(card);
        }
      });
      updateVideoUi(card);
    });

    let touchStartX = null;
    viewport.addEventListener("touchstart", (event) => {
      touchStartX = event.changedTouches[0]?.clientX ?? null;
    }, {passive: true});
    viewport.addEventListener("touchend", (event) => {
      if (touchStartX === null) return;
      const endX = event.changedTouches[0]?.clientX ?? touchStartX;
      const delta = endX - touchStartX;
      touchStartX = null;
      if (Math.abs(delta) > 42) moveTo(current + (delta < 0 ? 1 : -1));
    }, {passive: true});

    window.addEventListener("resize", syncCarousel, {passive: true});
    syncCarousel();
  }

  function initContact() {
    const form = document.querySelector("[data-contact-form]");
    const status = document.querySelector("[data-form-status]");
    if (!form || !status) return;
    const recipient = form.dataset.recipient || "yxyjoyce@qq.com";
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (!form.checkValidity()) {
        form.reportValidity();
        return;
      }
      const values = new FormData(form);
      const subject = String(values.get("subject") || "Portfolio enquiry");
      const body = [
        `Name: ${String(values.get("name") || "")}`,
        `Email: ${String(values.get("email") || "")}`,
        "",
        String(values.get("message") || "")
      ].join("\n");
      const href = `mailto:${recipient}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
      form.dataset.mailtoGenerated = "true";
      status.hidden = false;
      status.innerHTML = `邮件草稿已准备：<a href="${escapeHtml(href)}">打开邮件草稿</a>`;
    });
  }

  wireNavigation();
  if (page === "home") initHome();
  if (page === "contact") initContact();
})();

