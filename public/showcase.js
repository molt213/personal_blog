(() => {
  const root = document.documentElement;
  const THEME_KEY = "molt213-theme";

  // ---------- 深色模式 ----------
  const themeButtons = [...document.querySelectorAll("[data-theme-toggle]")];

  function applyTheme(theme, persist) {
    if (theme === "dark") root.dataset.theme = "dark";
    else delete root.dataset.theme;

    const dark = theme === "dark";
    themeButtons.forEach(button => {
      const icon = button.querySelector("[data-theme-icon]");
      const label = button.querySelector("[data-theme-label]");
      if (icon) icon.textContent = dark ? "☀" : "☾";
      if (label) label.textContent = dark ? "浅色模式" : "深色模式";
      button.setAttribute("aria-label", dark ? "切换到浅色模式" : "切换到深色模式");
    });

    if (persist) {
      try {
        localStorage.setItem(THEME_KEY, theme);
      } catch {
        // 浏览器禁用存储时只在当前页生效
      }
    }
  }

  applyTheme(root.dataset.theme === "dark" ? "dark" : "light", false);
  themeButtons.forEach(button => {
    button.addEventListener("click", () => {
      applyTheme(root.dataset.theme === "dark" ? "light" : "dark", true);
    });
  });

  // ---------- Ctrl+K 命令面板 ----------
  // 搜索条目由 layout.js 从 posts.json 和页面列表生成，注入到 window.__SITE_SEARCH__。
  const ITEMS = Array.isArray(window.__SITE_SEARCH__) ? window.__SITE_SEARCH__ : [];

  const cmdk = document.querySelector(".cmdk");
  const input = cmdk && cmdk.querySelector(".cmdk-input");
  const results = cmdk && cmdk.querySelector(".cmdk-results");
  let active = 0;
  let filtered = ITEMS;

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function highlight(text, query) {
    if (!query) return escapeHtml(text);
    const index = text.toLowerCase().indexOf(query.toLowerCase());
    if (index < 0) return escapeHtml(text);
    return (
      escapeHtml(text.slice(0, index)) +
      "<mark>" +
      escapeHtml(text.slice(index, index + query.length)) +
      "</mark>" +
      escapeHtml(text.slice(index + query.length))
    );
  }

  function render(query) {
    const q = query.trim();
    filtered = ITEMS.filter(item => {
      if (!q) return true;
      return `${item.title} ${item.desc} ${item.type}`.toLowerCase().includes(q.toLowerCase());
    });

    if (!filtered.length) {
      results.innerHTML = '<p class="cmdk-empty">没有找到，换个词试试。</p>';
      active = 0;
      return;
    }

    active = Math.min(active, filtered.length - 1);
    const groups = new Map();
    filtered.forEach((item, index) => {
      if (!groups.has(item.type)) groups.set(item.type, []);
      groups.get(item.type).push({ item, index });
    });

    results.innerHTML = [...groups.entries()]
      .map(([type, rows]) => `
        <div class="cmdk-group">
          <p class="cmdk-group-label">${escapeHtml(type)}</p>
          ${rows.map(({ item, index }) => `
            <a class="cmdk-item${index === active ? " active" : ""}" href="${escapeHtml(item.href)}" data-index="${index}">
              <span class="cmdk-icon" aria-hidden="true">${item.type === "随记" ? "✦" : "⌂"}</span>
              <span class="cmdk-copy"><strong>${highlight(item.title, q)}</strong><small>${highlight(item.desc, q)}</small></span>
              <span class="cmdk-meta">${escapeHtml(item.meta)}</span>
            </a>`).join("")}
        </div>`)
      .join("");
  }

  function openSearch() {
    if (!cmdk) return;
    cmdk.hidden = false;
    document.body.classList.add("cmdk-open");
    input.value = "";
    active = 0;
    render("");
    requestAnimationFrame(() => input.focus());
  }

  function closeSearch() {
    if (!cmdk) return;
    cmdk.hidden = true;
    document.body.classList.remove("cmdk-open");
  }

  function move(delta) {
    if (!filtered.length) return;
    active = (active + delta + filtered.length) % filtered.length;
    render(input.value);
    const current = results.querySelector(".cmdk-item.active");
    if (current) current.scrollIntoView({ block: "nearest" });
  }

  document.querySelectorAll("[data-open-search]").forEach(button => {
    button.addEventListener("click", openSearch);
  });

  if (cmdk) {
    cmdk.querySelectorAll("[data-close-search]").forEach(element => {
      element.addEventListener("click", closeSearch);
    });

    input.addEventListener("input", () => {
      active = 0;
      render(input.value);
    });

    input.addEventListener("keydown", event => {
      if (event.key === "ArrowDown") {
        event.preventDefault();
        move(1);
      } else if (event.key === "ArrowUp") {
        event.preventDefault();
        move(-1);
      } else if (event.key === "Enter") {
        event.preventDefault();
        const item = filtered[active];
        if (!item) return;
        closeSearch();
        if (typeof window.__softNavigate === "function") window.__softNavigate(item.href);
        else location.href = item.href;
      } else if (event.key === "Escape") {
        event.preventDefault();
        closeSearch();
      }
    });
  }

  addEventListener("keydown", event => {
    if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
      if (document.body.classList.contains("lightbox-open")) return;
      event.preventDefault();
      if (cmdk && cmdk.hidden) openSearch();
      else closeSearch();
    } else if (event.key === "Escape" && cmdk && !cmdk.hidden) {
      closeSearch();
    }
  });

  // ---------- 文章图片灯箱 ----------
  const lightbox = document.querySelector(".lightbox");
  const lightboxImage = lightbox && lightbox.querySelector(".lightbox-image");
  const lightboxCaption = lightbox && lightbox.querySelector(".lightbox-caption");
  const lightboxCounter = lightbox && lightbox.querySelector(".lightbox-counter");
  let lightboxImages = [];
  let lightboxCurrent = 0;
  let lightboxBound = false;

  function captionOf(source) {
    const figure = source.closest("figure");
    const node = figure && figure.querySelector("figcaption");
    if (!node) return (source.alt || "").trim();

    // 图注里可能有剧透块，灯箱里不把隐藏文字直接念出来
    const clone = node.cloneNode(true);
    clone.querySelectorAll(".spoiler").forEach(item => item.remove());
    return clone.textContent.trim();
  }

  function showLightbox(index) {
    if (!lightbox || !lightboxImages.length) return;
    lightboxCurrent = (index + lightboxImages.length) % lightboxImages.length;
    const source = lightboxImages[lightboxCurrent];
    lightboxImage.src = source.currentSrc || source.src;
    lightboxImage.alt = source.alt || "";
    const text = captionOf(source);
    lightboxCaption.textContent = text;
    lightboxCaption.hidden = !text;
    lightboxCounter.textContent = lightboxImages.length > 1 ? `${lightboxCurrent + 1} / ${lightboxImages.length}` : "";
    lightboxCounter.hidden = lightboxImages.length <= 1;
    const single = lightboxImages.length <= 1;
    lightbox.querySelector(".lightbox-prev").hidden = single;
    lightbox.querySelector(".lightbox-next").hidden = single;
    lightbox.hidden = false;
    document.body.classList.add("lightbox-open");
  }

  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    document.body.classList.remove("lightbox-open");
    if (lightboxImage) lightboxImage.removeAttribute("src");
  }

  function initLightbox() {
    if (!lightbox) return;
    closeLightbox();
    const article = document.querySelector(".article");
    lightboxImages = article ? [...article.querySelectorAll("img")] : [];
    lightboxImages.forEach((item, index) => {
      item.classList.add("zoomable");
      item.addEventListener("click", () => showLightbox(index));
    });

    if (lightboxBound) return;
    lightboxBound = true;
    lightbox.querySelectorAll("[data-close-lightbox]").forEach(element => {
      element.addEventListener("click", closeLightbox);
    });
    lightbox.querySelector(".lightbox-prev").addEventListener("click", event => {
      event.stopPropagation();
      showLightbox(lightboxCurrent - 1);
    });
    lightbox.querySelector(".lightbox-next").addEventListener("click", event => {
      event.stopPropagation();
      showLightbox(lightboxCurrent + 1);
    });

    addEventListener("keydown", event => {
      if (!lightbox || lightbox.hidden) return;
      if (event.key === "Escape") closeLightbox();
      else if (event.key === "ArrowLeft") showLightbox(lightboxCurrent - 1);
      else if (event.key === "ArrowRight") showLightbox(lightboxCurrent + 1);
    });
  }

  window.__initLightbox = initLightbox;
  window.__closeOverlays = () => {
    closeSearch();
    closeLightbox();
  };
  initLightbox();
})();
