(() => {
  const portfolio = window.PORTFOLIO_DATA || {};
  const motionWorks = Array.isArray(portfolio.motion) ? portfolio.motion : [];
  const otherWorks = Array.isArray(portfolio.otherWorks) ? portfolio.otherWorks : [];
  const seasonalWorks = Array.isArray(portfolio.seasonal) ? portfolio.seasonal : [];
  const root = document.body.dataset.root || ".";
  const sectionIds = ["home", "animation", "seasonal-posters", "other-works"];
  const sectionAliases = { "selected-motion": "animation" };

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

  const normalizeSectionId = (id) => sectionAliases[id] || id;

  function wireNavigation() {
    const routes = {
      home: `${root}/index.html#home`,
      work: `${root}/index.html#animation`
    };

    document.querySelectorAll("[data-nav]").forEach((link) => {
      const destination = routes[link.dataset.nav];
      if (destination) link.href = destination;
    });

    const syncCurrent = (sectionId = document.body.dataset.activeSection || window.location.hash.slice(1) || "home") => {
      const activeSection = normalizeSectionId(sectionId);
      const atHome = activeSection === "home";
      document.querySelectorAll("[data-nav]").forEach((link) => {
        const active = (atHome && link.dataset.nav === "home") || (!atHome && link.dataset.nav === "work");
        if (active) link.setAttribute("aria-current", "page");
        else link.removeAttribute("aria-current");
      });
    };

    window.addEventListener("hashchange", () => syncCurrent());
    window.addEventListener("portfolio:sectionchange", (event) => syncCurrent(event.detail?.id));
    syncCurrent();
  }

  function initSectionPaging() {
    const sections = sectionIds.map((id) => document.getElementById(id)).filter(Boolean);
    const nextButton = document.querySelector("[data-page-next]");
    const nextLabel = document.querySelector("[data-page-next-label]");
    const pageCount = document.querySelector("[data-page-count]");
    const track = document.querySelector("[data-page-track]");
    const curtain = document.querySelector("[data-panel-curtain]");
    if (sections.length === 0 || !nextButton || !nextLabel || !pageCount || !track || !curtain) return;

    const motionPreference = window.matchMedia("(prefers-reduced-motion: reduce)");
    const commitDelay = 260;
    const horizontalRailSelector = ".motion-list, .other-rail, .other-grid, .seasonal-rail";
    const initialHash = normalizeSectionId(window.location.hash.slice(1));
    const initialIndex = sections.findIndex((section) => section.id === initialHash);
    let activeIndex = initialIndex >= 0 ? initialIndex : 0;
    let locked = false;
    let touchStart = null;
    let transitionTimer = 0;
    let commitTimer = 0;
    let queuedNavigation = null;

    const sectionIndexFor = (id) => sections.findIndex((section) => section.id === normalizeSectionId(id));

    const setActiveA11y = (index) => {
      sections.forEach((section, sectionIndex) => {
        const active = sectionIndex === index;
        if (!active && section.contains(document.activeElement)) document.activeElement.blur();
        section.setAttribute("aria-hidden", String(!active));
        section.tabIndex = active ? 0 : -1;
        section.inert = !active;
        section.classList.toggle("is-active", active);
      });
    };

    const updateSwitcher = (index) => {
      const safeIndex = Math.max(0, Math.min(index, sections.length - 1));
      const atEnd = safeIndex === sections.length - 1;
      const destination = sections[atEnd ? 0 : safeIndex + 1];
      pageCount.textContent = `${String(safeIndex + 1).padStart(2, "0")} / ${String(sections.length).padStart(2, "0")}`;
      nextLabel.textContent = atEnd ? "BACK TO TOP" : "NEXT SECTION";
      const arrow = nextButton.querySelector(".page-switcher-arrow");
      if (arrow) arrow.textContent = atEnd ? "↑" : "↓";
      const headingId = destination.getAttribute("aria-labelledby");
      const heading = headingId ? document.getElementById(headingId) : null;
      nextButton.setAttribute("aria-label", atEnd ? "Back to top" : `Go to ${heading?.textContent.trim() || destination.id}`);
    };

    const clearTransition = () => {
      window.clearTimeout(transitionTimer);
      window.clearTimeout(commitTimer);
      curtain.classList.remove("is-active", "is-covering", "is-revealing");
      document.body.removeAttribute("data-transitioning");
      document.body.removeAttribute("data-transition-direction");
      document.body.removeAttribute("data-transition-target");
    };

    const finishTransition = (oldSection, nextSection) => {
      clearTransition();
      oldSection?.classList.remove("is-exiting");
      nextSection?.classList.remove("is-entering");
      locked = false;
      const queued = queuedNavigation;
      queuedNavigation = null;
      if (queued && queued.index !== activeIndex) goTo(queued.index, queued.options);
    };

    const commit = (oldSection, nextSection, nextIndex, direction, writeHistory, focusPanel) => {
      oldSection?.classList.add("is-exiting");
      nextSection.classList.add("is-entering");
      activeIndex = nextIndex;
      setActiveA11y(activeIndex);
      oldSection?.classList.remove("is-exiting");
      track.dataset.activeIndex = String(activeIndex);
      document.body.dataset.activeSection = nextSection.id;
      if (writeHistory) window.history.pushState(null, "", `#${nextSection.id}`);
      updateSwitcher(nextIndex);
      window.dispatchEvent(new CustomEvent("portfolio:sectionchange", { detail: { id: nextSection.id, index: nextIndex, direction } }));
      if (focusPanel) nextSection.focus({ preventScroll: true });
    };

    const completeReduced = (oldSection, nextSection) => {
      window.setTimeout(() => finishTransition(oldSection, nextSection), 100);
    };

    const goTo = (requestedIndex, { writeHistory = true, focusPanel = false } = {}) => {
      const nextIndex = Math.max(0, Math.min(requestedIndex, sections.length - 1));
      if (nextIndex === activeIndex) {
        updateSwitcher(nextIndex);
        return;
      }
      if (locked) return;
      locked = true;
      const oldIndex = activeIndex;
      const oldSection = sections[oldIndex];
      const nextSection = sections[nextIndex];
      const direction = nextIndex > oldIndex ? "forward" : "backward";
      if (motionPreference.matches) {
        oldSection.classList.add("is-exiting");
        commit(oldSection, nextSection, nextIndex, direction, writeHistory, focusPanel);
        completeReduced(oldSection, nextSection);
        return;
      }

      document.body.dataset.transitionDirection = direction;
      document.body.dataset.transitionTarget = nextSection.id;
      document.body.dataset.transitioning = "covering";
      curtain.classList.add("is-active", "is-covering");
      oldSection.classList.add("is-exiting");
      commitTimer = window.setTimeout(() => {
        if (!locked) return;
        commit(oldSection, nextSection, nextIndex, direction, writeHistory, focusPanel);
        document.body.dataset.transitioning = "revealing";
        curtain.classList.remove("is-covering");
        curtain.classList.add("is-revealing");
      }, commitDelay);
      transitionTimer = window.setTimeout(() => finishTransition(oldSection, nextSection), 900);
    };

    curtain.addEventListener("animationend", (event) => {
      if (!curtain.classList.contains("is-revealing") || event.animationName.indexOf("curtain-reveal") !== 0) return;
      const visibleSlats = [...curtain.querySelectorAll(".panel-curtain-slat")]
        .filter((slat) => getComputedStyle(slat).display !== "none");
      if (event.target !== visibleSlats.at(-1)) return;
      finishTransition(sections.find((section) => section.classList.contains("is-exiting")), sections[activeIndex]);
    });

    const isEditableTarget = (target) => target?.closest("input, textarea, select, [contenteditable=\"true\"]");

    nextButton.addEventListener("click", () => {
      goTo(activeIndex === sections.length - 1 ? 0 : activeIndex + 1, { focusPanel: activeIndex === sections.length - 1 });
    });

    const handleWheel = (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (event.defaultPrevented || !event.cancelable || event.ctrlKey || event.metaKey || isEditableTarget(target)) return;
      const verticalDistance = Math.abs(event.deltaY);
      const horizontalDistance = Math.abs(event.deltaX);
      if (verticalDistance < 16 || horizontalDistance > verticalDistance) return;
      event.preventDefault();
      goTo(activeIndex + (event.deltaY > 0 ? 1 : -1));
    };
    window.addEventListener("wheel", handleWheel, { passive: false });

    window.addEventListener("keydown", (event) => {
      const target = event.target instanceof Element ? event.target : null;
      if (isEditableTarget(target)) return;
      if (["ArrowDown", "PageDown"].includes(event.key)) {
        event.preventDefault();
        goTo(activeIndex + 1);
      } else if (["ArrowUp", "PageUp"].includes(event.key)) {
        event.preventDefault();
        goTo(activeIndex - 1);
      } else if (event.key === "Home") {
        event.preventDefault();
        goTo(0);
      } else if (event.key === "End") {
        event.preventDefault();
        goTo(sections.length - 1);
      }
    });

    const navigateFromAnchor = (event) => {
      const anchor = event.currentTarget;
      const hash = normalizeSectionId(new URL(anchor.href, window.location.href).hash.slice(1));
      const index = sectionIndexFor(hash);
      if (index < 0) return;
      event.preventDefault();
      goTo(index, { focusPanel: anchor.matches("[data-nav], .hero-cta, .back-to-top") });
    };
    document.querySelectorAll("a[href*='#']").forEach((anchor) => anchor.addEventListener("click", navigateFromAnchor));

    const applyHash = () => {
      const rawHash = window.location.hash.slice(1);
      const normalizedHash = normalizeSectionId(rawHash);
      const index = sectionIndexFor(normalizedHash);
      if (index < 0) return;
      if (rawHash !== normalizedHash) window.history.replaceState(null, "", `#${normalizedHash}`);
      if (locked) {
        queuedNavigation = { index, options: { writeHistory: false, focusPanel: true } };
      } else {
        goTo(index, { writeHistory: false, focusPanel: true });
      }
    };
    window.addEventListener("hashchange", applyHash);
    window.addEventListener("popstate", applyHash);

    track.addEventListener("touchstart", (event) => {
      if (event.touches.length !== 1) return;
      const target = event.target instanceof Element ? event.target : null;
      touchStart = {
        x: event.touches[0].clientX,
        y: event.touches[0].clientY,
        target,
        rail: target?.closest(horizontalRailSelector) || null
      };
    }, { passive: true });

    track.addEventListener("touchend", (event) => {
      if (!touchStart || event.changedTouches.length !== 1) return;
      const touch = event.changedTouches[0];
      const deltaX = touch.clientX - touchStart.x;
      const deltaY = touch.clientY - touchStart.y;
      const distanceX = Math.abs(deltaX);
      const distanceY = Math.abs(deltaY);
      const verticalSwipe = distanceY >= 40 && distanceY >= distanceX * 1.2;
      const horizontalSwipe = distanceX > distanceY;
      const railCanScroll = Boolean(touchStart.rail && touchStart.rail.scrollWidth > touchStart.rail.clientWidth + 1);
      if (touchStart.rail && railCanScroll) {
        // Any gesture that starts on a horizontal work rail belongs to the rail.
      } else if (verticalSwipe) {
        event.preventDefault();
        goTo(activeIndex + (deltaY < 0 ? 1 : -1));
      } else if (horizontalSwipe || railCanScroll) {
        // Keep the native horizontal rail gesture untouched.
      }
      touchStart = null;
    }, { passive: false });

    const initialSection = sections[activeIndex];
    track.dataset.activeIndex = String(activeIndex);
    document.body.dataset.activeSection = initialSection.id;
    setActiveA11y(activeIndex);
    updateSwitcher(activeIndex);
    if (window.location.hash.slice(1) === "selected-motion") window.history.replaceState(null, "", "#animation");
    window.dispatchEvent(new CustomEvent("portfolio:sectionchange", { detail: { id: initialSection.id, index: activeIndex } }));
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
    const detailsButton = document.querySelector("[data-motion-details]");
    const dialog = document.querySelector("[data-motion-dialog]");
    const dialogTitle = document.querySelector("[data-motion-dialog-title]");
    const dialogSubtitle = document.querySelector("[data-motion-dialog-subtitle]");
    const dialogDescription = document.querySelector("[data-motion-dialog-description]");
    const dialogClose = document.querySelector("[data-motion-dialog-close]");
    const list = document.querySelector("[data-motion-list]");
    if (!player || !source || !playButton || !seek || !list || motionWorks.length === 0) return;

    let currentIndex = 0;
    let dialogReturnFocus = null;

    const updateDialog = (work) => {
      if (!work) return;
      if (dialogTitle) dialogTitle.textContent = work.title;
      if (dialogSubtitle) dialogSubtitle.textContent = work.subtitle || work.title;
      if (dialogDescription) dialogDescription.textContent = work.description;
    };

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
      updateDialog(work);
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

    detailsButton?.addEventListener("click", () => {
      if (!dialog) return;
      dialogReturnFocus = detailsButton;
      updateDialog(motionWorks[currentIndex]);
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
    });
    dialogClose?.addEventListener("click", () => dialog?.close());
    dialog?.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });
    dialog?.addEventListener("close", () => {
      dialogReturnFocus?.focus({ preventScroll: true });
      dialogReturnFocus = null;
    });

    description.textContent = motionWorks[0].description;
    updateDialog(motionWorks[0]);
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
    const pauseAll = () => videos.forEach((video) => video.pause());
    if (reducedMotion || !("IntersectionObserver" in window)) {
      pauseAll();
      return;
    }

    const playVisible = () => {
      if (document.body.dataset.activeSection !== "seasonal-posters") {
        pauseAll();
        return;
      }
      videos.forEach((video) => {
        const rect = video.getBoundingClientRect();
        const visible = rect.right > 0 && rect.left < window.innerWidth && rect.bottom > 0 && rect.top < window.innerHeight;
        if (visible) {
          const playResult = video.play();
          if (playResult && typeof playResult.catch === "function") playResult.catch(() => {});
        } else {
          video.pause();
        }
      });
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (document.body.dataset.activeSection !== "seasonal-posters") {
          entry.target.pause();
        } else if (entry.isIntersecting) {
          const playResult = entry.target.play();
          if (playResult && typeof playResult.catch === "function") playResult.catch(() => {});
        } else {
          entry.target.pause();
        }
      });
    }, { threshold: 0.35, rootMargin: "80px 0px" });
    videos.forEach((video) => observer.observe(video));
    window.addEventListener("portfolio:sectionchange", playVisible);
  }

  wireNavigation();
  renderMotionList();
  renderOtherWorks();
  renderSeasonalWorks();
  initMotion();
  initSeasonalPlayback();
  initSectionPaging();
})();
