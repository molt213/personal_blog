export function renderPostsPage(posts, views = {}) {
  const categories = [...new Set(posts.map(post => post.category).filter(Boolean))];
  const chips = [
    `<button class="chip active" type="button" data-filter="all">全部 ${posts.length}</button>`,
    ...categories.map(category => {
      const count = posts.filter(post => post.category === category).length;
      return `<button class="chip" type="button" data-filter="${escapeHtml(category)}">${escapeHtml(category)} ${count}</button>`;
    })
  ].join("");

  return `
<section class="page-heading page-heading-v2">
  <div><p class="eyebrow"><i></i>WRITING</p><h1>随记</h1><p>想到什么写什么</p></div>
  <div class="heading-meta"><b>${String(posts.length).padStart(2, "0")}</b><span>篇文字<br>按时间倒序</span></div>
</section>
<div class="filter-row" id="post-filters">${chips}<span class="filter-note">慢慢写，不着急。</span></div>
<section class="post-list" id="post-list">${posts.map((post, index) => renderPostCard(post, index, views)).join("")}</section>
${renderArchive(posts)}
<p class="quiet">更多文字正在路上。也许很快，也许很慢，取决于我什么时候想得起来。</p>`;
}

function renderPostCard(post, index, views = {}) {
  const label = escapeHtml(post.artLabel || post.title || "").replace(/\n/g, "<br>");
  const number = String(index + 1).padStart(2, "0");
  const url = `/posts/${post.slug}.html`;
  const cover = String(post.cover || "");
  const count = Math.max(0, Number(views[post.slug]) || 0);
  const art =
    `<a class="post-art${cover ? " has-cover" : ""}" href="${url}" aria-label="阅读文章：${escapeHtml(post.title)}">` +
    (cover
      ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy" onerror="this.parentElement.classList.remove('has-cover');this.remove()">`
      : "") +
    `<i></i><span>${label}</span><b>${number}</b></a>`;
  return `
<article class="post-card" data-category="${escapeHtml(post.category)}">
  ${art}
  <div class="post-copy"><p><b>${escapeHtml(post.category)}</b>　·　${escapeHtml(post.date)}　·　${count} 次阅读</p><h2><a href="${url}">${escapeHtml(post.title)}</a></h2><span>${escapeHtml(post.excerpt)}</span><a class="arrow" href="${url}">阅读这篇　→</a></div>
</article>`;
}

function renderArchive(posts) {
  const groups = new Map();
  posts.forEach(post => {
    const parts = String(post.date || "").split(".");
    const month = parts.length >= 2 ? `${parts[0]}.${parts[1]}` : String(post.date || "");
    if (!groups.has(month)) groups.set(month, []);
    groups.get(month).push(post);
  });

  const rows = [...groups.entries()].map(([month, items]) => {
    const first = items[0];
    return `<div class="archive-row"><time>${escapeHtml(month)}</time><a href="/posts/${escapeHtml(first.slug)}.html">${escapeHtml(first.title)}</a><b>${items.length} 篇</b></div>`;
  }).join("");

  return `
<section class="archive">
  <div class="archive-head"><h2>按月份翻</h2><span>共 ${posts.length} 篇</span></div>
  ${rows}
</section>`;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
