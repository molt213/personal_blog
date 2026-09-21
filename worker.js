import { SITE } from "./content/site.js";
import homeContent from "./content/pages/home.html";
import guestbookContent from "./content/pages/guestbook.html";
import aboutContent from "./content/pages/about.html";
import linksContent from "./content/pages/links.html";
import { POSTS } from "./content/posts/index.js";
import { LINKS } from "./content/links.js";
import { renderPage } from "./src/site/layout.js";
import { renderPostsPage } from "./src/site/posts-page.js";
import { renderArticlePage } from "./src/site/article-page.js";
import { renderLinksPage } from "./src/site/links-page.js";
import { renderAdminPage } from "./src/site/admin-page.js";
import { renderRobotsTxt, renderSitemap } from "./src/site/search-index.js";
import { getGuestbookMessages, createGuestbookMessage } from "./src/api/guestbook.js";
import { recordVisit } from "./src/api/views.js";
import { readPostBody, withCovers } from "./src/services/post-content.js";
import { isOwner, listPosts, getPost, publishPost, deletePost, readDraft, saveDraft } from "./src/api/admin.js";

const PAGES = {
  "/": { title: "首页", active: "home", content: homeContent },
  "/guestbook": { title: "留言板", active: "guestbook", content: guestbookContent, guestbook: true },
  "/about": { title: "关于", active: "about", content: aboutContent }
};

export default {
  async fetch(request, env) {
    const { pathname: path } = new URL(request.url);

    if (path === "/robots.txt") return text(renderRobotsTxt(SITE.url));
    if (path === "/sitemap.xml") return xml(renderSitemap(SITE.url, POSTS));

    if (path === "/posts") {
      const posts = await withCovers(env, request, POSTS);
      return html(renderPage({
        title: "随记",
        active: "posts",
        content: renderPostsPage(posts),
        site: SITE,
        canonicalUrl: `${SITE.url}${path}`
      }));
    }

    const post = POSTS.find(item => path === `/posts/${item.slug}.html`);
    if (post) {
      const content = await readPostBody(env, request, post.slug);
      if (content === null) return new Response("Not Found", { status: 404 });
      return html(renderPage({
        title: post.title,
        active: "posts",
        content: renderArticlePage({ ...post, content }),
        site: SITE,
        canonicalUrl: `${SITE.url}${path}`
      }));
    }

    if (path === "/admin") {
      if (!isOwner(request, env)) return forbidden();
      return html(renderPage({
        title: "写作后台",
        active: "",
        content: renderAdminPage(),
        site: SITE,
        styles: ["/admin.css"],
        scripts: ["/admin.js"],
        noindex: true
      }));
    }

    if (path === "/api/admin" || path.startsWith("/api/admin/")) {
      if (!isOwner(request, env)) {
        return Response.json({ error: "没有访问后台的权限" }, { status: 403 });
      }
      return adminApi(request, env, path);
    }

    if (path === "/links") {
      return html(renderPage({
        title: "友情链接",
        active: "links",
        content: linksContent + renderLinksPage(LINKS, SITE),
        site: SITE,
        canonicalUrl: `${SITE.url}${path}`
      }));
    }

    const page = PAGES[path];
    if (page) return html(renderPage({ ...page, site: SITE, canonicalUrl: `${SITE.url}${path}` }));

    if (path === "/api/guestbook") {
      if (request.method === "GET") return Response.json(await getGuestbookMessages(env));
      if (request.method === "POST") {
        const result = await createGuestbookMessage(request, env, SITE.contactEmail);
        return Response.json(result.body, { status: result.status });
      }
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
    }

    if (path === "/api/views") {
      if (request.method !== "GET" && request.method !== "POST") {
        return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
      }
      return Response.json(await recordVisit(env, SITE.launchDate, request.method === "POST"));
    }
    return new Response("Not Found", { status: 404 });
  }
};

// 写作后台接口。只有通过 isOwner 校验的请求才会走到这里。
async function adminApi(request, env, path) {
  const method = request.method;
  const { searchParams } = new URL(request.url);

  if (method === "GET" && path === "/api/admin/posts") return adminJson(await listPosts(env));
  if (method === "GET" && path === "/api/admin/post") return adminJson(await getPost(env, searchParams.get("slug")));
  if (method === "GET" && path === "/api/admin/draft") return adminJson(await readDraft(env, searchParams.get("slug")));

  if (method === "POST" && (path === "/api/admin/publish" || path === "/api/admin/delete" || path === "/api/admin/draft")) {
    const payload = await readJson(request);
    if (!payload) return adminJson({ status: 400, body: { error: "请求内容不是合法的 JSON" } });

    if (path === "/api/admin/publish") return adminJson(await publishPost(env, payload));
    if (path === "/api/admin/delete") return adminJson(await deletePost(env, payload.slug));
    return adminJson(await saveDraft(env, payload));
  }

  return new Response("Not Found", { status: 404 });
}

async function readJson(request) {
  try {
    return await request.json();
  } catch (error) {
    return null;
  }
}

function adminJson(result) {
  return Response.json(result.body, { status: result.status });
}

// 没有通过身份校验时的提示页。线上只有站长本人在 Cloudflare Access 登录后能打开后台。
function forbidden() {
  return new Response(`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><title>没有访问权限</title></head>
<body style="margin:0;padding:48px;background:#f5f6fa;color:#162036;font:16px/1.65 system-ui,'PingFang SC','Microsoft YaHei',sans-serif">
<h1 style="font-size:22px">403 · 没有访问权限</h1>
<p style="color:#60708b">写作后台只有站长登录后可以打开。</p>
</body>
</html>`, { status: 403, headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function html(content) {
  return new Response(content, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}

function text(content) {
  return new Response(content, { headers: { "Content-Type": "text/plain; charset=utf-8" } });
}

function xml(content) {
  return new Response(content, { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}