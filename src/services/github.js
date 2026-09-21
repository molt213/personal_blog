// 通过 GitHub API 读写仓库文件。Token 只从 Cloudflare 密钥里读，永远不写进代码。
const API_HOST = "api.github.com";
const API_BASE = `https://${API_HOST}`;

export function githubReady(env) {
  return Boolean(env.GITHUB_TOKEN && env.GITHUB_REPO && env.GITHUB_BRANCH);
}

// 读取一个文件；文件不存在时返回 null
export async function readRepoFile(env, path) {
  const response = await api(env, `/repos/${repo(env)}/contents/${encodePath(path)}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`);
  if (response.status === 404) return null;
  if (!response.ok) throw await apiError(response);

  const data = await response.json();
  if (!data || typeof data.content !== "string") return null;
  return decodeBase64(data.content);
}

// 一次原子提交，changes 里可以是写入 { path, content }、写入二进制 { path, content, encoding: "base64" }
// 或删除 { path, remove: true }。
// 用 Git Data API 而不是逐文件提交，避免出现"正文提交了、文章资料没提交"的半成品。
export async function commitChanges(env, changes, message) {
  const head = await headCommit(env);

  const tree = [];
  for (const change of changes) {
    if (change.remove) {
      tree.push({ path: change.path, mode: "100644", type: "blob", sha: null });
      continue;
    }
    const content = change.encoding === "base64" ? change.content : encodeBase64(change.content);
    const blob = await api(env, `/repos/${repo(env)}/git/blobs`, {
      method: "POST",
      body: JSON.stringify({ content, encoding: "base64" })
    });
    if (!blob.ok) throw await apiError(blob);
    tree.push({ path: change.path, mode: "100644", type: "blob", sha: (await blob.json()).sha });
  }

  const newTree = await api(env, `/repos/${repo(env)}/git/trees`, {
    method: "POST",
    body: JSON.stringify({ base_tree: head.tree, tree })
  });
  if (!newTree.ok) throw await apiError(newTree);

  const commit = await api(env, `/repos/${repo(env)}/git/commits`, {
    method: "POST",
    body: JSON.stringify({ message, tree: (await newTree.json()).sha, parents: [head.sha] })
  });
  if (!commit.ok) throw await apiError(commit);

  const commitSha = (await commit.json()).sha;
  const ref = await api(env, `/repos/${repo(env)}/git/refs/heads/${encodePath(env.GITHUB_BRANCH)}`, {
    method: "PATCH",
    body: JSON.stringify({ sha: commitSha, force: false })
  });
  if (ref.status === 409 || ref.status === 422) throw fail("仓库在你编辑期间有了新提交，请刷新后重试", "conflict");
  if (!ref.ok) throw await apiError(ref);

  return { commit: commitSha };
}

async function headCommit(env) {
  const ref = await api(env, `/repos/${repo(env)}/git/ref/heads/${encodePath(env.GITHUB_BRANCH)}`);
  if (!ref.ok) throw await apiError(ref);

  const commitSha = (await ref.json()).object?.sha;
  if (!commitSha) throw fail("读取仓库分支失败", "bad-ref");

  const commit = await api(env, `/repos/${repo(env)}/git/commits/${commitSha}`);
  if (!commit.ok) throw await apiError(commit);

  const treeSha = (await commit.json()).tree?.sha;
  if (!treeSha) throw fail("读取仓库目录失败", "bad-tree");

  return { sha: commitSha, tree: treeSha };
}

// 所有出站请求都走这里：只允许 https://api.github.com，10 秒超时，Token 不出现在报错里
async function api(env, path, init = {}) {
  if (!githubReady(env)) throw fail("后台还没有配置好 GitHub 密钥", "not-configured");

  const url = new URL(`${API_BASE}${path}`);
  if (url.protocol !== "https:" || url.hostname !== API_HOST) throw fail("拒绝访问其他地址", "blocked-host");

  return fetch(url, {
    method: init.method || "GET",
    headers: {
      Authorization: `Bearer ${env.GITHUB_TOKEN}`,
      Accept: "application/vnd.github+json",
      "User-Agent": "molt213-blog-admin",
      "Content-Type": "application/json"
    },
    body: init.body,
    signal: AbortSignal.timeout(10_000)
  });
}

async function apiError(response) {
  let detail = "";
  try {
    const data = await response.json();
    detail = String(data?.message || "").slice(0, 120);
  } catch (error) {
    detail = "";
  }
  const code = response.status === 401 || response.status === 403 ? "token-rejected" : "github-error";
  return fail(`GitHub 返回 ${response.status}${detail ? `：${detail}` : ""}`, code);
}

function fail(message, code) {
  const error = new Error(message);
  error.code = code;
  return error;
}

function repo(env) {
  return String(env.GITHUB_REPO || "");
}

function encodePath(value) {
  return String(value).split("/").map(encodeURIComponent).join("/");
}

export function encodeBase64(text) {
  const bytes = new TextEncoder().encode(text);
  return bytesToBase64(bytes);
}

// 图片这类二进制内容用这个
export function bytesToBase64(bytes) {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

function decodeBase64(value) {
  const binary = atob(String(value).replace(/\s/g, ""));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder().decode(bytes);
}