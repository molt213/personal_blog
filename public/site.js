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
  })
  .catch(() => {});

// 单篇阅读量：同一浏览器 30 分钟内重复打开同一篇只记一次，刷新不会把数字刷上去。
const postViewsEl = document.getElementById("post-views");
if (postViewsEl) {
  const slug = postViewsEl.dataset.slug || "";
  const countedKey = `molt213-post-view-${slug}`;
  const lastCounted = readNumber(countedKey);
  const countThisView = Boolean(slug) && (!lastCounted || now - lastCounted >= VISIT_WINDOW_MS || now < lastCounted);

  fetch(
    countThisView ? "/api/post-views" : `/api/post-views?slug=${encodeURIComponent(slug)}`,
    countThisView
      ? { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ slug }) }
      : {}
  )
    .then(response => response.json())
    .then(data => {
      if (!data.ok) return;
      if (countThisView) writeNumber(countedKey, now);
      postViewsEl.textContent = `${data.views} 次阅读`;
    })
    .catch(() => {});
}

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
