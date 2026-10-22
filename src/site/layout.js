import { NAVIGATION } from "../../content/site.js";
import { POSTS } from "../../content/posts/index.js";

const PAGE_ITEMS = [
  { type: "页面", title: "首页", desc: "让想法有处慢慢停靠", meta: "HOME", href: "/" },
  { type: "页面", title: "随记", desc: "想到什么写什么", meta: "WRITING", href: "/posts" },
  { type: "页面", title: "资料下载", desc: "试卷和复习资料", meta: "DOWNLOADS", href: "/downloads" },
  { type: "页面", title: "友情链接", desc: "网络里的邻居们", meta: "FRIENDS", href: "/links" },
  { type: "页面", title: "留言板", desc: "留下你的痕迹", meta: "GUESTBOOK", href: "/guestbook" },
  { type: "页面", title: "关于", desc: "个人角落", meta: "ABOUT", href: "/about" }
];

export function renderPage({ title, active, content, site, canonicalUrl, guestbook = false, styles = [], scripts = [], noindex = false, footer = true }) {
  const nav = NAVIGATION.map(item =>
    `<a class="nav-link${item.id === active ? " active" : ""}" href="${item.href}"><span aria-hidden="true">${item.icon}</span>${item.label}</a>`
  ).join("");

  const searchItems = [
    ...POSTS.map(post => ({
      type: "随记",
      title: post.title,
      desc: post.lead || post.excerpt || "",
      meta: post.date,
      href: `/posts/${post.slug}.html`
    })),
    ...PAGE_ITEMS
  ];
  const searchJson = JSON.stringify(searchItems).replace(/</g, "\\u003c");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="${site.description}">
  ${noindex ? '<meta name="robots" content="noindex">' : ""}
  ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : ""}
  <title>${title} · ${site.name}</title>
  <script>try{if(localStorage.getItem("molt213-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}</script>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/enhance.css">
  ${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("\n  ")}
  <script>window.__SITE_SEARCH__=${searchJson};</script>
  <script src="/site.js" defer></script>
  <script src="/showcase.js" defer></script>
  ${guestbook ? '<script src="/guestbook.js" defer></script>' : ""}
  ${scripts.map(src => `<script src="${src}" defer></script>`).join("\n  ")}
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/" aria-label="回到首页"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>${site.name}</a>
      <p class="side-caption">${site.tagline}</p>
      <nav class="side-nav" aria-label="站点导航">${nav}</nav>
      <button class="side-search" type="button" data-open-search><span aria-hidden="true">⌕</span>搜索小站 <kbd>Ctrl K</kbd></button>
      <div class="side-bottom"><em></em><p id="stats">正在记录相遇的次数…</p><a href="mailto:${site.contactEmail}">写封邮件 ↗</a><button class="theme-toggle" type="button" data-theme-toggle><span data-theme-icon aria-hidden="true">☾</span><span data-theme-label>深色模式</span></button></div>
    </aside>
    <header class="mobile-header">
      <a class="brand" href="/"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>${site.name}</a>
      <nav aria-label="移动导航">${nav}</nav>
      <div class="mobile-tools">
        <button type="button" data-open-search aria-label="搜索小站">⌕</button>
        <button type="button" data-theme-toggle aria-label="切换深色模式"><span data-theme-icon aria-hidden="true">☾</span></button>
      </div>
    </header>
    <main class="page-content">${content}${footer ? renderFooter(site) : ""}</main>
  </div>
  ${renderCommandPalette()}
  ${renderLightbox()}
</body>
</html>`;
}

function renderFooter(site) {
  const launch = String(site.launchDate || "").split("-");
  const since = launch.length >= 2 ? `${launch[0]}.${Number(launch[1])}` : "";
  return `
  <footer class="site-footer">
    <div class="footer-top">
      <div>
        <a class="footer-brand" href="/"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>${site.name}</a>
        <p>把日常里冒出来的想法留在这里。没有算法，也没有更新计划，想起来就写。</p>
      </div>
      <nav class="footer-nav" aria-label="页脚导航">
        <a href="/">首页</a>
        <a href="/posts">随记</a>
        <a href="/downloads">资料</a>
        <a href="/links">友情链接</a>
        <a href="/guestbook">留言板</a>
        <a href="/about">关于</a>
        <a href="mailto:${site.contactEmail}">写信</a>
      </nav>
      <div class="footer-mail"><small>CONTACT</small><a href="mailto:${site.contactEmail}">${site.contactEmail}</a></div>
    </div>
    <div class="footer-bottom">
      <span>© ${new Date().getFullYear()} molt213 · 内容归我，想法也是</span>
      <span>本网站基于 AI 创作${since ? ` · 始于 ${since}` : ""}</span>
    </div>
  </footer>`;
}

function renderCommandPalette() {
  return `
  <div class="cmdk" hidden>
    <div class="cmdk-backdrop" data-close-search></div>
    <div class="cmdk-panel" role="dialog" aria-modal="true" aria-label="搜索小站">
      <div class="cmdk-input-row">
        <span class="cmdk-search-icon" aria-hidden="true">⌕</span>
        <input class="cmdk-input" type="text" placeholder="搜索文章或页面…" autocomplete="off" spellcheck="false">
        <kbd>Esc</kbd>
      </div>
      <div class="cmdk-results"></div>
      <div class="cmdk-foot"><span><kbd>↑</kbd><kbd>↓</kbd> 选择</span><span><kbd>Enter</kbd> 打开</span><span><kbd>Ctrl</kbd><kbd>K</kbd> 随时呼出</span></div>
    </div>
  </div>`;
}

function renderLightbox() {
  return `
  <div class="lightbox" hidden>
    <div class="lightbox-backdrop" data-close-lightbox></div>
    <button class="lightbox-close" type="button" data-close-lightbox aria-label="关闭">×</button>
    <button class="lightbox-prev" type="button" aria-label="上一张">←</button>
    <figure class="lightbox-figure">
      <img class="lightbox-image" alt="">
      <figcaption class="lightbox-caption"></figcaption>
    </figure>
    <button class="lightbox-next" type="button" aria-label="下一张">→</button>
    <span class="lightbox-counter"></span>
  </div>`;
}
