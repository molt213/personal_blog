import homeTemplate from "../../content/pages/home.html";

export function renderHomePage({ posts, stats }) {
  const featured = posts[0];
  const side = posts.slice(1, 3);
  const values = {
    STAT_POSTS: pad(posts.length),
    STAT_DAYS: String(Number(stats.days) || 0),
    STAT_VIEWS: String(Number(stats.views) || 0),
    STAT_MESSAGES: String(Number(stats.messages) || 0),
    MINI_POSTS: renderMiniPosts(posts.slice(0, 3)),
    LATEST_POSTS: featured ? renderLatest(featured, side) : '<p class="loading">还没有文章。</p>'
  };

  return homeTemplate.replace(/\{\{([A-Z_]+)\}\}/g, (match, key) => values[key] ?? "");
}

function renderMiniPosts(posts) {
  return posts.map(post => `
          <a class="mini-post" href="/posts/${escapeHtml(post.slug)}.html">
            <time>${escapeHtml(shortDate(post.date))}</time>
            <span><strong>${escapeHtml(post.title)}</strong><small>${escapeHtml(post.category)} · ${escapeHtml(post.lead || post.excerpt || "")}</small></span>
          </a>`).join("");
}

function renderLatest(feature, side) {
  const url = `/posts/${escapeHtml(feature.slug)}.html`;
  const cover = String(feature.cover || "");
  const coverHtml = cover
    ? `<img src="${escapeHtml(cover)}" alt="" loading="lazy" referrerpolicy="no-referrer" onerror="this.onerror=null;this.parentElement.classList.remove('has-cover');this.remove()">`
    : "";
  const fallbackHtml = `<span class="feature-fallback">${escapeHtml(feature.artLabel || feature.title)}</span>`;

  const sideHtml = side.map((post, index) => {
    const tone = index === 0 ? "side-yellow" : "side-white";
    const number = String(index + 2).padStart(2, "0");
    return `
            <a class="side-post ${tone}" href="/posts/${escapeHtml(post.slug)}.html">
              <span class="side-num">${number}</span>
              <p>${escapeHtml(post.date)} · ${escapeHtml(post.category)}</p>
              <div><h3>${escapeHtml(post.title)}</h3><span class="desc">${escapeHtml(post.lead || post.excerpt || "")}　→</span></div>
            </a>`;
  }).join("");

  return `
          <article class="feature-post">
            <a class="feature-cover${cover ? " has-cover" : ""}" href="${url}" aria-label="阅读：${escapeHtml(feature.title)}">
              ${coverHtml}${fallbackHtml}
              <span class="feature-tag">最新一篇</span>
            </a>
            <div class="feature-copy">
              <p class="meta"><b>${escapeHtml(feature.category)}</b>　·　${escapeHtml(feature.date)}</p>
              <h3><a href="${url}">${escapeHtml(feature.title)}</a></h3>
              <p>${escapeHtml(feature.lead || feature.excerpt || "")}</p>
              <a class="arrow" href="${url}">读这篇　→</a>
            </div>
          </article>
          <div class="side-posts">${sideHtml}</div>`;
}

function shortDate(value) {
  const parts = String(value || "").split(".");
  return parts.length >= 3 ? `${parts[1]}.${parts[2]}` : String(value || "");
}

function pad(value) {
  return String(value).padStart(2, "0");
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
