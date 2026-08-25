// 网站入口:处理动态接口 + 返回静态页面
// 数据库绑定通过 env.DB 访问(声明在 wrangler.jsonc 里)
export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    if (url.pathname === "/api/guestbook") {
      if (request.method === "GET") {
        const { results } = await env.DB
          .prepare("SELECT name, text, created_at FROM messages ORDER BY id DESC LIMIT 20")
          .all();
        return Response.json(results);
      }
      if (request.method === "POST") {
        const form = await request.formData();
        const rawName = (form.get("name") || "").trim();
        // 兼容历史 bug:客户端可能把空名字传成字符串 "undefined"
        const name = (rawName && rawName !== "undefined") ? rawName.slice(0, 20) : "匿名";
        const text = (form.get("text") || "").trim().slice(0, 500);
        if (!text) return Response.json({ error: "留言不能为空" }, { status: 400 });
        await env.DB
          .prepare("INSERT INTO messages (name, text) VALUES (?, ?)")
          .bind(name, text)
          .run();
        return Response.json({ ok: true });
      }
    }

    // 其他请求(HTML 页面等静态文件)交给 ASSETS 处理
    return env.ASSETS.fetch(request);
  }
}