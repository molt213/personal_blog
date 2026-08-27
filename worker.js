import { SITE } from "./content/site.js";
import homeContent from "./content/pages/home.html";
import guestbookContent from "./content/pages/guestbook.html";
import aboutContent from "./content/pages/about.html";
import { POSTS } from "./content/posts/index.js";
import { renderPage } from "./src/site/layout.js";
import { renderPostsPage } from "./src/site/posts-page.js";
import { renderArticlePage } from "./src/site/article-page.js";
import { getGuestbookMessages, createGuestbookMessage } from "./src/api/guestbook.js";
import { recordVisit } from "./src/api/views.js";

const PAGES = {
  "/": { title: "首页", active: "home", content: homeContent },
  "/guestbook": { title: "留言板", active: "guestbook", content: guestbookContent, guestbook: true },
  "/about": { title: "关于", active: "about", content: aboutContent }
};

export default {
  async fetch(request, env) {
    const path = new URL(request.url).pathname;

    if (path === "/posts") {
      return html(renderPage({
        title: "文章",
        active: "posts",
        content: renderPostsPage(POSTS),
        site: SITE
      }));
    }

    const post = POSTS.find(item => path === `/posts/${item.slug}.html`);
    if (post) {
      return html(renderPage({
        title: post.title,
        active: "posts",
        content: renderArticlePage(post),
        site: SITE
      }));
    }

    const page = PAGES[path];
    if (page) return html(renderPage({ ...page, site: SITE }));

    if (path === "/api/guestbook") {
      if (request.method === "GET") return Response.json(await getGuestbookMessages(env));
      if (request.method === "POST") {
        const result = await createGuestbookMessage(request, env, SITE.contactEmail);
        return Response.json(result.body, { status: result.status });
      }
      return new Response("Method Not Allowed", { status: 405, headers: { Allow: "GET, POST" } });
    }

    if (path === "/api/views") return Response.json(await recordVisit(env, SITE.launchDate));
    return new Response("Not Found", { status: 404 });
  }
};

function html(content) {
  return new Response(content, { headers: { "Content-Type": "text/html; charset=utf-8" } });
}
