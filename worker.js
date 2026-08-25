// ======== 个人博客(全合一版):页面 + 留言 + 统计 + 邮件通知 ========
// 部署方式:整个网站(页面/样式/文章/接口)都在这一份代码里
// 依赖绑定:D1(名 DB)、KV(名 KV)、密钥(名 BREVO_API_KEY)

const INDEX_HTML = '<!DOCTYPE html>' +
'<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<title>我的小站</title><link rel="stylesheet" href="/style.css"></head><body>' +
'<div class="wrap"><header><a class="site-name" href="/">我的小站</a><nav>' +
'<a href="/#guestbook">留言板</a></nav></header>' +
'<main><section class="home-intro"><h1>写点东西,放在网上。</h1>' +
'<p>这里是我的个人博客小站,运行在 Cloudflare 免费服务上。</p></section>' +
'<ul class="posts"><li><a href="/posts/hello-world.html">第一篇:小站开张</a><time>2026-08-25</time></li></ul>' +
'<section class="guestbook" id="guestbook"><h2>留言板</h2>' +
'<p class="notes">看了文章想说两句?这里留,不会丢。</p>' +
'<form id="form"><label for="name">名字(可不填)</label>' +
'<input id="name" type="text" maxlength="20" placeholder="你的昵称">' +
'<label for="text">想说的话</label>' +
'<textarea id="text" maxlength="500" placeholder="随便说点什么..." required></textarea>' +
'<div class="form-foot"><button type="submit" id="btn">发送</button>' +
'<span class="hint" id="hint"></span></div></form></section></main>' +
'<footer><div>大家的留言:<div id="list"></div></div>' +
'<p style="margin-top:24px;">© 2026 · 有事发 <a href="mailto:wurui213@molt213.top">wurui213@molt213.top</a> · 白嫖 Cloudflare 是认真的。</p>' +
'<p id="stats" style="margin-top:6px;"></p></footer></div>' +
'<script>' +
'var form=document.getElementById("form"),hint=document.getElementById("hint"),btn=document.getElementById("btn"),list=document.getElementById("list");' +
'var nameEl=document.getElementById("name"),textEl=document.getElementById("text");' +
'function eh(s){s=String(s);s=s.replace(/&/g,"&amp;");s=s.replace(/</g,"&lt;");s=s.replace(/>/g,"&gt;");s=s.replace(/"/g,"&quot;");return s;}' +
'function load(){fetch("/api/guestbook").then(function(r){return r.json();}).then(function(rows){' +
'if(!rows.length){list.innerHTML="<p class=empty>还一条都没有,来抢沙发吧。</p>";return;}' +
'var h="";for(var i=0;i<rows.length;i++){var r=rows[i];' +
'h+="<div class=msg><div class=m-head><span class=m-name>"+eh(r.name)+"</span><span class=m-time>"+eh(r.created_at||"")+"</span></div><div class=m-text>"+eh(r.text)+"</div></div>";}' +
'list.innerHTML=h;});}' +
'form.addEventListener("submit",function(e){e.preventDefault();' +
'var body=new URLSearchParams({name:nameEl.value,text:textEl.value});' +
'btn.disabled=true;hint.textContent="发送中...";hint.className="hint";' +
'fetch("/api/guestbook",{method:"POST",body:body}).then(function(r){' +
'if(r.ok){textEl.value="";hint.textContent="已收到。";hint.className="hint ok";load();}' +
'else{hint.textContent="发送失败,稍后再试。";hint.className="hint err";' +
'}btn.disabled=false;}).catch(function(){hint.textContent="网络似乎不太好。";hint.className="hint err";btn.disabled=false;});});' +
'load();' +
'fetch("/api/views").then(function(r){return r.json();}).then(function(d){' +
'if(d.ok){document.getElementById("stats").textContent="被访问过 "+d.views+" 次 · 开站第 "+d.days+" 天";}}).catch(function(){});' +
'</script></body></html>';

const STYLE_CSS = ':root{--paper:#faf7f2;--card:#fff;--ink:#26221f;--ink-2:#5d564e;--ink-3:#a99f92;--line:#e9e2d8;--accent:#c2410c;--accent-dark:#9a3412;--accent-soft:#f7ede4;--ok:#15803d;--err:#b91c1c;}' +
'*{box-sizing:border-box;margin:0;padding:0;}' +
'body{font-family:system-ui,-apple-system,"PingFang SC","Hiragino Sans GB","Microsoft YaHei",sans-serif;background:var(--paper);color:var(--ink);font-size:16.5px;line-height:1.85;border-top:4px solid var(--accent);-webkit-font-smoothing:antialiased;}' +
'::selection{background:var(--accent);color:#fff;}' +
'.wrap{max-width:660px;margin:0 auto;padding:0 20px;}' +
'a{color:var(--accent);text-decoration:none;}a:hover{text-decoration:underline;}' +
'header{display:flex;align-items:baseline;justify-content:space-between;padding:30px 0 20px;border-bottom:1px solid var(--line);font-size:15px;}' +
'.site-name{font-size:16px;font-weight:700;color:var(--ink);}.site-name::before{content:"";display:inline-block;width:12px;height:12px;margin-right:10px;background:var(--accent);border-radius:3px;}' +
'header nav a{color:var(--ink-2);font-size:14px;margin-left:18px;}' +
'.home-intro{padding:44px 0 8px;}.home-intro h1{font-size:34px;font-weight:700;letter-spacing:-0.015em;margin-bottom:14px;}' +
'.home-intro h1::after{content:"";display:block;width:56px;height:4px;margin-top:16px;background:var(--accent);border-radius:2px;}' +
'.home-intro p{color:var(--ink-2);}' +
'.posts{list-style:none;margin-top:36px;}.posts li{position:relative;padding:14px 2px 14px 18px;border-bottom:1px solid var(--line);}' +
'.posts li::before{content:"";position:absolute;left:0;top:24px;width:7px;height:7px;border-radius:2px;background:var(--accent-soft);border:1px solid var(--accent);}' +
'.posts li a{color:var(--ink);font-size:17.5px;font-weight:600;}.posts li a:hover{color:var(--accent);text-decoration:none;}' +
'.posts time{color:var(--ink-3);font-size:13.5px;}' +
'.guestbook{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:24px 24px 12px;margin-top:12px;}' +
'.guestbook h2{font-size:20px;margin-bottom:8px;}.guestbook h2::before{content:"▍";color:var(--accent);margin-right:6px;}' +
'.notes{color:var(--ink-3);font-size:14px;}' +
'label{display:block;font-size:13.5px;color:var(--ink-2);margin-bottom:5px;}' +
'input,textarea{width:100%;font-family:inherit;font-size:15.5px;color:var(--ink);background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:9px 13px;margin-bottom:12px;}' +
'input:focus,textarea:focus{outline:none;border-color:var(--accent);background:#fff;box-shadow:0 0 0 3px rgba(194,65,12,.10);}' +
'textarea{min-height:80px;resize:vertical;}' +
'.form-foot{display:flex;align-items:center;justify-content:space-between;gap:12px;}' +
'button{font-family:inherit;font-size:14.5px;font-weight:600;background:var(--accent);color:#fff;border:none;border-radius:8px;padding:8px 18px;cursor:pointer;}' +
'button:hover{background:var(--accent-dark);}.hint{font-size:13px;color:var(--ink-3);}.hint.ok{color:var(--ok);}.hint.err{color:var(--err);}' +
'.msg{padding:11px 0;border-bottom:1px solid var(--line);}.m-head{display:flex;align-items:baseline;gap:8px;}' +
'.m-name{font-weight:600;font-size:14.5px;}.m-time{font-size:12.5px;color:var(--ink-3);}.m-text{font-size:14.5px;color:var(--ink-2);}' +
'.empty{color:var(--ink-3);font-size:14px;margin-top:14px;}' +
'footer{border-top:1px solid var(--line);padding:24px 0 44px;margin-top:40px;color:var(--ink-3);font-size:13px;}';

const POST_HTML = '<!DOCTYPE html>' +
'<html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0">' +
'<title>第一篇:小站开张 · 我的小站</title><link rel="stylesheet" href="/style.css"></head><body>' +
'<div class="wrap"><header><a class="site-name" href="/">我的小站</a><nav><a href="/">首页</a></nav></header>' +
'<main><h1 style="font-size:32px;font-weight:700;margin-bottom:8px;">第一篇:小站开张</h1>' +
'<p style="color:#a99f92;font-size:14px;padding-bottom:24px;margin-bottom:28px;border-bottom:1px solid #e9e2d8;">2026-08-26 · 发布</p>' +
'<p style="margin-bottom:18px;">这是占位示例文章。等真实内容来了就换掉。</p>' +
'<h2 style="font-size:23px;font-weight:700;margin:36px 0 12px;padding-left:12px;border-left:4px solid #c2410c;">这篇子标题的样子</h2>' +
'<p style="margin-bottom:18px;">正文就是这样的段落。中文文字在 16.5px、1.85 行高下最耐看。</p>' +
'<blockquote style="background:#f7ede4;border-left:4px solid #c2410c;border-radius:0 10px 10px 0;margin:20px 0;padding:12px 18px;color:#5d564e;">引用块长这样,适合放自己的一句想法。</blockquote>' +
'<p style="margin-bottom:18px;">就这些,欢迎去留言板挑刺。</p></main>' +
'<footer>© 2026 我的小站</footer></div></body></html>';

const BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const p = url.pathname;

    if (p === "/") return new Response(INDEX_HTML, { headers: { "Content-Type": "text/html; charset=utf-8" } });
    if (p === "/style.css") return new Response(STYLE_CSS, { headers: { "Content-Type": "text/css; charset=utf-8" } });
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
        await env.DB.prepare("INSERT INTO messages (name, text) VALUES (?, ?)").bind(name, text).run();
        notifyOwner(env, { name, text }).catch(() => {});
        return Response.json({ ok: true });
      }
    }

    if (p === "/api/views") return handleViews(env);

    return new Response("Not Found", { status: 404 });
  }
};

async function handleViews(env) {
  try {
    const kv = env.KV;
    if (!kv) return Response.json({ ok: false, error: "no-kv-binding" });
    let views = parseInt((await kv.get("views")) || "0", 10) + 1;
    await kv.put("views", String(views));
    let birthday = await kv.get("birthday");
    if (!birthday) { birthday = "2026-08-26"; await kv.put("birthday", birthday); }
    const days = Math.max(1, Math.floor((Date.now() - new Date(birthday).getTime()) / 86400000) + 1);
    return Response.json({ ok: true, views, days });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) });
  }
}

async function notifyOwner(env, { name, text }) {
  const owner = "wurui213@molt213.top";
  const debug = async (msg) => {
    try { if (env.KV) await env.KV.put("notify_debug", new Date().toISOString() + " " + msg); } catch (e) {}
  };
  const key = env.BREVO_API_KEY;
  if (!key) { await debug("no BREVO_API_KEY secret found"); return; }
  const html = "<p>你的博客收到一条新留言:</p><p><b>" + esc(name) + "</b> 说:</p><blockquote style=\"border-left:3px solid #c2410c;padding-left:12px;color:#5d564e;\">" + esc(text) + "</blockquote>";
  try {
    const resp = await fetch(BREVO_API_ENDPOINT, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({ sender: { email: owner, name: "博客留言通知" }, to: [{ email: owner }], subject: "新留言: " + name, htmlContent: html })
    });
    if (!resp.ok) {
      await debug("Brevo HTTP " + resp.status + ": " + (await resp.text()).slice(0, 300));
    } else {
      await debug("sent ok");
    }
  } catch (e) {
    await debug("fetch error: " + String(e));
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#39;" }[c]));
}
