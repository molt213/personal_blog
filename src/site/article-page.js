export function renderArticlePage(post) {
  const views = Math.max(0, Number(post.views) || 0);
  const related = Array.isArray(post.related) ? post.related : [];
  const { html: content, toc } = addHeadingIds(post.content);

  const tocLinks = [
    '<a href="#top" class="active">开头</a>',
    ...toc.filter(item => item.text).map(item => `<a href="#${escapeHtml(item.id)}">${escapeHtml(item.text)}</a>`)
  ].join("");

  const relatedLinks = related.length
    ? related.map(item => `<a href="/posts/${escapeHtml(item.slug)}.html">${escapeHtml(item.title)}<small>${escapeHtml(item.date)} · ${escapeHtml(item.category)}</small></a>`).join("")
    : '<a href="/posts">去随记列表看看<small>所有文章</small></a>';

  return `
<div class="read-progress" aria-hidden="true"></div>
<div class="article-layout">
  <article class="article" id="top"><p class="eyebrow"><i></i>${escapeHtml(post.category)} · ${escapeHtml(post.date)} · <span id="post-views" data-slug="${escapeHtml(post.slug)}">${views} 次阅读</span></p><h1>${escapeHtml(post.title).replace("：", "：<br>")}</h1><p class="article-lead">${escapeHtml(post.lead)}</p><em></em>${content}</article>
  <aside class="article-rail" aria-label="文章信息">
    <div class="rail-card"><p class="rail-label">目录</p><nav>${tocLinks}</nav></div>
    <div class="rail-card rail-meta"><p class="rail-label">这篇</p><dl><div><dt>分类</dt><dd>${escapeHtml(post.category)}</dd></div><div><dt>发布</dt><dd>${escapeHtml(post.date)}</dd></div><div><dt>阅读</dt><dd id="rail-views">${views} 次</dd></div></dl></div>
    <div class="rail-card rail-next"><p class="rail-label">继续读</p>${relatedLinks}</div>
  </aside>
</div>`;
}

// 给正文里的 h2 加锚点，并顺手生成目录。
// 已经有 id 的标题保留原 id，避免重复。
function addHeadingIds(content) {
  const toc = [];
  let index = 0;
  const html = String(content || "").replace(/<h2(\s[^>]*)?>(.*?)<\/h2>/gs, (match, attrs = "", inner) => {
    index += 1;
    const text = inner.replace(/<[^>]+>/g, "").trim();
    const existing = /\bid="([^"]+)"/.exec(attrs);
    const id = existing ? existing[1] : `sec-${index}`;
    toc.push({ id, text });
    if (existing) return match;
    return `<h2${attrs} id="${id}">${inner}</h2>`;
  });
  return { html, toc };
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
