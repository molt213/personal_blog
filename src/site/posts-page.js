export function renderPostsPage(posts) {
  return `
<section class="page-heading"><p class="eyebrow"><i></i>WRITING</p><h1>随记</h1><p>想到什么写什么</p></section>
<section class="post-list">${posts.map(renderPostCard).join("")}</section>
<p class="quiet">更多文字正在路上。也许很快，也许很慢，取决于我什么时候想得起来。</p>`;
}

function renderPostCard(post, index) {
  const label = escapeHtml(post.artLabel || post.title || "").replace(/\n/g, "<br>");
  const number = String(index + 1).padStart(2, "0");
  const url = `/posts/${post.slug}.html`;
  const cover = String(post.cover || "");
  const art =
    `<a class="post-art${cover ? " has-cover" : ""}" href="${url}" aria-label="阅读文章：${escapeHtml(post.title)}">` +
    (cover
      ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy" onerror="this.parentElement.classList.remove('has-cover');this.remove()">`
      : "") +
    `<i></i><span>${label}</span><b>${number}</b></a>`;
  return `
<article class="post-card">
  ${art}
  <div class="post-copy"><p><b>${escapeHtml(post.category)}</b>　·　${escapeHtml(post.date)}</p><h2><a href="${url}">${escapeHtml(post.title)}</a></h2><span>${escapeHtml(post.excerpt)}</span><a class="arrow" href="${url}">阅读这篇　→</a></div>
</article>`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}