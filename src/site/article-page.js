export function renderArticlePage(post) {
  return `
<article class="article"><p class="eyebrow"><i></i>${escapeHtml(post.category)} · ${escapeHtml(post.date)}</p><h1>${escapeHtml(post.title).replace("：", "：<br>")}</h1><p class="article-lead">${escapeHtml(post.lead)}</p><em></em>${post.content}</article>`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
