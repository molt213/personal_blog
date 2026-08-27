export function renderPostsPage(posts) {
  return `
<section class="page-heading"><p class="eyebrow"><i></i>WRITING</p><h1>最近写下的</h1><p>暂时放下完成度，先把值得记住的部分留下来。</p></section>
<section class="post-list">${posts.map(renderPostCard).join("")}</section>
<p class="quiet">更多文字正在路上。也许很快，也许要等一个刚刚好的傍晚。</p>`;
}

function renderPostCard(post, index) {
  const label = escapeHtml(post.artLabel).replace(/\n/g, "<br>");
  const number = String(index + 1).padStart(2, "0");
  const url = `/posts/${post.slug}.html`;
  return `
<article class="post-card">
  <a class="post-art" href="${url}" aria-label="阅读文章：${escapeHtml(post.title)}"><i></i><span>${label}</span><b>${number}</b></a>
  <div class="post-copy"><p><b>${escapeHtml(post.category)}</b>　·　${escapeHtml(post.date)}</p><h2><a href="${url}">${escapeHtml(post.title)}</a></h2><span>${escapeHtml(post.excerpt)}</span><a class="arrow" href="${url}">阅读这篇　→</a></div>
</article>`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
