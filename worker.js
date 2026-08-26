// 网站入口:动态接口逻辑(静态页面由 Cloudflare 资源层直接分发)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/guestbook") {
      if (request.method === "GET") {
        const { results } = await env.DB
          .prepare("SELECT name, text, created_at FROM messages ORDER BY id DESC LIMIT 20")
          .all();
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
          return Response.json({ error: "人机验证没通过,刷新一下再试" }, { status: 400 });
        }

        await env.DB
          .prepare("INSERT INTO messages (name, text) VALUES (?, ?)")
          .bind(name, text)
          .run();
        notifyOwner(env, { name, text }).catch(() => {});
        return Response.json({ ok: true });
      }
    }

    if (url.pathname === "/api/views") {
      return handleViews(env);
    }

    return new Response("Not Found", { status: 404 });
  }
}

// 校验 Turnstile 人机验证;未配置密钥时放行,避免误伤
const TURNSTILE_VERIFY_URL = "https://challenges.cloudflare.com/turnstile/v0/siteverify";
const TURNSTILE_ACTION = "guestbook";
const TURNSTILE_HOSTNAMES = ["molt213.top", "personal-blog.wurui640.workers.dev"];

async function verifyTurnstile(env, token, ip) {
  if (!env.TURNSTILE_SECRET) return true; // 密钥未配,先放行不影响留言
  if (typeof token !== "string" || token.length === 0 || token.length > 2048) return false;

  // 只允许访问 Cloudflare 官方 HTTPS 校验接口,拒绝协议不符/任何非白名单主机
  const url = new URL(TURNSTILE_VERIFY_URL);
  if (url.protocol !== "https:" || url.hostname !== "challenges.cloudflare.com") return false;
  if (new URL(TURNSTILE_VERIFY_URL).pathname !== "/turnstile/v0/siteverify") return false;

  try {
    const resp = await fetch(url, {
      method: "POST",
      body: new URLSearchParams({
        secret: env.TURNSTILE_SECRET,
        response: token,
        remoteip: ip || "",
      }),
      signal: AbortSignal.timeout(10_000),
    });
    const data = await resp.json();
    // 三方条件全过才放行:校验成功 + action 匹配 + 发起页面域名在白名单里
    return data.success === true
      && data.action === TURNSTILE_ACTION
      && TURNSTILE_HOSTNAMES.includes(data.hostname);
  } catch {
    return false;
  }
}

// 访客计数 + 开站天数(存储于 KV)
async function handleViews(env) {
  try {
    const kv = env.KV;
    if (!kv) return Response.json({ ok: false, error: "no-kv-binding" });
    let views = parseInt((await kv.get("views")) || "0", 10) + 1;
    await kv.put("views", String(views));
    let birthday = await kv.get("birthday");
    if (!birthday) {
      birthday = "2026-08-26";
      await kv.put("birthday", birthday);
    }
    const days = Math.max(1, Math.floor((Date.now() - new Date(birthday).getTime()) / 86400000) + 1);
    return Response.json({ ok: true, views, days });
  } catch (e) {
    return Response.json({ ok: false, error: String(e) });
  }
}

// 通过 Brevo(官方 https 接口)发送通知邮件
const BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

async function notifyOwner(env, { name, text }) {
  const owner = "wurui213@molt213.top";
  const debug = async (msg) => {
    try { if (env.KV) await env.KV.put("notify_debug", `${new Date().toISOString()} ${msg}`); } catch {}
  };
  const key = env.BREVO_API_KEY;
  if (!key) { await debug("no BREVO_API_KEY secret found"); return; }
  const html =
    `<p>你的博客收到一条新留言:</p>` +
    `<p><b>${esc(name)}</b> 说:</p>` +
    `<blockquote style="border-left:3px solid #c2410c;padding-left:12px;color:#5d564e;">${esc(text)}</blockquote>`;
  try {
    const resp = await fetch(BREVO_API_ENDPOINT, {
      method: "POST",
      headers: { "api-key": key, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: owner, name: "博客留言通知" },
        to: [{ email: owner }],
        subject: `新留言: ${name}`,
        htmlContent: html,
      }),
    });
    if (!resp.ok) {
      await debug(`Brevo HTTP ${resp.status}: ${(await resp.text()).slice(0, 300)}`);
    } else {
      await debug("sent ok");
    }
  } catch (e) {
    await debug(`fetch error: ${String(e)}`);
  }
}

function esc(s) {
  return String(s).replace(/[&<>"']/g, c => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
}
