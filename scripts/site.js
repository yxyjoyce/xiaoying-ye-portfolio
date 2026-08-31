(() => {
  const portfolio = window.PORTFOLIO_DATA || {};
  const motionWorks = Array.isArray(portfolio.motion) ? portfolio.motion : [];
  const otherWorks = Array.isArray(portfolio.otherWorks) ? portfolio.otherWorks : [];
  const seasonalWorks = Array.isArray(portfolio.seasonal) ? portfolio.seasonal : [];
  const root = document.body.dataset.root || ".";

  const asset = (path) => `${root}/${path}`;

  const escapeHtml = (value) => String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

  const formatTime = (seconds) => {
    const safeSeconds = Number.isFinite(seconds) && seconds >= 0 ? Math.floor(seconds) : 0;
    const minutes = Math.floor(safeSeconds / 60);
    const remainder = safeSeconds % 60;
    return `${String(minutes).padStart(2, "0")}:${String(remainder).padStart(2, "0")}`;
  };

  function wireNavigation() {
    const routes = {
      home: `${root}/index.html#home`,
      work: `${root}/index.html#selected-motion`
    };

    document.querySelectorAll("[data-nav]").forEach((link) => {
      const destination = routes[link.dataset.nav];
      if (destination) link.href = destination;
    });

    const homeSection = document.querySelector("#home");
    const syncCurrent = () => {
      const atHome = window.location.hash === "#home"
        || (!window.location.hash && window.scrollY < (homeSection?.offsetHeight || 1) * 0.55);
      document.querySelectorAll("[data-nav]").forEach((link) => {
        const active = (atHome && link.dataset.nav === "home") || (!atHome && link.dataset.nav === "work");
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    };
    window.addEventListener("hashchange", syncCurrent);
    window.addEventListener("scroll", syncCurrent, { passive: true });
    syncCurrent();
  }

  function initParallax() {
    const art = document.querySelector("[data-parallax]");
    if (!art || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let frame = 0;
    const update = () => {
      frame = 0;
      const offset = Math.min(window.scrollY * -0.08, 0);
      art.style.setProperty("--hero-offset", `${offset}px`);
    };
    window.addEventListener("scroll", () => {
      if (!frame) frame = window.requestAnimationFrame(update);
    }, { passive: true });
    update();
  }

  function renderMotionList() {
    const list = document.querySelector("[data-motion-list]");
    if (!list) return;
    list.innerHTML = motionWorks.map((work, index) => `
      <button class="motion-item${index === 0 ? " is-active" : ""}" data-motion-item="${index}" type="button" aria-current="${index === 0 ? "true" : "false"}" aria-label="Select ${escapeHtml(work.title)}">
        <span class="motion-item-number">${String(index + 1).padStart(2, "0")}</span>
        <span class="motion-item-copy">
          <span class="motion-item-title">${escapeHtml(work.title)}</span>
          <span class="motion-item-subtitle">${escapeHtml(work.subtitle || work.title)}</span>
        </span>
        <img src="${escapeHtml(asset(work.poster))}" alt="" width="160" height="100" loading="lazy">
      </button>`).join("");
  }

  function renderOtherWorks() {
    const grid = document.querySelector("[data-other-grid]");
    if (!grid) return;
    grid.innerHTML = otherWorks.map((work) => `
      <figure class="other-tile">
        <figcaption class="other-tile-label">
          <span class="other-tile-number">${escapeHtml(work.number)}</span>
          <span class="other-tile-category">${escapeHtml(work.category)}</span>
        </figcaption>
        <div class="other-tile-frame">
          <img src="${escapeHtml(asset(work.image))}" alt="${escapeHtml(work.alt)}" width="${escapeHtml(work.width)}" height="${escapeHtml(work.height)}" loading="lazy">
        </div>
      </figure>`).join("");
  }

  function renderSeasonalWorks() {
    const rail = document.querySelector("[data-seasonal-rail]");
    if (!rail) return;
    rail.innerHTML = seasonalWorks.map((work, index) => `
      <figure class="seasonal-card${index === 0 ? " seasonal-card--featured" : ""}">
        <div class="seasonal-media">
          <video data-seasonal-video muted loop playsinline preload="metadata" poster="${escapeHtml(asset(work.poster))}" aria-label="${escapeHtml(work.title)} seasonal poster">
            <source src="${escapeHtml(asset(work.video))}" type="video/mp4">
          </video>
        </div>
        <figcaption class="seasonal-card-meta">
          <span class="seasonal-meta-number">${escapeHtml(work.number)}</span>
          <span class="seasonal-meta-title">${escapeHtml(work.title)}</span>
          <span class="seasonal-meta-english">${escapeHtml(work.englishTitle)}</span>
          <span class="seasonal-meta-duration">${escapeHtml(work.duration)}</span>
        </figcaption>
      </figure>`).join("");
  }

  function initMotion() {
    const player = document.querySelector("[data-motion-player]");
    const source = document.querySelector("[data-motion-source]");
    const playButton = document.querySelector("[data-motion-play]");
    const seek = document.querySelector("[data-motion-seek]");
    const currentTime = document.querySelector("[data-motion-current]");
    const durationTime = document.querySelector("[data-motion-duration]");
    const number = document.querySelector("[data-motion-number]");
    const title = document.querySelector("[data-motion-title]");
    const subtitle = document.querySelector("[data-motion-subtitle]");
    const durationLabel = document.querySelector("[data-motion-duration-label]");
    const description = document.querySelector("[data-motion-description]");
    const list = document.querySelector("[data-motion-list]");
    if (!player || !source || !playButton || !seek || !list || motionWorks.length === 0) return;

    let currentIndex = 0;

    const updatePlayerUi = () => {
      const playing = !player.paused && !player.ended;
      playButton.setAttribute("aria-pressed", String(playing));
      playButton.setAttribute("aria-label", `${playing ? "Pause" : "Play"} ${motionWorks[currentIndex].title}`);
      if (Number.isFinite(player.duration) && player.duration > 0) {
        seek.max = String(player.duration);
        seek.value = String(Math.min(player.currentTime, player.duration));
        seek.setAttribute("aria-valuemax", String(Math.round(player.duration)));
      }
      seek.setAttribute("aria-valuenow", String(Math.round(player.currentTime || 0)));
      if (currentTime) currentTime.textContent = formatTime(player.currentTime);
      if (durationTime) durationTime.textContent = formatTime(player.duration || motionWorks[currentIndex].durationSeconds);
    };

    const selectMotion = (index, shouldPlay = false) => {
      const work = motionWorks[index];
      if (!work) return;
      currentIndex = index;
      player.pause();
      source.src = asset(work.video);
      player.poster = asset(work.poster);
      player.load();
      number.textContent = String(index + 1).padStart(2, "0");
      title.textContent = work.title;
      subtitle.textContent = work.subtitle || work.title;
      durationLabel.textContent = work.duration;
      durationLabel.dateTime = `PT${work.durationSeconds}S`;
      description.textContent = work.description;
      list.querySelectorAll("[data-motion-item]").forEach((item, itemIndex) => {
        const active = itemIndex === index;
        item.classList.toggle("is-active", active);
        item.setAttribute("aria-current", String(active));
      });
      seek.value = "0";
      seek.max = String(work.durationSeconds);
      updatePlayerUi();
      if (shouldPlay) {
        const playResult = player.play();
        if (playResult && typeof playResult.catch === "function") playResult.catch(() => {});
      }
    };

    playButton.addEventListener("click", () => {
      if (player.paused || player.ended) {
        const playResult = player.play();
        if (playResult && typeof playResult.catch === "function") playResult.catch(() => {});
      } else {
        player.pause();
      }
    });

    player.addEventListener("loadedmetadata", updatePlayerUi);
    ["durationchange", "timeupdate", "play", "pause", "ended"].forEach((eventName) => {
      player.addEventListener(eventName, updatePlayerUi);
    });
    seek.addEventListener("input", () => {
      if (Number.isFinite(player.duration) && player.duration > 0) {
        player.currentTime = Number(seek.value);
        updatePlayerUi();
      }
    });
    list.addEventListener("click", (event) => {
      const item = event.target.closest("[data-motion-item]");
      if (!item) return;
      selectMotion(Number(item.dataset.motionItem), false);
    });
    list.addEventListener("keydown", (event) => {
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return;
      const nextIndex = currentIndex + (event.key === "ArrowRight" ? 1 : -1);
      if (motionWorks[nextIndex]) {
        event.preventDefault();
        selectMotion(nextIndex, false);
        list.querySelector(`[data-motion-item="${nextIndex}"]`)?.focus();
      }
    });

    description.textContent = motionWorks[0].description;
    seek.max = String(motionWorks[0].durationSeconds);
    updatePlayerUi();
  }

  function initSeasonalPlayback() {
    const videos = [...document.querySelectorAll("[data-seasonal-video]")];
    if (videos.length === 0) return;
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    videos.forEach((video) => {
      video.muted = true;
      video.setAttribute("muted", "");
    });
    if (reducedMotion || !("IntersectionObserver" in window)) return;
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting) {
          const playResult = video.play();
          if (playResult && typeof playResult.catch === "function") playResult.catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: 0.35, rootMargin: "80px 0px" });
    videos.forEach((video) => observer.observe(video));
  }

  wireNavigation();
  renderMotionList();
  renderOtherWorks();
  renderSeasonalWorks();
  initMotion();
  initSeasonalPlayback();
  initParallax();
})();
