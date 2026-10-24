import { NAVIGATION } from "../../content/site.js";
import { POSTS } from "../../content/posts/index.js";
import { MUSIC } from "../../content/music.js";
import { DOWNLOADS } from "../../content/downloads.js";
import { downloadAnchor } from "./downloads-page.js";

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
    ...DOWNLOADS.filter(item => item && item.file).map(item => ({
      type: "资料",
      title: item.title,
      desc: [item.description, item.count, item.format, item.size].filter(Boolean).join(" · "),
      meta: item.date || "",
      href: `/downloads#${downloadAnchor(item)}`
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
  <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%232864f0'/%3E%3Crect x='8' y='18' width='4' height='7' rx='2' fill='white'/%3E%3Crect x='14' y='12' width='4' height='13' rx='2' fill='white'/%3E%3Crect x='20' y='7' width='4' height='18' rx='2' fill='white'/%3E%3C/svg%3E">
  ${noindex ? '<meta name="robots" content="noindex">' : ""}
  ${canonicalUrl ? `<link rel="canonical" href="${canonicalUrl}">` : ""}
  <title>${title} · ${site.name}</title>
  <script>try{if(localStorage.getItem("molt213-theme")==="dark")document.documentElement.dataset.theme="dark"}catch(e){}</script>
  <link rel="stylesheet" href="/style.css">
  <link rel="stylesheet" href="/enhance.css">
  ${footer ? '<link rel="stylesheet" href="/player.css">' : ""}
  ${styles.map(href => `<link rel="stylesheet" href="${href}">`).join("\n  ")}
  <script>window.__SITE_SEARCH__=${searchJson};</script>
  <script src="/site.js" defer></script>
  <script src="/showcase.js" defer></script>
  ${footer ? `
  <script src="/guestbook.js" defer></script>
  <script src="/vendor/APlayer.min.js" defer></script>
  <script src="/vendor/Meting.min.js" defer></script>
  <script src="/player.js" defer></script>
  <script src="/soft-nav.js" defer></script>` : ""}
  ${scripts.map(src => `<script src="${src}" defer></script>`).join("\n  ")}
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/" aria-label="回到首页"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>${site.name}</a>
      <p class="side-caption">${site.tagline}</p>
      <nav class="side-nav" aria-label="站点导航">${nav}</nav>
      <button class="side-search" type="button" data-open-search><span aria-hidden="true">⌕</span>搜索小站 <kbd>Ctrl K</kbd></button>
      ${footer ? renderPlayer() : ""}
      <div class="side-bottom"><em></em><p id="stats">正在记录相遇的次数…</p><a href="mailto:${site.contactEmail}">写封邮件 ↗</a><a class="side-admin" href="/admin" target="_blank" rel="noopener">后台登录 ↗</a><button class="theme-toggle" type="button" data-theme-toggle><span data-theme-icon aria-hidden="true">☾</span><span data-theme-label>深色模式</span></button></div>
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
  ${footer ? renderPlayerEngine() : ""}
</body>
</html>`;
}

function renderPlayer() {
  return `
  <div class="splayer-slot">
    <section class="splayer" aria-label="站点播放器">
      <div class="splayer-head"><span><i></i>NOW PLAYING</span><span data-index>01 / --</span></div>
      <div class="splayer-art">
        <img data-cover alt="">
        <span class="splayer-vinyl" aria-hidden="true"><i></i></span>
        <button class="splayer-play" type="button" data-play aria-label="播放" disabled>
          <svg class="icon icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8 18 12 8.5 18.2Z"/></svg>
        </button>
      </div>
      <div class="splayer-meta"><b data-title>正在载入…</b><small data-artist>—</small></div>
      <div class="splayer-progress" role="slider" tabindex="0" aria-label="播放进度" aria-disabled="true" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span data-progress-fill></span></div>
      <div class="splayer-time"><span data-current>0:00</span><span data-duration>0:00</span></div>
      <div class="splayer-controls">
        <button type="button" data-prev aria-label="上一首" disabled>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 5.8 8.8 12 18 18.2Z"/><path d="M6 5.5v13"/></svg>
        </button>
        <button type="button" data-next aria-label="下一首" disabled>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5.8 15.2 12 6 18.2Z"/><path d="M18 5.5v13"/></svg>
        </button>
        <button type="button" data-mode aria-label="播放模式：顺序播放" title="顺序播放" disabled>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" data-mode-icon><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>
          <span class="mode-label" data-mode-label>顺序</span>
        </button>
        <button type="button" data-list-toggle aria-expanded="false" disabled>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M4 7h16M4 12h16M4 17h10"/></svg>
          列表 <span data-count>0</span>
        </button>
      </div>
      <div class="splayer-volume">
        <button type="button" data-mute aria-label="静音" disabled>
          <svg class="icon" viewBox="0 0 24 24" aria-hidden="true" data-mute-icon><path d="M11 5 6.5 8.8H3v6.4h3.5L11 19z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>
        </button>
        <input type="range" data-volume min="0" max="100" step="1" value="60" aria-label="音量" disabled>
      </div>
      <div class="splayer-drawer" data-playlist hidden></div>
    </section>
  </div>`;
}

function renderPlayerEngine() {
  const id = escapeAttribute(MUSIC.id);
  const server = escapeAttribute(MUSIC.server);
  const type = escapeAttribute(MUSIC.type);
  const volume = Number(MUSIC.volume) || 0.6;
  const api = MUSIC.api ? `\n    api="${escapeAttribute(MUSIC.api)}"` : "";
  return `
  <meting-js
    class="site-player-engine"
    id="${id}"
    server="${server}"
    type="${type}"${api}
    preload="metadata"
    volume="${volume}"
    list-folded="true"
    storage-name="molt213-site-player"
  ></meting-js>`;
}

function escapeAttribute(value) {
  return String(value).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;");
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
        <a href="/admin" target="_blank" rel="noopener">后台</a>
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
