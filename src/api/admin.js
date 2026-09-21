import { bytesToBase64, commitChanges, githubReady, readRepoFile } from "../services/github.js";
import { firstImageOf, pickImageUrl } from "../services/post-content.js";

const POSTS_PATH = "content/posts/posts.json";
const BODY_DIR = "public/posts/";
const IMAGE_DIR = "public/images/";
const DRAFT_PREFIX = "draft:";
const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,60}$/;
const DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_PER_UPLOAD = 10;
const LIMITS = { title: 120, category: 20, date: 10, excerpt: 200, lead: 200, artLabel: 80, cover: 500, content: 200000 };
const LABELS = { title: "标题", category: "分类", date: "日期", excerpt: "摘要", lead: "导语", artLabel: "卡片标签", cover: "封面地址", content: "正文" };

// 只有站长本人能进后台：域名必须是正式域名（本地预览放行），并且带上 Access 注入的登录邮箱。
// 这样即使有人从 Cloudflare 的预览域名或 workers.dev 绕进来，也拿不到编辑权限。
export function isOwner(request, env) {
  const host = new URL(request.url).hostname.toLowerCase();
  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (local) return true;

  const expectedHost = String(env.ADMIN_HOST || "").toLowerCase();
  if (!expectedHost || host !== expectedHost) return false;

  const owner = String(env.ADMIN_EMAIL || "").toLowerCase();
  const email = String(request.headers.get("cf-access-authenticated-user-email") || "").toLowerCase();
  return Boolean(owner) && email === owner;
}

export async function listPosts(env) {
  // 密钥还没配好时不要报错，让后台页面能正常打开并显示提示
  if (!githubReady(env)) {
    return { status: 200, body: { ok: true, configured: false, posts: [] } };
  }

  try {
    const posts = await readPosts(env);
    return { status: 200, body: { ok: true, configured: true, posts: posts.map(publicFields) } };
  } catch (error) {
    return { status: 502, body: { error: messageOf(error), code: error.code } };
  }
}

export async function getPost(env, slug) {
  if (!SLUG_PATTERN.test(String(slug || ""))) return { status: 400, body: { error: "文章代号不正确" } };

  try {
    const posts = await readPosts(env);
    const meta = posts.find(item => item.slug === slug);
    if (!meta) return { status: 404, body: { error: "找不到这篇文章" } };

    const content = (await readRepoFile(env, BODY_DIR + slug + ".html")) || "";
    return { status: 200, body: { ok: true, post: { ...publicFields(meta), content } } };
  } catch (error) {
    return { status: 502, body: { error: messageOf(error), code: error.code } };
  }
}

export async function publishPost(env, payload) {
  const parsed = normalizePost(payload);
  if (parsed.error) return { status: 400, body: { error: parsed.error } };
  const post = parsed.post;

  let posts;
  try {
    posts = await readPosts(env);
  } catch (error) {
    return { status: 502, body: { error: messageOf(error), code: error.code } };
  }

  const index = posts.findIndex(item => item.slug === post.slug);
  const exists = index >= 0;
  if (exists) posts[index] = post;
  else posts.unshift(post);

  try {
    await commitChanges(env, [
      { path: BODY_DIR + post.slug + ".html", content: post.content.endsWith("\n") ? post.content : `${post.content}\n` },
      { path: POSTS_PATH, content: `${JSON.stringify(posts.map(withoutContent), null, 2)}\n` }
    ], `${exists ? "更新" : "新建"}文章：${post.title}`);
  } catch (error) {
    return { status: error.code === "conflict" ? 409 : 502, body: { error: messageOf(error), code: error.code } };
  }

  await clearDraft(env, post.slug);
  return { status: 200, body: { ok: true, slug: post.slug, created: !exists } };
}

export async function deletePost(env, slug) {
  if (!SLUG_PATTERN.test(String(slug || ""))) return { status: 400, body: { error: "文章代号不正确" } };

  let posts;
  try {
    posts = await readPosts(env);
  } catch (error) {
    return { status: 502, body: { error: messageOf(error), code: error.code } };
  }

  const meta = posts.find(item => item.slug === slug);
  if (!meta) return { status: 404, body: { error: "找不到这篇文章" } };

  const remaining = posts.filter(item => item.slug !== slug);
  try {
    await commitChanges(env, [
      { path: BODY_DIR + slug + ".html", remove: true },
      { path: POSTS_PATH, content: `${JSON.stringify(remaining.map(withoutContent), null, 2)}\n` }
    ], `删除文章：${meta.title}`);
  } catch (error) {
    return { status: error.code === "conflict" ? 409 : 502, body: { error: messageOf(error), code: error.code } };
  }

  await clearDraft(env, slug);
  return { status: 200, body: { ok: true, slug } };
}

// 上传图片：一次请求可以带多张，全部写进 public/images/，合并成一次提交。
// 校验放在最前面，密钥没配好也能先看到"格式不对""图太大"这类具体原因。
export async function uploadImage(env, request) {
  let form;
  try {
    form = await request.formData();
  } catch (error) {
    return { status: 400, body: { error: "上传内容格式不对，请重新选择图片" } };
  }

  const files = form.getAll("file").filter(item => item && typeof item !== "string");
  if (!files.length) return { status: 400, body: { error: "没有收到图片文件" } };
  if (files.length > MAX_IMAGES_PER_UPLOAD) {
    return { status: 400, body: { error: `一次最多上传 ${MAX_IMAGES_PER_UPLOAD} 张图片` } };
  }

  const changes = [];
  for (const file of files) {
    const ext = IMAGE_TYPES[file.type];
    if (!ext) return { status: 400, body: { error: `只支持 png / jpg / webp / gif 图片，收到的是 ${file.type || "未知格式"}` } };
    if (file.size > MAX_IMAGE_BYTES) {
      return { status: 400, body: { error: `有张图片 ${(file.size / 1024 / 1024).toFixed(1)} MB，超过 5 MB 上限，压一下再传` } };
    }

    const name = safeImageName(file.name, ext);
    const path = `${IMAGE_DIR}${name}`;
    if (!/^public\/images\/[\w\u4e00-\u9fa5.-]+\.(png|jpg|webp|gif)$/.test(path)) {
      return { status: 400, body: { error: "文件名不合法" } };
    }

    changes.push({ path, content: bytesToBase64(new Uint8Array(await file.arrayBuffer())), encoding: "base64" });
  }

  if (!githubReady(env)) return { status: 503, body: { error: "后台还没有配置 GitHub 密钥，图片暂时传不上去" } };

  try {
    await commitChanges(env, changes, `上传图片：${changes.map(change => change.path.split("/").pop()).join("、")}`);
  } catch (error) {
    return { status: error.code === "conflict" ? 409 : 502, body: { error: messageOf(error), code: error.code } };
  }

  return { status: 200, body: { ok: true, urls: changes.map(change => `/${change.path.replace(/^public\//, "")}`) } };
}

// 文件名只保留中英文、数字、短横线和点，再补上日期和随机后缀，避免重名和路径穿越
function safeImageName(original, ext) {
  const base = String(original || "")
    .replace(/\.[^.]*$/, "")
    .replace(/[^\w\u4e00-\u9fa5-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const stamp = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(3)), byte => byte.toString(16).padStart(2, "0")).join("");
  return `${base || "image"}-${stamp}-${salt}.${ext}`;
}

export async function readDraft(env, slug) {
  if (!env.KV) return { status: 503, body: { error: "没有绑定 KV，草稿功能不可用" } };
  if (!SLUG_PATTERN.test(String(slug || ""))) return { status: 400, body: { error: "文章代号不正确" } };

  const value = await env.KV.get(DRAFT_PREFIX + slug);
  if (!value) return { status: 200, body: { ok: true, draft: null } };

  try {
    return { status: 200, body: { ok: true, draft: JSON.parse(value) } };
  } catch (error) {
    return { status: 200, body: { ok: true, draft: null } };
  }
}

export async function saveDraft(env, payload) {
  if (!env.KV) return { status: 503, body: { error: "没有绑定 KV，草稿功能不可用" } };

  const raw = payload && typeof payload === "object" ? payload : {};
  const slug = String(raw.slug || "").trim();
  if (!SLUG_PATTERN.test(slug)) return { status: 400, body: { error: "文章代号不正确" } };

  const content = String(raw.content ?? "");
  if (content.length > LIMITS.content) return { status: 400, body: { error: "正文太长了" } };

  const draft = { savedAt: new Date().toISOString() };
  for (const key of ["title", "date", "category", "excerpt", "lead", "artLabel", "cover"]) {
    draft[key] = String(raw[key] ?? "").slice(0, LIMITS[key]);
  }
  draft.content = content;

  await env.KV.put(DRAFT_PREFIX + slug, JSON.stringify(draft));
  return { status: 200, body: { ok: true, savedAt: draft.savedAt } };
}

async function clearDraft(env, slug) {
  if (!env.KV) return;
  try {
    await env.KV.delete(DRAFT_PREFIX + slug);
  } catch (error) {
    // 草稿删不掉不影响发布结果
  }
}

async function readPosts(env) {
  const text = await readRepoFile(env, POSTS_PATH);
  if (text === null) return [];

  let data;
  try {
    data = JSON.parse(text);
  } catch (error) {
    throw fail("文章资料文件 posts.json 格式不对，请先把它改回合法 JSON", "bad-json");
  }
  if (!Array.isArray(data)) throw fail("文章资料文件 posts.json 应该是一个数组", "bad-json");

  return data.filter(item => item && typeof item.slug === "string" && SLUG_PATTERN.test(item.slug));
}

function normalizePost(payload) {
  const raw = payload && typeof payload === "object" ? payload : {};
  const slug = String(raw.slug || "").trim();
  if (!SLUG_PATTERN.test(slug)) return { error: "网址代号只能用英文小写、数字和短横线，例如 kanc-2026-09" };

  const fields = {};
  for (const [key, limit] of Object.entries(LIMITS)) {
    const value = String(raw[key] ?? "").trim();
    if (value.length > limit) return { error: `${LABELS[key]}太长了，最多 ${limit} 个字符` };
    fields[key] = value;
  }

  if (!fields.title) return { error: "标题不能为空" };
  if (!fields.content) return { error: "正文不能为空" };
  if (!DATE_PATTERN.test(fields.date)) return { error: "日期请写成 2026.09.21 这样的格式" };
  if (fields.cover && !pickImageUrl(fields.cover)) return { error: "封面地址只能是 / 开头的站内路径，或 http(s) 开头的网址" };

  return {
    post: {
      slug,
      category: fields.category || "随记",
      date: fields.date,
      title: fields.title,
      excerpt: fields.excerpt || fields.lead,
      lead: fields.lead || fields.excerpt,
      artLabel: fields.artLabel || fields.title.slice(0, 8),
      cover: pickImageUrl(fields.cover) || pickImageUrl(firstImageOf(fields.content)),
      content: fields.content
    }
  };
}

function publicFields(post) {
  return {
    slug: post.slug,
    category: post.category || "",
    date: post.date || "",
    title: post.title || "",
    excerpt: post.excerpt || "",
    lead: post.lead || "",
    artLabel: post.artLabel || "",
    cover: post.cover || ""
  };
}

function withoutContent(post) {
  const { content, ...rest } = post;
  return rest;
}

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function messageOf(error) {
  return String(error && error.message ? error.message : error);
}