const BREVO_API_ENDPOINT = "https://api.brevo.com/v3/smtp/email";

export async function notifyOwner(env, ownerEmail, message) {
  const debug = async status => {
    try {
      if (env.KV) await env.KV.put("notify_debug", `${new Date().toISOString()} ${status}`);
    } catch (error) {}
  };

  if (!env.BREVO_API_KEY) {
    await debug("no BREVO_API_KEY secret found");
    return;
  }

  const content = `<p>你的博客收到一条新留言：</p><p><b>${escapeForEmail(message.name)}</b> 说：</p><blockquote style="border-left:3px solid #2864f0;padding-left:12px;color:#5d6780;">${escapeForEmail(message.text)}</blockquote>`;

  try {
    const response = await fetch(BREVO_API_ENDPOINT, {
      method: "POST",
      headers: { "api-key": env.BREVO_API_KEY, "Content-Type": "application/json" },
      body: JSON.stringify({
        sender: { email: ownerEmail, name: "博客留言通知" },
        to: [{ email: ownerEmail }],
        subject: `新留言：${message.name}`,
        htmlContent: content
      })
    });
    await debug(response.ok ? "sent ok" : `Brevo HTTP ${response.status}: ${(await response.text()).slice(0, 300)}`);
  } catch (error) {
    await debug(`fetch error: ${String(error)}`);
  }
}

function escapeForEmail(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
