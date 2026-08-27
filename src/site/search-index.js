// 搜索引擎使用的站点目录。文章列表更新后，sitemap 会自动包含新文章。
export function renderSitemap(origin, posts) {
  const pages = ["/", "/posts", "/about", ...posts.map(post => `/posts/${post.slug}.html`)];
  const urls = pages.map(path => `  <url><loc>${escapeXml(`${origin}${path}`)}</loc></url>`).join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>`;
}

export function renderRobotsTxt(origin) {
  return `User-agent: *
Allow: /
Disallow: /api/

Sitemap: ${origin}/sitemap.xml
`;
}

function escapeXml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;");
}
