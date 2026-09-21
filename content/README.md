# 内容编辑区

日常写内容时，优先只改这个目录：

- `文章写作速查表.md`：写文章时可直接复制的常用 HTML 模板。
- `site.js`：网站名称、简介、联系邮箱与开站日期。
- `links.js`：友情链接列表，加友链改这里。
- `pages/home.html`：首页文案。
- `pages/about.html`：关于页面文案。
- `pages/guestbook.html`：留言板页面上的说明文字。
- `posts/posts.json`：每篇文章的标题、日期、摘要、导语等资料。
- 文章正文放在 `public/posts/<网址代号>.html`。

## 推荐：用在线后台写

打开 <https://molt213.top/admin>，点“新建文章”，填好标题、摘要、正文，点发布即可。后台会自动帮你改上面那两个文件并提交到 GitHub。

配置方法见项目根目录的 [`后台使用说明.md`](../后台使用说明.md)。

## 手动发布一篇文章

1. 在 `public/posts/` 里新建一个英文短横线命名的文件，例如 `first-autumn.html`。
2. 写正文。段落使用 `<p>文字</p>`，小标题使用 `<h2>小标题</h2>`，引用使用 `<blockquote>引用文字</blockquote>`。正文文件只写这些片段，不需要 `<!DOCTYPE html>`、`<html>`、`<head>` 或 `<body>`。
3. 打开 `content/posts/posts.json`，在**最前面**加一项：

   ```json
   {
     "slug": "first-autumn",
     "category": "随记",
     "date": "2026.09.21",
     "title": "文章标题",
     "excerpt": "列表里显示的一句话",
     "lead": "文章页标题下面那句",
     "artLabel": "首行\n次行"
   }
   ```

   - `slug` 必须和正文文件名一致（不带 `.html`），只能用英文小写、数字和短横线。
   - `artLabel` 是没有封面时显示的大字，`\n` 表示换行。
   - 想指定封面就在这项里加 `"cover": "图片地址"`。
4. 提交到 GitHub。Cloudflare 会自动部署。

> 文章列表的封面默认取正文里的第一张图片；在 `posts.json` 里写了 `cover` 就用 `cover`。

不要修改 `src/` 或 `worker.js`，除非要改变网站功能或网址规则。