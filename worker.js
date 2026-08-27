
const NAVIGATION = [
  { id: "home", href: "/", icon: "⌂", label: "首页" },
  { id: "posts", href: "/posts", icon: "✦", label: "文章" },
  { id: "guestbook", href: "/guestbook", icon: "✎", label: "留言板" },
  { id: "about", href: "/about", icon: "◎", label: "关于" }
];

function page(title, active, content, script = "") {
  const nav = NAVIGATION.map(item =>
    `<a class="nav-link${item.id === active ? " active" : ""}" href="${item.href}"><span aria-hidden="true">${item.icon}</span>${item.label}</a>`
  ).join("");

  return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="description" content="一个记录生活、想法与正在发生之事的小站。">
  <title>${title} · 我的小站</title>
  <link rel="stylesheet" href="/style.css">
</head>
<body>
  <div class="app-shell">
    <aside class="sidebar">
      <a class="brand" href="/" aria-label="回到首页"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>我的小站</a>
      <p class="side-caption">留给想法的一点空间</p>
      <nav class="side-nav" aria-label="站点导航">${nav}</nav>
      <div class="side-bottom"><em></em><p id="stats">正在记录相遇的次数…</p><a href="mailto:wurui213@molt213.top">写封邮件 ↗</a></div>
    </aside>
    <header class="mobile-header">
      <a class="brand" href="/"><b class="brand-mark" aria-hidden="true"><i></i><i></i><i></i></b>我的小站</a>
      <nav aria-label="移动导航">${nav}</nav>
    </header>
    <main class="page-content">${content}</main>
  </div>
  ${script}
  <script>
    fetch("/api/views").then(r => r.json()).then(d => {
      if (d.ok) {
        const el = document.getElementById("stats");
        if (el) el.textContent = "已相遇 " + d.views + " 次 · 开站第 " + d.days + " 天";
      }
    }).catch(() => {});
  </script>
</body>
</html>`;
}

const HOME_CONTENT = `
<section class="hero">
  <p class="eyebrow"><i></i>PERSONAL NOTES · 2026</p>
  <h1>让想法有处<br><strong>慢慢停靠。</strong></h1>
  <p class="lead">这里收集读到的、想到的，和一些不想被轻易忘记的日常。没有急着抵达的地方，才适合好好写字。</p>
  <p class="status"><i></i>目前正在整理新的生活切片</p>
</section>
<section class="section">
  <div class="section-head"><div><p>EXPLORE</p><h2>从这里开始</h2></div><span>选择一个方向，慢慢逛。</span></div>
  <div class="entry-grid">
    <a class="entry entry-yellow" href="/posts"><small>01</small><b>✦</b><strong>最近写下的</strong><span>文章与片段　→</span></a>
    <a class="entry entry-blue" href="/guestbook"><small>02</small><b>✎</b><strong>留言板</strong><span>和我打个招呼　→</span></a>
    <a class="entry entry-white" href="/about"><small>03</small><b>◎</b><strong>关于这个小站</strong><span>一些简单介绍　→</span></a>
  </div>
</section>
<p class="closing">✳　慢一点也没关系，生活不是竞速。<i></i><small>写于 2026</small></p>`;

const POSTS_CONTENT = `
<section class="page-heading"><p class="eyebrow"><i></i>WRITING</p><h1>最近写下的</h1><p>暂时放下完成度，先把值得记住的部分留下来。</p></section>
<section class="post-card">
  <a class="post-art" href="/posts/hello-world.html" aria-label="阅读文章：第一篇，小站开张"><i></i><span>HELLO<br>WORLD</span><b>01</b></a>
  <div class="post-copy"><p><b>随笔</b>　·　2026.08.26</p><h2><a href="/posts/hello-world.html">第一篇：小站开张</a></h2><span>从今天开始，把一些没有标准答案的念头，和一些不想被轻易忘记的日常，好好存放在这里。</span><a class="arrow" href="/posts/hello-world.html">阅读这篇　→</a></div>
</section>
<p class="quiet">更多文字正在路上。也许很快，也许要等一个刚刚好的傍晚。</p>`;

const GUESTBOOK_CONTENT = `
<section class="page-heading"><p class="eyebrow"><i></i>GUESTBOOK</p><h1>路过的话，<br>留一句吧。</h1><p>一个问候、一段感受，或者一句「我来过」，都会被认真读到。</p></section>
<section class="guestbook-layout">
  <form class="message-form" id="form">
    <div class="form-intro"><b>✎</b><div><h2>写一条留言</h2><p>不需要想得很完整。</p></div></div>
    <label for="name">怎么称呼你 <small>选填</small></label><input id="name" type="text" maxlength="20" autocomplete="nickname" placeholder="你的昵称">
    <label for="text">想说的话</label><textarea id="text" maxlength="500" required placeholder="写点什么吧…"></textarea>
    <div class="form-foot"><span id="hint" role="status" aria-live="polite">发送后会出现在右边。</span><button id="btn" type="submit">发送留言　↗</button></div>
  </form>
  <section class="messages"><div class="section-head"><div><p>MESSAGES</p><h2>大家留下的话</h2></div><span>来自路过的朋友</span></div><div id="list" class="message-list" aria-live="polite"><p class="loading">正在读取留言…</p></div></section>
</section>`;

const ABOUT_CONTENT = `
<section class="page-heading"><p class="eyebrow"><i></i>ABOUT</p><h1>一个轻盈的<br><strong>个人角落。</strong></h1><p>不追着热点跑，也不急着把一切讲清楚。这里更像一本可以随时翻开的、还在慢慢写的笔记。</p></section>
<section class="about-grid">
  <article class="about blue"><small>01</small><h2>写什么？</h2><p>阅读时划下的句子、写代码时的想法、偶然留意到的生活碎片。</p></article>
  <article class="about yellow"><small>02</small><h2>为什么写？</h2><p>为了不让那些微小却真实的感受，在忙碌里很快消散。</p></article>
  <article class="about white"><small>03</small><h2>怎么联系？</h2><p>如果你愿意，欢迎写一封邮件，或者直接在留言板留下几句话。</p><a class="arrow" href="/guestbook">去留言板　→</a></article>
</section>`;

const ARTICLE_CONTENT = `
<article class="article"><p class="eyebrow"><i></i>随笔 · 2026.08.26</p><h1>第一篇：<br>小站开张</h1><p class="article-lead">从今天开始，这里会慢慢存下我不想忘记的片段。</p><em></em><p>这是占位示例文章。等真实内容来了，就把它换成第一篇真正想留下的文字。</p><h2>这篇子标题的样子</h2><p>正文就是这样的段落。中文在舒展的行距里会更容易阅读，也更像一段可以慢慢走完的路。</p><blockquote>引用块适合放一句自己愿意再读一遍的话。</blockquote><p>就这些。欢迎回到首页，去留言板挑挑刺。</p><a class="primary" href="/guestbook">去留言板　→</a></article>`;

const GUESTBOOK_SCRIPT = `
<script>
(function () {
  var form = document.getElementById("form"), hint = document.getElementById("hint"), btn = document.getElementById("btn"), list = document.getElementById("list"), nameEl = document.getElementById("name"), textEl = document.getElementById("text");
  function escapeHtml(value) { return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;"); }
  function loadMessages() {
    fetch("/api/guestbook").then(function (response) { if (!response.ok) throw new Error("load failed"); return response.json(); }).then(function (rows) {
      if (!rows.length) { list.innerHTML = '<p class="loading">这里还没有留言。要不要留下第一句？</p>'; return; }
      var html = "";
      for (var i = 0; i < rows.length; i++) {
        var row = rows[i];
        html += '<article class="message"><b>' + escapeHtml(String(row.name || "匿").slice(0, 1)) + '</b><div><p><strong>' + escapeHtml(row.name || "匿名") + '</strong><time>' + escapeHtml(String(row.created_at || "").replace(" ", " · ")) + '</time></p><span>' + escapeHtml(row.text) + '</span></div></article>';
      }
      list.innerHTML = html;
    }).catch(function () { list.innerHTML = '<p class="loading">暂时没能读取留言，稍后再来看看吧。</p>'; });
  }
  form.addEventListener("submit", function (event) {
    event.preventDefault(); btn.disabled = true; hint.textContent = "正在送达…"; hint.className = "";
    fetch("/api/guestbook", { method: "POST", body: new URLSearchParams({ name: nameEl.value, text: textEl.value }) }).then(function (response) {
      if (!response.ok) throw new Error("submit failed");
      textEl.value = ""; hint.textContent = "已收到，感谢你留下这句话。"; hint.className = "success"; loadMessages();
    }).catch(function () { hint.textContent = "没有发送成功，请稍后再试。"; hint.className = "error"; }).finally(function () { btn.disabled = false; });
  });
  loadMessages();
}());
</script>`;

const STYLE_CSS = `
:root{--bg:#f5f6fa;--card:#fff;--ink:#162036;--soft:#60708b;--faint:#99a5b9;--line:#e4e9f2;--blue:#2864f0;--blue-dark:#1749c7;--blue-wash:#eaf0ff;--yellow:#f6c64e;--radius:22px;}*{box-sizing:border-box;}html{scroll-behavior:smooth;}body{min-width:320px;margin:0;background:var(--bg);color:var(--ink);font:16px/1.65 Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"PingFang SC","Microsoft YaHei",sans-serif;-webkit-font-smoothing:antialiased;}a{text-decoration:none;color:inherit;}button,input,textarea{font:inherit;}button{cursor:pointer;}button:disabled{opacity:.65;cursor:wait;}.app-shell{width:min(1180px,calc(100% - 48px));min-height:100vh;margin:auto;display:grid;grid-template-columns:238px minmax(0,1fr);gap:58px;}.sidebar{position:sticky;top:0;display:flex;height:100vh;padding:43px 0 34px;flex-direction:column;}.brand{display:inline-flex;align-items:center;gap:11px;width:max-content;font-size:18px;font-weight:850;letter-spacing:-.045em;}.brand-mark{display:inline-flex;align-items:flex-end;gap:3px;width:25px;height:24px;}.brand-mark i{display:block;width:6px;background:var(--blue);border-radius:4px 4px 1px 1px;}.brand-mark i:nth-child(1){height:11px;}.brand-mark i:nth-child(2){height:22px;background:var(--yellow);}.brand-mark i:nth-child(3){height:16px;background:var(--ink);}.side-caption{margin:13px 0 39px;color:var(--faint);font-size:12px;font-weight:650;}.side-nav{display:grid;gap:6px;}.nav-link{display:flex;align-items:center;gap:12px;padding:11px 12px;border-radius:11px;color:var(--soft);font-size:14px;font-weight:750;transition:.18s ease;}.nav-link span{width:18px;text-align:center;font-size:17px;font-weight:500;}.nav-link:hover{color:var(--ink);background:#fff;transform:translateX(2px);}.nav-link.active{color:#fff;background:var(--ink);}.side-bottom{margin-top:auto;color:var(--faint);font-size:12px;font-weight:650;}.side-bottom em{display:block;width:34px;height:4px;margin-bottom:14px;border-radius:9px;background:var(--yellow);}.side-bottom p{margin:0;}.side-bottom a{display:inline-block;margin-top:10px;color:var(--ink);font-size:13px;font-weight:800;}.side-bottom a:hover,.arrow:hover{color:var(--blue);}.mobile-header{display:none;}.page-content{min-width:0;padding:72px 0 60px;}.eyebrow{display:flex;align-items:center;gap:8px;margin:0 0 17px;color:var(--blue);font-size:11px;font-weight:850;letter-spacing:.11em;}.eyebrow i{width:8px;height:8px;border-radius:50%;background:var(--yellow);}.hero{padding:clamp(42px,6vw,76px);border-radius:var(--radius);background:var(--card);}.hero h1,.page-heading h1,.article h1{margin:0;font-size:clamp(48px,6.3vw,78px);line-height:1.05;letter-spacing:-.08em;}.hero h1 strong,.page-heading h1 strong{color:var(--blue);}.lead{max-width:555px;margin:27px 0 0;color:var(--soft);font-size:18px;}.status{display:flex;align-items:center;gap:9px;margin:38px 0 0;color:var(--faint);font-size:13px;font-weight:700;}.status i{width:9px;height:9px;border-radius:50%;background:#51c689;}.section{padding:91px 0 60px;}.section-head{display:flex;align-items:end;justify-content:space-between;gap:24px;margin-bottom:23px;}.section-head p{margin:0 0 6px;color:var(--blue);font-size:11px;font-weight:850;letter-spacing:.11em;}.section-head h2{margin:0;font-size:30px;line-height:1.15;letter-spacing:-.055em;}.section-head>span{color:var(--faint);font-size:13px;font-weight:700;}.entry-grid,.about-grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:13px;}.entry{position:relative;display:flex;min-height:218px;padding:25px;overflow:hidden;border-radius:var(--radius);flex-direction:column;transition:transform .2s ease;}.entry:hover{transform:translateY(-4px);}.entry-yellow{background:var(--yellow);}.entry-blue{color:#fff;background:var(--blue);}.entry-white{background:var(--card);}.entry small{font-size:12px;font-weight:850;opacity:.65;}.entry b{margin:auto 0 9px;font-size:34px;line-height:1;}.entry strong{font-size:20px;letter-spacing:-.045em;}.entry span{margin-top:3px;font-size:12px;font-weight:700;opacity:.65;}.closing{display:flex;align-items:center;gap:12px;margin:0;color:var(--soft);font-size:14px;}.closing i{height:1px;flex:1;background:var(--line);}.closing small{color:var(--faint);font-weight:700;white-space:nowrap;}.page-heading{max-width:700px;padding:16px 0 55px;}.page-heading h1{font-size:clamp(43px,5.6vw,67px);}.page-heading>p:not(.eyebrow){max-width:520px;margin:22px 0 0;color:var(--soft);font-size:18px;}.post-card{display:grid;min-height:310px;overflow:hidden;border-radius:var(--radius);grid-template-columns:minmax(230px,.83fr) minmax(0,1.17fr);background:var(--card);}.post-art{position:relative;isolation:isolate;display:flex;align-items:flex-end;padding:28px;overflow:hidden;background:var(--yellow);font-size:clamp(38px,5vw,61px);font-weight:900;line-height:.82;letter-spacing:-.09em;}.post-art>i{position:absolute;z-index:-1;inset:0;opacity:.26;background-image:linear-gradient(var(--ink) 1px,transparent 1px),linear-gradient(90deg,var(--ink) 1px,transparent 1px);background-size:34px 34px;}.post-art b{position:absolute;top:24px;right:24px;display:grid;width:40px;height:40px;place-items:center;border-radius:50%;color:#fff;background:var(--ink);font-size:11px;letter-spacing:0;}.post-copy{display:flex;padding:clamp(31px,5vw,57px);flex-direction:column;align-items:flex-start;justify-content:center;}.post-copy p{margin:0;color:var(--faint);font-size:12px;font-weight:800;}.post-copy p b{color:var(--blue);}.post-copy h2{margin:12px 0;font-size:clamp(27px,3.5vw,37px);line-height:1.15;letter-spacing:-.055em;}.post-copy h2 a:hover{color:var(--blue);}.post-copy>span{max-width:450px;color:var(--soft);}.arrow{display:inline-block;margin-top:25px;font-size:14px;font-weight:850;}.quiet{margin:33px 0 0;color:var(--faint);font-size:13px;font-weight:650;}.guestbook-layout{display:grid;grid-template-columns:minmax(300px,.8fr) minmax(0,1.2fr);gap:38px;align-items:start;}.message-form{padding:30px;border-radius:var(--radius);color:#fff;background:var(--ink);}.form-intro{display:flex;gap:12px;align-items:flex-start;margin-bottom:27px;}.form-intro>b{display:grid;width:35px;height:35px;place-items:center;border-radius:10px;color:var(--ink);background:var(--yellow);font-size:18px;}.form-intro h2{margin:0;font-size:20px;letter-spacing:-.04em;}.form-intro p{margin:2px 0 0;color:#aeb8cb;font-size:12px;}.message-form label{display:flex;justify-content:space-between;margin:18px 0 7px;font-size:13px;font-weight:800;}.message-form label:first-of-type{margin-top:0;}.message-form label small{color:#aeb8cb;font-size:11px;}input,textarea{display:block;width:100%;padding:12px 13px;border:1px solid #354157;border-radius:11px;outline:none;color:var(--ink);background:#fff;font-size:15px;}input:focus,textarea:focus{border-color:var(--yellow);box-shadow:0 0 0 3px rgba(246,198,78,.25);}textarea{min-height:130px;resize:vertical;}.form-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:21px;color:#aeb8cb;font-size:12px;font-weight:650;}.form-foot span.success{color:#9de5bc;}.form-foot span.error{color:#ffc4c7;}.form-foot button{border:0;border-radius:11px;padding:12px 14px;color:var(--ink);background:var(--yellow);font-size:13px;font-weight:850;white-space:nowrap;}.messages .section-head{margin:5px 0 17px;}.messages .section-head h2{font-size:25px;}.message-list{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;}.message{display:flex;gap:12px;padding:19px;border-radius:17px;background:var(--card);}.message>b{display:grid;flex:0 0 36px;width:36px;height:36px;place-items:center;border-radius:11px;color:var(--blue);background:var(--blue-wash);font-size:14px;}.message>div{min-width:0;}.message p{display:flex;gap:7px;align-items:baseline;flex-wrap:wrap;margin:0;}.message strong{font-size:14px;}.message time{color:var(--faint);font-size:10px;font-weight:650;}.message span{display:block;margin-top:5px;color:var(--soft);font-size:13px;overflow-wrap:anywhere;white-space:pre-wrap;}.loading{grid-column:1/-1;margin:0;padding:30px;border-radius:17px;color:var(--faint);background:var(--card);text-align:center;font-size:13px;font-weight:700;}.about{display:flex;min-height:255px;padding:26px;border-radius:var(--radius);flex-direction:column;}.about.blue{color:#fff;background:var(--blue);}.about.yellow{background:var(--yellow);}.about.white{background:var(--card);}.about small{font-size:12px;font-weight:850;opacity:.6;}.about h2{margin:auto 0 10px;font-size:25px;letter-spacing:-.055em;}.about p{margin:0;font-size:14px;opacity:.78;}.article{max-width:700px;padding:23px 0 60px;}.article h1{font-size:clamp(45px,6vw,70px);}.article-lead{max-width:500px;margin:22px 0 0;color:var(--soft);font-size:19px;}.article>em{display:block;width:64px;height:6px;margin:46px 0 35px;border-radius:99px;background:var(--yellow);}.article>p:not(.eyebrow):not(.article-lead){margin:0 0 22px;color:#354159;font-size:17px;}.article h2{margin:48px 0 14px;font-size:29px;line-height:1.18;letter-spacing:-.05em;}.article blockquote{margin:30px 0;padding:20px 23px;border-radius:0 14px 14px 0;border-left:5px solid var(--blue);color:#3b4965;background:var(--blue-wash);font-size:18px;}.primary{display:inline-block;margin-top:18px;padding:13px 17px;border-radius:11px;color:#fff;background:var(--blue);font-size:14px;font-weight:850;}.primary:hover{background:var(--blue-dark);}@media(max-width:850px){.app-shell{display:block;width:min(100%,720px);padding:0 22px;}.sidebar{display:none;}.mobile-header{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:19px 0 10px;}.mobile-header .brand{font-size:16px;}.mobile-header nav{display:flex;gap:2px;overflow-x:auto;}.mobile-header .nav-link{gap:4px;padding:7px 8px;font-size:11px;white-space:nowrap;}.mobile-header .nav-link span{width:auto;font-size:14px;}.page-content{padding:39px 0 45px;}.entry-grid,.about-grid,.guestbook-layout{grid-template-columns:1fr;}.entry{min-height:170px;}.post-card{grid-template-columns:1fr;}.post-art{min-height:220px;}.post-copy{padding:30px;}.messages{padding-top:15px;}.page-heading{padding-bottom:42px;}}@media(max-width:500px){.app-shell{padding:0 14px;}.mobile-header{align-items:flex-start;flex-direction:column;gap:10px;}.mobile-header nav{width:100%;justify-content:space-between;}.mobile-header .nav-link{padding:8px 7px;}.page-content{padding-top:31px;}.hero{padding:35px 27px;}.hero h1,.page-heading h1,.article h1{font-size:44px;}.lead{font-size:15px;}.section{padding:64px 0 40px;}.section-head{align-items:flex-start;flex-direction:column;gap:7px;}.closing{flex-wrap:wrap;}.closing i{display:none;}.closing small{width:100%;}.message-form{padding:23px;}.message-list{grid-template-columns:1fr;}.form-foot{align-items:stretch;flex-direction:column;}.form-foot button{width:100%;}.about{min-height:220px;}}
`;

const HOME_HTML = page("首页", "home", HOME_CONTENT);
const POSTS_HTML = page("文章", "posts", POSTS_CONTENT);
const GUESTBOOK_HTML = page("留言板", "guestbook", GUESTBOOK_CONTENT, GUESTBOOK_SCRIPT);
const ABOUT_HTML = page("关于", "about", ABOUT_CONTENT);
const ARTICLE_HTML = page("第一篇：小站开张", "posts", ARTICLE_CONTENT);
const BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;
    if (path === "/") return html(HOME_HTML);
    if (path === "/posts") return html(POSTS_HTML);
    if (path === "/guestbook") return html(GUESTBOOK_HTML);
    if (path === "/about") return html(ABOUT_HTML);
    if (path === "/posts/hello-world.html") return html(ARTICLE_HTML);
    if (path === "/style.css") return new Response(STYLE_CSS, { headers: { "Content-Type": "text/css; charset=utf-8" } });

    if (path === "/api/guestbook") {
      if (request.method === "GET") {
        const { results } = await env.DB.prepare("SELECT name, text, created_at FROM messages ORDER BY id DESC LIMIT 20").all();
        return Response.json(results);
      }
      if (request.method === "POST") {
        const form = await request.formData();
        const rawName = String(form.get("name") || "").trim();
        const name = rawName && rawName !== "undefined" ? rawName.slice(0, 20) : "匿名";
        const text = String(form.get("text") || "").trim().slice(0, 500);
        if (!text) return Response.json({ error: "留言不能为空" }, { status: 400 });
        await env.DB.prepare("INSERT INTO messages (name, text) VALUES (?, ?)").bind(name, text).run();
        notifyOwner(env, { name, text }).catch(() => {});
        return Response.json({ ok: true });
      }
    }

    if (path === "/api/views") return handleViews(env);
    return new Response("Not Found", { status: 404 });
  }
};

function html(content) {
  return new Response(content, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

async function handleViews(env) {
  try {
    if (!env.KV) return Response.json({ ok: false, error: "no-kv-binding" });
    const views = parseInt((await env.KV.get("views")) || "0", 10) + 1;
    await env.KV.put("views", String(views));
    let birthday = await env.KV.get("birthday");
    if (!birthday) {
      birthday = "2026-08-26";
      await env.KV.put("birthday", birthday);
    }
    const days = Math.max(1, Math.floor((Date.now() - new Date(birthday).getTime()) / 86400000) + 1);
    return Response.json({ ok: true, views, days });
  } catch (error) {
    return Response.json({ ok: false, error: String(error) });
  }
}

async function notifyOwner(env, message) {
  const owner = "wurui213@molt213.top";
  const debug = async status => {
    try { if (env.KV) await env.KV.put("notify_debug", new Date().toISOString() + " " + status); } catch (error) {}
  };
  if (!env.BREVO_API_KEY) {
    await debug("no BREVO_API_KEY secret found");
    return;
  }
  const content = "<p>你的博客收到一条新留言：</p><p><b>" + escapeForEmail(message.name) + "</b> 说：</p><blockquote style=\"border-left:3px solid #2864f0;padding-left:12px;color:#5d6780;\">"+ escapeForEmail(message.text) + "</blockquote>";
  try {
    const response = await fetch(BREVO_API_ENDPOINT, {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({ sender: { email: owner, name: "博客留言通知" }, to: [{ email: owner }], subject: "新留言：" + message.name, htmlContent: content })
    });
    await debug(response.ok ? "sent ok" : "Brevo HTTP " + response.status + ": " + (await response.text()).slice(0, 300));
  } catch (error) {
    await debug("fetch error: " + String(error));
  }
}

function escapeForEmail(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
