export async function recordVisit(env, launchDate, countVisit = false) {
  try {
    if (!env.KV) return { ok: false, error: "no-kv-binding" };

    const storedViews = parseInt((await env.KV.get("views")) || "0", 10);
    const views = countVisit ? storedViews + 1 : storedViews;
    if (countVisit) await env.KV.put("views", String(views));

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

// 单篇文章的阅读量，一篇一个键：views:post:<slug>
const POST_VIEWS_PREFIX = "views:post:";

export async function readPostViews(env, slug) {
  if (!env.KV) return 0;
  try {
    const stored = parseInt((await env.KV.get(POST_VIEWS_PREFIX + slug)) || "0", 10);
    return Number.isFinite(stored) && stored > 0 ? stored : 0;
  } catch (error) {
    return 0;
  }
}

export async function recordPostView(env, slug, countVisit = false) {
  if (!env.KV) return { ok: false, error: "no-kv-binding" };
  try {
    const views = await readPostViews(env, slug);
    const next = countVisit ? views + 1 : views;
    if (countVisit) await env.KV.put(POST_VIEWS_PREFIX + slug, String(next));
    return { ok: true, views: next };
  } catch (error) {
    return { ok: false, error: String(error) };
  }
}

// 列表页要一次显示多篇的阅读量，并行读，不串行等
export async function readPostViewsMap(env, slugs) {
  const entries = await Promise.all(slugs.map(async slug => [slug, await readPostViews(env, slug)]));
  return Object.fromEntries(entries);
}
