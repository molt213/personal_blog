export function renderArticlePage(post) {
  const views = Math.max(0, Number(post.views) || 0);
  return `
<article class="article"><p class="eyebrow"><i></i>${escapeHtml(post.category)} · ${escapeHtml(post.date)} · <span id="post-views" data-slug="${escapeHtml(post.slug)}">${views} 次阅读</span></p><h1>${escapeHtml(post.title).replace("：", "：<br>")}</h1><p class="article-lead">${escapeHtml(post.lead)}</p><em></em>${post.content}</article>`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
