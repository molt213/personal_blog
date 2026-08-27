// 同一个浏览器在 30 分钟内浏览不同页面，只记作一次相遇。
const VISIT_WINDOW_MS = 30 * 60 * 1000;
const LAST_COUNTED_VISIT_KEY = "molt213-last-counted-visit";
const now = Date.now();
const lastCountedVisit = getLastCountedVisit();
const isNewVisit = !lastCountedVisit || now - lastCountedVisit >= VISIT_WINDOW_MS || now < lastCountedVisit;

fetch("/api/views", { method: isNewVisit ? "POST" : "GET" })
  .then(response => response.json())
  .then(data => {
    if (!data.ok) return;
    if (isNewVisit) saveCountedVisit(now);
    const stats = document.getElementById("stats");
    if (stats) stats.textContent = `已相遇 ${data.views} 次 · 开站第 ${data.days} 天`;
  })
  .catch(() => {});

function getLastCountedVisit() {
  try {
    return Number(localStorage.getItem(LAST_COUNTED_VISIT_KEY)) || 0;
  } catch {
    return 0;
  }
}

function saveCountedVisit(timestamp) {
  try {
    localStorage.setItem(LAST_COUNTED_VISIT_KEY, String(timestamp));
  } catch {
    // 浏览器禁用本地存储时，仍可正常显示网站，只是无法记住最近一次访问。
  }
}
