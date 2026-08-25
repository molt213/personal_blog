// 网站入口:处理动态接口 + 返回静态页面
// 数据库绑定通过 env.DB 访问(声明在 wrangler.jsonc 里)
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
        // 兼容历史 bug:客户端可能把空名字传成字符串 "undefined"
        const name = (rawName && rawName !== "undefined") ? rawName.slice(0, 20) : "匿名";
        const text = (form.get("text") || "").trim().slice(0, 500);
        if (!text) return Response.json({ error: "留言不能为空" }, { status: 400 });

        await env.DB
          .prepare("INSERT INTO messages (name, text) VALUES (?, ?)")
          .bind(name, text)
          .run();
        // 留言成功后给站主发通知邮件;密钥未配置时静默跳过,不影响留言功能
        notifyOwner(env, { name, text }).catch(() => {});
        return Response.json({ ok: true });
      }
    }

    if (url.pathname === "/api/views") {
      return handleViews(env);
    }

    // 其他请求(HTML 页面等静态文件)交给 ASSETS 处理
    return env.ASSETS.fetch(request);
  }
}

// 访客计数 + 开站天数(KV 存储;未绑定 KV 时优雅降级)
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

// 通过 Brevo(免费 300 封/天)发送通知邮件,主机固定为官方 https 接口
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
