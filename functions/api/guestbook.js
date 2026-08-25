// 这个文件就是网站的"动态部分"。
// 每个请求进来时 Cloudflare 在边缘运行它,跑完即走,不需要常驻服务器。
// 数据库通过 context.env.DB 访问(部署时在后台绑定,见 README.md)。

export async function onRequestGet(context) {
  const { results } = await context.env.DB
    .prepare("SELECT name, text, created_at FROM messages ORDER BY id DESC LIMIT 20")
    .all();
  return Response.json(results);
}

export async function onRequestPost(context) {
  const form = await context.request.formData();
  const name = (form.get("name") || "匿名").slice(0, 20);
  const text = (form.get("text") || "").trim().slice(0, 500);
  if (!text) return Response.json({ error: "留言不能为空" }, { status: 400 });

  await context.env.DB
    .prepare("INSERT INTO messages (name, text) VALUES (?, ?)")
    .bind(name, text)
    .run();
  return Response.json({ ok: true });
}