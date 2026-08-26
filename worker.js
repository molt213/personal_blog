// ======== 个人博客: 页面 + 留言 + 访问统计 + 邮件通知 ========
// 依赖绑定: D1(名 DB)、KV(名 KV)、密钥(名 BREVO_API_KEY、TURNSTILE_SECRET)

const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="一个记录生活、想法与正在发生之事的小站。">
  <title>我的小站 · 记录正在发生的事</title>
  <link rel="stylesheet" href="/style.css">
  <script src="https://challenges.cloudflare.com/turnstile/v0/api.js" async defer onload="window.initTurnstile && window.initTurnstile()"></script>
</head>
<body>
  <div class="site-shell">
    <header class="site-header">
      <a class="brand" href="/" aria-label="回到首页"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>我的小站</span></a>
      <nav aria-label="主导航"><a class="nav-link active" href="/">首页</a><a class="nav-link" href="#writing">文章</a><a class="nav-cta" href="#guestbook">留个言 <span aria-hidden="true">↗</span></a></nav>
    </header>

    <main>
      <section class="hero" aria-labelledby="hero-title">
        <div class="hero-copy">
          <p class="eyebrow"><span aria-hidden="true"></span>SLOW NOTES · 2026</p>
          <h1 id="hero-title">把日常想法，<br><em>认真留在这里。</em></h1>
          <p class="hero-description">一个轻盈的个人角落，记录读到的、想到的，以及生活里那些值得停一下的瞬间。</p>
          <div class="hero-actions"><a class="button button-primary" href="#writing">开始阅读 <span aria-hidden="true">↓</span></a><a class="text-link" href="#guestbook">和我打个招呼 <span aria-hidden="true">→</span></a></div>
        </div>
        <aside class="hero-note" aria-label="站点近况">
          <div class="note-top"><span class="note-label">此刻的状态</span><span class="live-dot">在线</span></div>
          <p class="note-title">在收集新的<br>生活切片。</p>
          <div class="note-bottom"><span>持续更新中</span><span class="note-arrow" aria-hidden="true">↗</span></div>
        </aside>
      </section>

      <section class="content-section" id="writing" aria-labelledby="writing-title">
        <div class="section-heading"><div><p class="section-kicker">WRITING</p><h2 id="writing-title">最近写下的</h2></div><span class="section-count">01 篇文章</span></div>
        <article class="featured-post">
          <a class="post-cover" href="/posts/hello-world.html" aria-label="阅读文章：第一篇，小站开张"><span class="cover-grid" aria-hidden="true"></span><span class="cover-word">HELLO<br>WORLD</span><span class="cover-sticker">01</span></a>
          <div class="post-content"><div class="post-meta"><span>随笔</span><time datetime="2026-08-26">2026.08.26</time></div><h3><a href="/posts/hello-world.html">第一篇：小站开张</a></h3><p>从今天开始，把一些没有标准答案的念头，和一些不想被轻易忘记的日常，好好存放在这里。</p><a class="read-link" href="/posts/hello-world.html">阅读这篇 <span aria-hidden="true">→</span></a></div>
        </article>
      </section>

      <section class="guestbook-section" id="guestbook" aria-labelledby="guestbook-title">
        <div class="guestbook-intro"><p class="section-kicker">GUESTBOOK</p><h2 id="guestbook-title">路过的话，<br>留一句吧。</h2><p>不需要想得很完整。一个问候、一段感受，或是一句「我来过」，都很欢迎。</p><div class="guestbook-accent" aria-hidden="true"><span></span><span></span><span></span></div></div>
        <form class="guestbook-form" id="form">
          <div class="field-row"><label for="name">怎么称呼你 <small>选填</small></label><input id="name" name="name" type="text" maxlength="20" placeholder="你的昵称"></div>
          <div class="field-row"><label for="text">想说的话</label><textarea id="text" name="text" maxlength="500" placeholder="写点什么吧…" required></textarea></div>
          <div class="turnstile-wrap"><div id="turnstile-box"></div></div>
          <div class="form-foot"><p class="form-hint" id="hint" role="status" aria-live="polite">你的留言会被认真读到。</p><button type="submit" class="send-button" id="btn">发送留言 <span aria-hidden="true">↗</span></button></div>
        </form>
      </section>

      <section class="messages-section" aria-labelledby="messages-title">
        <div class="messages-heading"><h2 id="messages-title">大家留下的话</h2><span>来自每一位路过的朋友</span></div>
        <div id="list" class="messages-list" aria-live="polite"><p class="loading-message">正在读取留言…</p></div>
      </section>
    </main>

    <footer class="site-footer">
      <div><a class="brand footer-brand" href="/"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>我的小站</span></a><p>慢一点也没关系，生活不是竞速。</p></div>
      <div class="footer-right"><p id="stats">正在记录相遇的次数…</p><a href="mailto:wurui213@molt213.top">写封邮件 <span aria-hidden="true">↗</span></a></div>
    </footer>
  </div>

  <script>
    var form = document.getElementById("form");
    var hint = document.getElementById("hint");
    var btn = document.getElementById("btn");
    var list = document.getElementById("list");
    var nameEl = document.getElementById("name");
    var textEl = document.getElementById("text");
    var TURNSTILE_SITE_KEY = "0x4AAAAAAEcTHJtlmeUlYK7S";
    var turnstileWidgetId = null;
    window.initTurnstile = function () {
      if (window.turnstile && turnstileWidgetId === null) {
        turnstileWidgetId = window.turnstile.render("turnstile-box", { sitekey: TURNSTILE_SITE_KEY, action: "guestbook" });
      }
    };
    if (window.turnstile) window.initTurnstile();
    function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
    function formatDate(value) { return value ? String(value).replace(" ", " · ") : ""; }
    function loadMessages() {
      fetch("/api/guestbook").then(function (response) {
        if (!response.ok) throw new Error("load failed");
        return response.json();
      }).then(function (rows) {
        if (!rows.length) { list.innerHTML = '<p class="empty-message">这里还没有留言。要不要留下第一句？</p>'; return; }
        var html = "";
        for (var i = 0; i < rows.length; i++) {
          var row = rows[i];
          html += '<article class="message-card"><div class="message-avatar" aria-hidden="true">' + escapeHtml(String(row.name || "匿").slice(0, 1)) + '</div><div class="message-body"><div class="message-meta"><strong>' + escapeHtml(row.name || "匿名") + '</strong><time>' + escapeHtml(formatDate(row.created_at)) + '</time></div><p>' + escapeHtml(row.text) + '</p></div></article>';
        }
        list.innerHTML = html;
      }).catch(function () { list.innerHTML = '<p class="empty-message">暂时没能读取留言，稍后再来看看吧。</p>'; });
    }
    form.addEventListener("submit", function (event) {
      event.preventDefault();
      var token = (window.turnstile && turnstileWidgetId !== null) ? window.turnstile.getResponse(turnstileWidgetId) : "";
      if (!token) {
        hint.textContent = "请先完成人机验证。";
        hint.className = "form-hint is-error";
        return;
      }
      var body = new URLSearchParams({ name: nameEl.value, text: textEl.value, token: token });
      btn.disabled = true; hint.textContent = "正在送达…"; hint.className = "form-hint";
      fetch("/api/guestbook", { method: "POST", body: body }).then(function (response) {
        if (!response.ok) throw new Error("submit failed");
        textEl.value = ""; hint.textContent = "已收到，感谢你留下这句话。"; hint.className = "form-hint is-success"; if (window.turnstile && turnstileWidgetId !== null) window.turnstile.reset(turnstileWidgetId); loadMessages();
      }).catch(function () {
        hint.textContent = "没有发送成功，请稍后再试。"; hint.className = "form-hint is-error";
      }).finally(function () { btn.disabled = false; });
    });
    loadMessages();
    fetch("/api/views").then(function (response) { return response.json(); }).then(function (data) {
      if (data.ok) document.getElementById("stats").textContent = "已相遇 " + data.views + " 次 · 开站第 " + data.days + " 天";
    }).catch(function () {});
  </script>
</body>
</html>`;

const STYLE_CSS = `
:root { --canvas:#f7f8fc; --surface:#fff; --ink:#162036; --ink-soft:#5d6780; --ink-faint:#8f98ac; --line:#e5e9f2; --blue:#2864f0; --blue-dark:#1649c8; --blue-wash:#eaf0ff; --yellow:#f8c64e; --mint:#e0f5ed; --radius-lg:28px; --radius-md:18px; }
* { box-sizing:border-box; } html { scroll-behavior:smooth; } body { margin:0; min-width:320px; background:var(--canvas); color:var(--ink); font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif; font-size:16px; line-height:1.65; -webkit-font-smoothing:antialiased; } a { color:inherit; text-decoration:none; } button,input,textarea { font:inherit; } button { cursor:pointer; } button:disabled { cursor:wait; opacity:.65; }
.site-shell { width:min(1120px,calc(100% - 48px)); margin:0 auto; }.site-header { min-height:92px; display:flex; align-items:center; justify-content:space-between; gap:24px; }.brand { display:inline-flex; align-items:center; gap:11px; color:var(--ink); font-size:18px; font-weight:800; letter-spacing:-.04em; }.brand-mark { display:inline-flex; align-items:flex-end; gap:3px; width:25px; height:24px; }.brand-mark i { display:block; width:6px; background:var(--blue); border-radius:4px 4px 1px 1px; }.brand-mark i:nth-child(1) { height:11px; }.brand-mark i:nth-child(2) { height:22px; background:var(--yellow); }.brand-mark i:nth-child(3) { height:16px; background:var(--ink); }nav { display:flex; align-items:center; gap:6px; font-size:14px; font-weight:700; }.nav-link { padding:9px 13px; color:var(--ink-soft); border-radius:10px; }.nav-link:hover,.nav-link.active { color:var(--ink); background:var(--surface); }.nav-cta { margin-left:8px; padding:10px 15px; border-radius:10px; color:var(--surface); background:var(--ink); transition:transform .18s ease,background .18s ease; }.nav-cta:hover { background:var(--blue); transform:translateY(-1px); }
.hero { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(280px,.7fr); gap:22px; margin-top:24px; }.hero-copy { min-height:440px; padding:clamp(38px,6vw,76px); border-radius:var(--radius-lg); background:var(--surface); display:flex; flex-direction:column; align-items:flex-start; justify-content:center; }.eyebrow,.section-kicker { display:flex; align-items:center; gap:8px; margin:0 0 18px; color:var(--blue); font-size:11px; font-weight:800; letter-spacing:.11em; }.eyebrow span { width:8px; height:8px; border-radius:50%; background:var(--yellow); }.hero h1 { max-width:660px; margin:0; font-size:clamp(45px,6.1vw,78px); line-height:1.08; letter-spacing:-.075em; }.hero h1 em { color:var(--blue); font-style:normal; }.hero-description { max-width:490px; margin:29px 0 0; color:var(--ink-soft); font-size:17px; }.hero-actions { display:flex; align-items:center; flex-wrap:wrap; gap:22px; margin-top:35px; }.button { display:inline-flex; align-items:center; gap:14px; padding:14px 19px; border-radius:12px; font-size:14px; font-weight:800; transition:transform .18s ease,background .18s ease; }.button-primary { color:#fff; background:var(--blue); }.button-primary:hover { background:var(--blue-dark); transform:translateY(-2px); }.text-link { color:var(--ink); font-size:14px; font-weight:800; }.text-link:hover,.read-link:hover { color:var(--blue); }.text-link span,.read-link span { margin-left:5px; }
.hero-note { min-height:440px; padding:30px; border-radius:var(--radius-lg); color:#fff; background:var(--blue); display:flex; flex-direction:column; justify-content:space-between; }.note-top,.note-bottom { display:flex; align-items:center; justify-content:space-between; gap:12px; }.note-label { font-size:13px; font-weight:700; opacity:.72; }.live-dot { display:inline-flex; align-items:center; gap:6px; padding:5px 8px; border-radius:999px; background:rgba(255,255,255,.15); font-size:11px; font-weight:800; }.live-dot::before { content:""; width:6px; height:6px; border-radius:50%; background:#aff4d5; }.note-title { margin:0; font-size:clamp(26px,3.1vw,38px); line-height:1.2; font-weight:800; letter-spacing:-.055em; }.note-bottom { color:rgba(255,255,255,.76); font-size:13px; font-weight:700; }.note-arrow { display:grid; width:36px; height:36px; place-items:center; border-radius:50%; color:var(--ink); background:var(--yellow); font-size:19px; }
.content-section { padding:104px 0; }.section-heading,.messages-heading { display:flex; align-items:flex-end; justify-content:space-between; gap:20px; margin-bottom:28px; }.section-kicker { margin-bottom:7px; }.section-heading h2,.messages-heading h2 { margin:0; font-size:clamp(30px,4vw,42px); line-height:1.1; letter-spacing:-.055em; }.section-count { color:var(--ink-faint); font-size:13px; font-weight:700; }.featured-post { display:grid; grid-template-columns:minmax(270px,.95fr) minmax(0,1.05fr); min-height:355px; overflow:hidden; border-radius:var(--radius-lg); background:var(--surface); }.post-cover { position:relative; isolation:isolate; overflow:hidden; display:flex; align-items:flex-end; padding:32px; color:var(--ink); background:var(--yellow); }.cover-grid { position:absolute; z-index:-1; inset:0; opacity:.28; background-image:linear-gradient(var(--ink) 1px,transparent 1px),linear-gradient(90deg,var(--ink) 1px,transparent 1px); background-size:36px 36px; }.cover-word { font-size:clamp(40px,5vw,66px); line-height:.83; font-weight:900; letter-spacing:-.09em; }.cover-sticker { position:absolute; top:28px; right:28px; display:grid; width:45px; height:45px; place-items:center; border-radius:50%; color:#fff; background:var(--ink); font-size:12px; font-weight:800; }.post-content { display:flex; flex-direction:column; align-items:flex-start; justify-content:center; padding:clamp(32px,5.2vw,64px); }.post-meta { display:flex; align-items:center; gap:10px; color:var(--ink-faint); font-size:12px; font-weight:800; }.post-meta span { color:var(--blue); }.post-meta time::before { content:"·"; margin-right:10px; color:var(--line); }.post-content h3 { margin:13px 0; font-size:clamp(27px,3.5vw,38px); line-height:1.15; letter-spacing:-.055em; }.post-content h3 a:hover { color:var(--blue); }.post-content p { max-width:440px; margin:0; color:var(--ink-soft); }.read-link { margin-top:26px; color:var(--ink); font-size:14px; font-weight:800; }
.guestbook-section { display:grid; grid-template-columns:minmax(0,.82fr) minmax(0,1.18fr); gap:clamp(36px,6vw,84px); padding:clamp(35px,6vw,72px); border-radius:var(--radius-lg); background:var(--ink); color:#fff; }.guestbook-intro { display:flex; flex-direction:column; align-items:flex-start; }.guestbook-intro .section-kicker { color:#9ab8ff; }.guestbook-intro h2 { margin:0; font-size:clamp(34px,4.4vw,52px); line-height:1.08; letter-spacing:-.07em; }.guestbook-intro > p:not(.section-kicker) { max-width:330px; margin:20px 0 0; color:#abb5ca; }.guestbook-accent { display:flex; gap:8px; margin-top:auto; padding-top:45px; }.guestbook-accent span { display:block; width:18px; height:18px; border-radius:5px; background:var(--yellow); }.guestbook-accent span:nth-child(2) { background:#78a1ff; transform:translateY(-10px); }.guestbook-accent span:nth-child(3) { background:var(--mint); }.guestbook-form { padding:30px; border-radius:var(--radius-md); background:#fff; color:var(--ink); }.field-row + .field-row { margin-top:18px; }.field-row label { display:flex; align-items:baseline; justify-content:space-between; margin-bottom:7px; font-size:13px; font-weight:800; }.field-row label small { color:var(--ink-faint); font-size:11px; font-weight:700; }input,textarea { display:block; width:100%; border:1px solid var(--line); border-radius:11px; outline:none; color:var(--ink); background:#fbfcfe; padding:12px 13px; transition:border-color .18s ease,background .18s ease,box-shadow .18s ease; }input::placeholder,textarea::placeholder { color:#aeb6c5; }input:focus,textarea:focus { border-color:var(--blue); background:#fff; box-shadow:0 0 0 3px rgba(40,100,240,.13); }textarea { min-height:112px; resize:vertical; }.form-foot { display:flex; align-items:center; justify-content:space-between; gap:18px; margin-top:21px; }.form-hint { margin:0; color:var(--ink-faint); font-size:12px; font-weight:600; }.form-hint.is-success { color:#167a4e; }.form-hint.is-error { color:#c53c4f; }.send-button { border:0; border-radius:11px; padding:12px 15px; color:#fff; background:var(--blue); font-size:13px; font-weight:800; white-space:nowrap; transition:transform .18s ease,background .18s ease; }.send-button:hover { background:var(--blue-dark); transform:translateY(-1px); }.send-button span { margin-left:7px; }
.messages-section { padding:104px 0; }.messages-heading { margin-bottom:22px; }.messages-heading h2 { font-size:clamp(26px,3.3vw,34px); }.messages-heading span { color:var(--ink-faint); font-size:13px; font-weight:700; }.messages-list { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:13px; }.message-card { display:flex; gap:13px; padding:22px; border-radius:var(--radius-md); background:var(--surface); }.message-avatar { display:grid; flex:0 0 37px; width:37px; height:37px; place-items:center; border-radius:12px; color:var(--blue); background:var(--blue-wash); font-size:14px; font-weight:900; }.message-body { min-width:0; }.message-meta { display:flex; align-items:baseline; flex-wrap:wrap; gap:8px; }.message-meta strong { font-size:14px; }.message-meta time { color:var(--ink-faint); font-size:11px; font-weight:600; }.message-body p { margin:6px 0 0; color:var(--ink-soft); font-size:14px; overflow-wrap:anywhere; white-space:pre-wrap; }.empty-message,.loading-message { grid-column:1 / -1; margin:0; padding:30px; border-radius:var(--radius-md); color:var(--ink-faint); background:var(--surface); text-align:center; font-size:14px; font-weight:700; }
.article-page { padding:85px 0 104px; }.article-content { max-width:700px; margin:0 auto; }.article-content h1 { margin:0; font-size:clamp(44px,6vw,70px); line-height:1.07; letter-spacing:-.07em; }.article-lead { max-width:500px; margin:22px 0 0; color:var(--ink-soft); font-size:19px; }.article-rule { width:64px; height:6px; margin:46px 0 36px; border-radius:99px; background:var(--yellow); }.article-content > p:not(.section-kicker):not(.article-lead) { margin:0 0 22px; color:#354159; font-size:17px; }.article-content h2 { margin:48px 0 14px; font-size:29px; line-height:1.18; letter-spacing:-.05em; }.article-content blockquote { margin:30px 0; padding:20px 23px; border-radius:0 14px 14px 0; border-left:5px solid var(--blue); color:#3b4965; background:var(--blue-wash); font-size:18px; }.article-back { margin-top:20px; }
.site-footer { display:flex; align-items:flex-end; justify-content:space-between; gap:30px; padding:30px 0 44px; border-top:1px solid var(--line); }.footer-brand { font-size:16px; }.site-footer p { margin:8px 0 0; color:var(--ink-faint); font-size:12px; font-weight:600; }.footer-right { text-align:right; }.footer-right a,.site-footer > a { display:inline-block; margin-top:8px; color:var(--ink); font-size:13px; font-weight:800; }.footer-right a:hover,.site-footer > a:hover { color:var(--blue); }
@media (max-width:760px) { .site-shell { width:min(100% - 32px,560px); }.site-header { min-height:76px; }.nav-link { display:none; }.nav-cta { margin-left:0; }.hero,.featured-post,.guestbook-section { grid-template-columns:1fr; }.hero-copy { min-height:390px; }.hero-note { min-height:230px; }.guestbook-intro { min-height:260px; }.content-section,.messages-section { padding:70px 0; }.featured-post { min-height:0; }.post-cover { min-height:260px; }.messages-list { grid-template-columns:1fr; }.article-page { padding:58px 0 70px; } }
@media (max-width:460px) { .site-shell { width:min(100% - 24px,560px); }.site-header { gap:12px; }.brand { font-size:16px; }.nav-cta { padding:9px 11px; font-size:12px; }.hero { margin-top:12px; }.hero-copy,.hero-note,.guestbook-section { border-radius:20px; }.hero-copy { min-height:375px; padding:33px 28px; }.hero-description { font-size:15px; }.section-heading,.messages-heading { align-items:flex-start; flex-direction:column; gap:8px; }.post-content { padding:29px; }.guestbook-section { padding:29px 22px; gap:33px; }.guestbook-form { padding:21px; }.form-foot { align-items:flex-start; flex-direction:column; }.send-button { width:100%; }.site-footer { align-items:flex-start; flex-direction:column; padding-bottom:32px; }.footer-right { text-align:left; } }
`;

const TURNSTILE_CSS = `.turnstile-wrap{margin-top:18px;min-height:65px;overflow:hidden;border-radius:11px;background:#fbfcfe;}`;

const POST_HTML = `<!DOCTYPE html>
<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>第一篇：小站开张 · 我的小站</title><link rel="stylesheet" href="/style.css"></head>
<body><div class="site-shell"><header class="site-header"><a class="brand" href="/" aria-label="回到首页"><span class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></span><span>我的小站</span></a><nav aria-label="主导航"><a class="nav-cta" href="/">返回首页 <span aria-hidden="true">←</span></a></nav></header>
<main class="article-page"><article class="article-content"><p class="section-kicker">随笔 · 2026.08.26</p><h1>第一篇：<br>小站开张</h1><p class="article-lead">从今天开始，这里会慢慢存下我不想忘记的片段。</p><div class="article-rule"></div><p>这是占位示例文章。等真实内容来了，就把它换成第一篇真正想留下的文字。</p><h2>这篇子标题的样子</h2><p>正文就是这样的段落。中文在舒展的行距里会更容易阅读，也更像一段可以慢慢走完的路。</p><blockquote>引用块适合放一句自己愿意再读一遍的话。</blockquote><p>就这些。欢迎回到首页，去留言板挑挑刺。</p><a class="button button-primary article-back" href="/#guestbook">去留言板 <span aria-hidden="true">→</span></a></article></main>
<footer class="site-footer"><p>© 2026 · 我的小站</p><a href="mailto:wurui213@molt213.top">写封邮件 <span aria-hidden="true">↗</span></a></footer></div></body></html>`;

const BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;
    if (p === "/") return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (p === "/style.css") return new Response(STYLE_CSS + TURNSTILE_CSS, { headers: { "Content-Type": "text/css; charset=utf-8" } });
    if (p === "/posts/hello-world.html") return new Response(POST_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (p === "/api/guestbook") {
      if (request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT name, text, created_at FROM messages ORDER BY id DESC LIMIT 20").all();
        return Response.json(results);
      }
      if (request.method === "POST") {
        const form = await request.formData();
        const rawName = (form.get("name") || "").trim();
        const name = (rawName && rawName !== "undefined") ? rawName.slice(0, 20) : "匿名";
        const text = (form.get("text") || "").trim().slice(0, 500);
        if (!text) return Response.json({ error: "留言不能为空" }, { status: 400 });
        const token = form.get("token") || "";
        if (!(await verifyTurnstile(env, token, request.headers.get("CF-Connecting-IP")))) {
          return Response.json({ error: "人机验证没通过，请刷新后再试。" }, { status: 400 });
        }
        await env.DB.prepare("INSERT INTO messages (name, text) VALUES (?, ?)").bind(name, text).run();
        notifyOwner(env, { name, text }).catch(() => {});
        return Response.json({ ok: true });
      }
    }
    if (p === "/api/views") return handleViews(env);
    return new Response("Not Found", { status: 404 });
  }
};

const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "guestbook";
const TURNSTILE_HOSTNAMES = ["molt213.top", "personal-blog.wurui640.workers.dev"];

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true;
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  const url = new URL(TURNSTILE_VERIFY_URL);
  if (url.protocol !== "https:" || url.hostname !== "challenges.cloudflare.com") return false;
  if (url.pathname !== "/turnstile/v0/siteverify") return false;

  try {
    const response = await fetch(url, {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: ip || ""
      }),
      signal: AbortSignal.timeout(10_000)
    });
    const data = await response.json();
    return data.success === true &&
      data.action === TURNSTILE_ACTION &&
      TURNSTILE_HOSTNAMES.includes(data.hostname);
  } catch (error) {
    return false;
  }
}

async function handleViews(env) {
  try {
    const kv = env.KV;
    if (!kv) return Response.json({ ok: false, error: "no-kv-binding" });
    const views = parseInt((await kv.get("views")) || "0", 10) + 1;
    await kv.put("views", String(views));
    let birthday = await kv.get("birthday");
    if (!birthday) { birthday = "2026-08-26"; await kv.put("birthday", birthday); }
    const days = Math.max(1, Math.floor((Date.now() - new Date(birthday).getTime()) / 86400000) + 1);
    return Response.json({ ok: true, views, days });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) });
  }
}

async function notifyOwner(env, { name, text }) {
  const owner = "wurui213@molt213.top";
  const debug = async (message) => { try { if (env.KV) await env.KV.put("notify_debug", new Date().toISOString() + " " + message); } catch (error) {} };
  const key = env.BREVO_API_KEY;
  if (!key) { await debug("no BREVO_API_KEY secret found"); return; }
  const html = "<p>你的博客收到一条新留言：</p><p><b>" + escapeForEmail(name) + "</b> 说：</p><blockquote style=\"border-left:3px solid #2864f0;padding-left:12px;color:#5d6780;\">" + escapeForEmail(text) + "</blockquote>";
  try {
    const response = await fetch(BREVO_API_ENDPOINT, { method: "POST", headers: { "api-key": key, "Content-Type": "application/json" }, body: JSON.stringify({ sender: { email: owner, name: "博客留言通知" }, to: [{ email: owner }], subject: "新留言：" + name, htmlContent: html }) });
    if (!response.ok) await debug("Brevo HTTP " + response.status + ": " + (await response.text()).slice(0, 300));
    else await debug("sent ok");
  } catch (error) {
    await debug("fetch error: " + String(error));
  }
}

function escapeForEmail(value) {
  return String(value).replace(/[&<>"']/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[character]));
}
