import { DOWNLOADS } from "../../content/downloads.js";

const ACCEPT = ".zip,.7z,.rar,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.md,.csv,.epub,.mobi,.azw3,.xmind,.ipynb,.png,.jpg,.jpeg,.webp,.gif,.mp3,.mp4,.wav,.m4a";

export function renderAdminDownloadsPage(downloads = DOWNLOADS) {
  const items = downloads.filter(item => item && item.file);

  return `
<section class="page-heading admin-heading">
  <p class="eyebrow"><i></i>FILE DESK</p>
  <h1>资料<br><strong>管理</strong></h1>
  <p>上传文件到下载页，或查看已经发布的资料。文件会提交到 GitHub，大约一分钟后线上更新。</p>
</section>
<nav class="admin-tabs" aria-label="后台导航">
  <a href="/admin">写作</a>
  <a class="active" href="/admin/downloads">资料管理</a>
</nav>
<section class="admin-downloads">
  <div class="admin-downloads-head"><h2>上传新资料</h2><span>单个文件不超过 20 MB</span></div>
  <div class="admin-downloads-body">
    <input id="dl-file" type="file" accept="${ACCEPT}" hidden>
    <div class="admin-dl-row">
      <button class="admin-ghost" id="dl-pick" type="button">选择文件</button>
      <span id="dl-file-name">还没有选择文件</span>
    </div>
    <input id="dl-title" type="text" maxlength="120" placeholder="资料标题（留空就用文件名）">
    <input id="dl-desc" type="text" maxlength="300" placeholder="一句话说明（可选）">
    <label class="admin-dl-check"><input id="dl-confirm" type="checkbox"> 我确认这个文件可以公开分享，不是受版权保护的整本书或付费课程</label>
    <div class="admin-dl-actions">
      <button class="admin-publish" id="dl-upload" type="button">上传资料　↗</button>
      <span id="dl-hint" role="status" aria-live="polite"></span>
    </div>
  </div>
</section>
<section class="admin-downloads">
  <div class="admin-downloads-head"><h2>已发布资料</h2><span id="admin-dl-count">${items.length} 个文件</span></div>
  <div class="admin-dl-list" id="admin-dl-list">
    ${items.length ? items.map(renderDownloadItem).join("") : '<p class="loading">还没有资料，上传第一个吧。</p>'}
  </div>
</section>`;
}

function renderDownloadItem(item) {
  const meta = [item.count, item.size, item.date].filter(Boolean).join(" · ");
  return `
<a class="admin-dl-item" href="${escapeHtml(item.file)}" download>
  <span class="admin-dl-format" aria-hidden="true">${escapeHtml(item.format || "FILE")}</span>
  <span class="admin-dl-main"><b>${escapeHtml(item.title || "")}</b><small>${escapeHtml(meta)}</small></span>
  <span class="admin-dl-open">下载 ↓</span>
</a>`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
