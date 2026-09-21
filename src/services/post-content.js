// 文章正文放在 public/posts/<slug>.html，是静态资源，运行时读取，不打包进 Worker。
const BODY_DIR = "/posts/";
const MAX_COVER_LOOKUPS = 20;

// 读取一篇文章的正文；文件不存在时返回 null
export async function readPostBody(env, request, slug) {
  const response = await fetchAsset(env, request, `${BODY_DIR}${slug}.html`);
  return response ? await response.text() : null;
}

// 列表封面：资料里写了 cover 就用它，没写就去正文里找第一张图片
export async function withCovers(env, request, posts) {
  let budget = MAX_COVER_LOOKUPS;
  return Promise.all(posts.map(async post => {
    const declared = pickImageUrl(post.cover);
    if (declared) return { ...post, cover: declared };
    if (budget-- <= 0) return { ...post, cover: "" };
    const body = await readPostBody(env, request, post.slug);
    return { ...post, cover: pickImageUrl(firstImageOf(body)) };
  }));
}

export function firstImageOf(html) {
  const match = String(html || "").match(/<img\b[^>]*?\bsrc\s*=\s*("([^"]*)"|'([^']*)')/i);
  return match ? (match[2] ?? match[3]) : "";
}

// 站内路径(/开头)或站外 http(s) 地址才可用,其余忽略
export function pickImageUrl(value) {
  const url = String(value || "").trim();
  if (!url) return "";
  if (url.startsWith("/")) return url;
  return /^https?:\/\//i.test(url) ? url : "";
}

async function fetchAsset(env, request, path) {
  if (!env.ASSETS) return null;
  try {
    const url = new URL(path, request.url);
    const response = await env.ASSETS.fetch(url.toString());
    return response.ok ? response : null;
  } catch (error) {
    return null;
  }
}