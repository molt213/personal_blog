// 同一个浏览器在 30 分钟内浏览不同页面，只记作一次相遇。
const VISIT_WINDOW_MS = 30 * 60 * 1000;
const LAST_COUNTED_VISIT_KEY = "molt213-last-counted-visit";
const now = Date.now();
const lastCountedVisit = readNumber(LAST_COUNTED_VISIT_KEY);
const isNewVisit = !lastCountedVisit || now - lastCountedVisit >= VISIT_WINDOW_MS || now < lastCountedVisit;

fetch("/api/views", { method: isNewVisit ? "POST" : "GET" })
  .then(response => response.json())
  .then(data => {
    if (!data.ok) return;
    if (isNewVisit) writeNumber(LAST_COUNTED_VISIT_KEY, now);
    const stats = document.getElementById("stats");
    if (stats) stats.textContent = `已相遇 ${data.views} 次 · 开站第 ${data.days} 天`;
    const statViews = document.getElementById("stat-views");
    const statDays = document.getElementById("stat-days");
    const heroViews = document.getElementById("hero-views");
    const heroDays = document.getElementById("hero-days");
    if (statViews) statViews.textContent = data.views;
    if (statDays) statDays.textContent = data.days;
    if (heroViews) heroViews.textContent = data.views;
    if (heroDays) heroDays.textContent = data.days;
  })
  .catch(() => {});

// 以下都是页面级逻辑：软导航换完正文后由 soft-nav.js 再调用一次。
let articleScrollCleanup = null;

function initPage() {
  // 单篇阅读量：同一浏览器 30 分钟内重复打开同一篇只记一次，刷新不会把数字刷上去。
  const postViewsEl = document.getElementById("post-views");
  if (postViewsEl) {
    const slug = postViewsEl.dataset.slug || "";
    const countedKey = `molt213-post-view-${slug}`;
    const openedAt = Date.now();
    const lastCounted = readNumber(countedKey);
    const countThisView = Boolean(slug) && (!lastCounted || openedAt - lastCounted >= VISIT_WINDOW_MS || openedAt < lastCounted);

    fetch(
      countThisView ? "/api/post-views" : `/api/post-views?slug=${encodeURIComponent(slug)}`,
      countThisView
        ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) }
        : {}
    )
      .then(response => response.json())
      .then(data => {
        if (!data.ok) return;
        if (countThisView) writeNumber(countedKey, openedAt);
        postViewsEl.textContent = `${data.views} 次阅读`;
        const railViews = document.getElementById("rail-views");
        if (railViews) railViews.textContent = `${data.views} 次`;
      })
      .catch(() => {});
  }

  // 随记列表的分类筛选
  const postFilters = document.getElementById("post-filters");
  if (postFilters && !postFilters.dataset.bound) {
    postFilters.dataset.bound = "1";
    postFilters.addEventListener("click", event => {
      const button = event.target.closest("[data-filter]");
      if (!button) return;
      const value = button.dataset.filter;
      postFilters.querySelectorAll(".chip").forEach(chip => {
        chip.classList.toggle("active", chip === button);
      });
      document.querySelectorAll("#post-list .post-card").forEach(card => {
        card.hidden = value !== "all" && card.dataset.category !== value;
      });
    });
  }

  // 文章页：顶部阅读进度 + 右侧目录高亮
  if (articleScrollCleanup) {
    articleScrollCleanup();
    articleScrollCleanup = null;
  }
  const article = document.querySelector(".article");
  const progress = document.querySelector(".read-progress");
  if (article && progress) {
    const tocLinks = [...document.querySelectorAll(".article-rail nav a")];
    const headings = tocLinks
      .map(link => ({ link, el: document.getElementById(link.getAttribute("href").slice(1)) }))
      .filter(item => item.el);

    function updateProgress() {
      const rect = article.getBoundingClientRect();
      const total = article.offsetHeight - window.innerHeight * 0.35;
      const passed = Math.min(Math.max(-rect.top, 0), Math.max(total, 1));
      progress.style.width = total > 0 ? `${(passed / total) * 100}%` : "0";
    }

    function updateToc() {
      if (!headings.length) return;
      let current = headings[0];
      for (const item of headings) {
        if (item.el.getBoundingClientRect().top <= 150) current = item;
      }
      headings.forEach(item => item.link.classList.toggle("active", item === current));
    }

    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        updateProgress();
        updateToc();
        ticking = false;
      });
    };
    addEventListener("scroll", onScroll, { passive: true });
    articleScrollCleanup = () => removeEventListener("scroll", onScroll);
    updateProgress();
    updateToc();
  }
}

window.__siteInitPage = initPage;
initPage();

function readNumber(key) {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0;
  }
}

function writeNumber(key, value) {
  try {
    localStorage.setItem(key, String(value));
  } catch {
    // 浏览器禁用本地存储时，仍可正常显示网站，只是无法记住最近一次访问。
  }
}
