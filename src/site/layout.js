import { NAVIGATION } from "../../content/site.js";

export function renderPage({ title, active, content, site, canonicalUrl, guestbook = false }) {
  const nav = NAVIGATION.map(item =>
    `<a class="nav-link${item.id === active ? " active" : ""}" href="${item.href}"><span aria-hidden="true">${item.icon}</span>${item.label}</a>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${site.description}">
  ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : ""}
  <title>${title} · ${site.name}</title>
  <link rel="stylesheet" href="/style.css">
  <script src="/site.js" defer></script>
  ${guestbook ? '<script src="/guestbook.js" defer></script>' : ""}
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/" aria-label="回到首页"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>${site.name}</a>
      <p class="side-caption">${site.tagline}</p>
      <nav class="side-nav" aria-label="站点导航">${nav}</nav>
      <div class="side-bottom"><em></em><p id="stats">正在记录相遇的次数…</p><a href="mailto:${site.contactEmail}">写封邮件 ↗</a></div>
    </aside>
    <header class="mobile-header">
      <a class="brand" href="/"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>${site.name}</a>
      <nav aria-label="移动导航">${nav}</nav>
    </header>
    <main class="page-content">${content}</main>
  </div>
</body>
</html>`;
}
