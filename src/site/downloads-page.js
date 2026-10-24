import { DOWNLOADS } from "../../content/downloads.js";

// 搜索跳转要用到锚点，统一在这里算，避免页面和索引各写一套。
export function downloadAnchor(item) {
  const base = String(item?.file || "")
    .split("/")
    .pop()
    .replace(/\.[^.]+$/, "")
    .replace(/[^A-Za-z0-9_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .toLowerCase();
  return `dl-${base || "file"}`;
}

export function renderDownloadsPage(downloads = DOWNLOADS) {
  const items = downloads
    .filter(item => item && item.file)
    .map(renderDownloadCard)
    .join("");

  const list = items
    ? `<section class="dl-grid">${items}</section>`
    : `<p class="loading">资料还在整理，过几天再来看看。</p>`;

  return `${list}
<p class="dl-note">这些资料只供学习交流，请不要用于商业用途。链接失效或者有别的想找的资料，可以去 <a href="/guestbook">留言板</a> 说一声。</p>`;
}

function renderDownloadCard(item) {
  const meta = [item.count, item.size, item.date]
    .filter(Boolean)
    .map(value => `<span>${escapeHtml(value)}</span>`)
    .join("");

  const checksum = item.sha256
    ? `<details class="dl-check"><summary>校验文件（SHA-256）</summary><code>${escapeHtml(item.sha256)}</code></details>`
    : "";

  return `
<article class="dl-card" id="${escapeHtml(downloadAnchor(item))}">
  <div class="dl-top">
    <span class="dl-badge" aria-hidden="true">${escapeHtml(item.format || "FILE")}</span>
    <div class="dl-head">
      <h2>${escapeHtml(item.title || "")}</h2>
      <p>${escapeHtml(item.description || "")}</p>
    </div>
  </div>
  <div class="dl-foot">
    <span class="dl-meta">${meta}</span>
    <a class="dl-button" href="${escapeHtml(item.file)}" download>下载 <span aria-hidden="true">↓</span></a>
  </div>
  ${checksum}
</article>`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
