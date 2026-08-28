# 内容编辑区

日常写内容时，优先只改这个目录：

- `文章写作速查表.md`：写文章时可直接复制的常用 HTML 模板。
- `site.js`：网站名称、简介、联系邮箱与开站日期。
- `pages/home.html`：首页文案。
- `pages/about.html`：关于页面文案。
- `pages/guestbook.html`：留言板页面上的说明文字。
- `posts/`：每篇文章的正文，以及文章列表资料。

## 发布一篇文章

1. 在 `posts/` 中复制 `hello-world.html`，改名为英文短横线形式，例如 `first-autumn.html`。
2. 写正文。段落使用 `<p>文字</p>`，小标题使用 `<h2>小标题</h2>`，引用使用 `<blockquote>引用文字</blockquote>`。
3. 打开 `posts/index.js`，先加一行 `import firstAutumn from "./first-autumn.html";`。
4. 照着已有文章的格式新增一项；其中 `slug` 要和文件名一致（不带 `.html`），最后的 `content` 填 `firstAutumn`。
5. 提交到 GitHub。Cloudflare 会自动部署。

不要修改 `src/` 或 `worker.js`，除非要改变网站功能或网址规则。
