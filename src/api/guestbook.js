import { notifyOwner } from "../services/notification.js";

export async function getGuestbookMessages(env) {
  const { results } = await env.DB.prepare(
    "SELECT name, text, created_at FROM messages ORDER BY id DESC LIMIT 20"
  ).all();
  return results;
}

export async function createGuestbookMessage(request, env, ownerEmail) {
  const form = await request.formData();
  const rawName = String(form.get("name") || "").trim();
  const name = rawName && rawName !== "undefined" ? rawName.slice(0, 20) : "匿名";
  const text = String(form.get("text") || "").trim().slice(0, 500);

  if (!text) return { status: 400, body: { error: "留言不能为空" } };

  await env.DB.prepare("INSERT INTO messages (name, text) VALUES (?, ?)").bind(name, text).run();
  notifyOwner(env, ownerEmail, { name, text }).catch(() => {});
  return { status: 200, body: { ok: true } };
}
