import { bytesToBase64, commitChanges, githubReady, readRepoFile } from "../services/github.js";
import { firstImageOf, pickImageUrl } from "../services/post-content.js";

const POSTS_PATH = "content/posts/posts.json";
const BODY_DIR = "public/posts/";
const IMAGE_DIR = "public/images/";
const DOWNLOADS_PATH = "content/downloads.json";
const DOWNLOAD_DIR = "public/downloads/";
const DRAFT_PREFIX = "draft:";
// 文章代号：允许英文大小写、数字、下划线和短横线。
// 老文章里有 Mewtype、kanc_26_9 这种写法，规则太严会把它们过滤掉、也改不了。
const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,60}$/;
const DATE_PATTERN = /^\d{4}\.\d{2}\.\d{2}$/;
const IMAGE_TYPES = { "image/png": "png", "image/jpeg": "jpg", "image/webp": "webp", "image/gif": "gif" };
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
const MAX_IMAGES_PER_UPLOAD = 10;
// 静态资源单文件上限是 25 MiB；后台按钮留一点余量，避免大文件把 Worker 内存顶爆。
const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;
// 只允许文档、压缩包和常见媒体。html/svg/js 这类能在本站执行的文件一律不收。
const DOWNLOAD_EXTENSIONS = new Set([
  "zip", "7z", "rar", "pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx",
  "txt", "md", "csv", "epub", "mobi", "azw3", "xmind", "ipynb",
  "png", "jpg", "jpeg", "webp", "gif", "mp3", "mp4", "wav", "m4a"
]);
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

// 上传资料：一次一个文件，写进 public/downloads/，同时把条目加到 content/downloads.json。
// 扩展名白名单 + 20 MB 上限，避免把能在本站执行的网页文件传上来。
export async function uploadDownload(env, request) {
  let form;
  try {
    form = await request.formData();
  } catch (error) {
    return { status: 400, body: { error: "上传内容格式不对，请重新选择文件" } };
  }

  if (String(form.get("confirm") || "") !== "1") {
    return { status: 400, body: { error: "请先勾选“我确认这个文件可以公开分享”" } };
  }

  const file = form.get("file");
  if (!file || typeof file === "string") return { status: 400, body: { error: "没有收到文件" } };

  const original = String(file.name || "");
  const extension = ((original.match(/\.([A-Za-z0-9]+)$/) || [])[1] || "").toLowerCase();
  if (!DOWNLOAD_EXTENSIONS.has(extension)) {
    return { status: 400, body: { error: `不支持这种文件类型${extension ? `（.${extension}）` : ""}。可以传 zip / 7z / rar / pdf / Office 文档 / 图片 / 音视频。` } };
  }
  if (!file.size) return { status: 400, body: { error: "文件是空的" } };
  if (file.size > MAX_DOWNLOAD_BYTES) {
    return { status: 400, body: { error: `文件 ${formatFileSize(file.size)}，超过 20 MB 上限。更大的文件请用 GitHub 网页上传。` } };
  }

  const fallbackTitle = original.replace(/\.[^.]*$/, "").trim();
  const title = (String(form.get("title") || "").trim() || fallbackTitle || "未命名资料").slice(0, 120);
  const description = String(form.get("description") || "").trim().slice(0, 300);
  const dateInput = String(form.get("date") || "").trim();
  const date = /^\d{4}-\d{2}-\d{2}$/.test(dateInput) ? dateInput : new Date().toISOString().slice(0, 10);

  if (!githubReady(env)) return { status: 503, body: { error: "后台还没有配置 GitHub 密钥，资料暂时传不上去" } };

  let raw;
  try {
    raw = await readRepoFile(env, DOWNLOADS_PATH);
  } catch (error) {
    return { status: 502, body: { error: messageOf(error), code: error.code } };
  }

  let list;
  try {
    list = raw ? JSON.parse(raw) : [];
    if (!Array.isArray(list)) throw new Error("not-array");
  } catch (error) {
    return { status: 500, body: { error: "资料列表 content/downloads.json 格式不对，请先去仓库检查这个文件" } };
  }

  let bytes = new Uint8Array(await file.arrayBuffer());
  const sha256 = await sha256Hex(bytes);
  const content = bytesToBase64(bytes);
  bytes = null;

  const name = safeDownloadName(extension);
  const path = `${DOWNLOAD_DIR}${name}`;
  const entry = {
    title,
    file: `/${path.replace(/^public\//, "")}`,
    format: extension.toUpperCase(),
    size: formatFileSize(file.size),
    count: "",
    date,
    description,
    sha256
  };
  list.unshift(entry);

  try {
    await commitChanges(env, [
      { path, content, encoding: "base64" },
      { path: DOWNLOADS_PATH, content: `${JSON.stringify(list, null, 2)}\n` }
    ], `上传资料：${title}`);
  } catch (error) {
    return { status: error.code === "conflict" ? 409 : 502, body: { error: messageOf(error), code: error.code } };
  }

  return { status: 200, body: { ok: true, title, url: entry.file, size: entry.size, sha256 } };
}

function safeDownloadName(ext) {
  const stamp = new Date().toISOString().replace(/[-:T]/g, "").slice(0, 14);
  const salt = Array.from(crypto.getRandomValues(new Uint8Array(3)), byte => byte.toString(16).padStart(2, "0")).join("");
  return `download-${stamp}-${salt}.${ext}`;
}

function formatFileSize(bytes) {
  if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${bytes} B`;
}

async function sha256Hex(bytes) {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("");
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

// 草稿列表：草稿存在 KV 里（不进仓库），这里把所有草稿按最近保存时间排好
export async function listDrafts(env) {
  if (!env.KV) return { status: 200, body: { ok: true, drafts: [] } };

  const drafts = [];
  let cursor = undefined;
  do {
    const page = await env.KV.list({ prefix: DRAFT_PREFIX, cursor });
    for (const key of page.keys) {
      const value = await env.KV.get(key.name);
      if (!value) continue;
      try {
        const draft = JSON.parse(value);
        drafts.push({
          slug: key.name.slice(DRAFT_PREFIX.length),
          title: String(draft.title || ""),
          savedAt: String(draft.savedAt || ""),
          length: String(draft.content || "").length
        });
      } catch (error) {
        // 坏掉的草稿跳过
      }
    }
    cursor = page.list_complete ? undefined : page.cursor;
  } while (cursor);

  drafts.sort((a, b) => String(b.savedAt).localeCompare(String(a.savedAt)));
  return { status: 200, body: { ok: true, drafts } };
}

export async function removeDraft(env, slug) {
  if (!env.KV) return { status: 503, body: { error: "没有绑定 KV，草稿功能不可用" } };
  if (!SLUG_PATTERN.test(String(slug || ""))) return { status: 400, body: { error: "文章代号不正确" } };

  await env.KV.delete(DRAFT_PREFIX + slug);
  return { status: 200, body: { ok: true, slug } };
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
  if (!SLUG_PATTERN.test(slug)) return { error: "网址代号只能用英文、数字、下划线和短横线，例如 kanc-2026-09" };

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