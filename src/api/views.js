export async function recordVisit(env, launchDate) {
  try {
    if (!env.KV) return { ok: false, error: "no-kv-binding" };

    const views = parseInt((await env.KV.get("views")) || "0", 10) + 1;
    await env.KV.put("views", String(views));

    let birthday = await env.KV.get("birthday");
    if (!birthday) {
      birthday = launchDate;
      await env.KV.put("birthday", birthday);
    }

    const days = Math.max(1, Math.floor((Date.now() - new Date(birthday).getTime()) / 86400000) + 1);
    return { ok: true, views, days };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}
