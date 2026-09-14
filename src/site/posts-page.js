export function renderPostsPage(posts) {
  return `
<section class="page-heading"><p class="eyebrow"><i></i>WRITING</p><h1>随记</h1><p>想到什么写什么</p></section>
<section class="post-list">${posts.map(renderPostCard).join("")}</section>
<p class="quiet">更多文字正在路上。也许很快，也许很慢，取决于我什么时候想得起来。</p>`;
}

function renderPostCard(post, index) {
  const label = escapeHtml(post.artLabel).replace(/\n/g, "<br>");
  const number = String(index + 1).padStart(2, "0");
  const url = `/posts/${post.slug}.html`;
  const cover = coverOf(post);
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

// 封面:优先用条目里指定的 cover,否则取文章正文的第一张图片
function coverOf(post) {
  return pickImageUrl(post.cover) || pickImageUrl(firstImageOf(post.content));
}

function firstImageOf(html) {
  const match = String(html || "").match(/<img\b[^>]*?\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
  return match ? (match[2] ?? match[3]) : "";
}

// 站内路径(/开头)或站外 http(s) 地址才可用,其余忽略
function pickImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("/")) return url;
  return /^https?:\/\//i.test(url) ? url : "";
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
