# 内容编辑区

日常写内容时，优先只改这个目录：

- `文章写作速查表.md`：写文章时可直接复制的常用 HTML 模板。
- `site.js`：网站名称、简介、联系邮箱与开站日期。
- `music.js`：侧栏播放器的网易云歌单配置。
- `links.js`：友情链接列表，加友链改这里。
- `downloads.js`：资料下载列表，加下载文件改这里。
- `pages/home.html`：首页文案。里面的 `{{...}}` 是程序填文章和数据的位置，不要删。
- `pages/about.html`：关于页面文案。
- `pages/guestbook.html`：留言板页面上的说明文字。
- `pages/downloads.html`：下载页顶部的标题和介绍文字。
- `posts/posts.json`：每篇文章的标题、日期、摘要、导语等资料。
- 文章正文放在 `public/posts/<网址代号>.html`。

## 推荐：用在线后台写

打开 <https://molt213.top/admin>，点“新建文章”，填好标题、摘要、正文，点发布即可。后台会自动帮你改上面那两个文件并提交到 GitHub。

图片可以直接**拖进编辑区**、**截图后 Ctrl+V 粘贴**，或点工具栏的「上传图片」多选；后台会把图片存进 `public/images/`，并在光标处插入带说明的图片模板（`<figure class="article-image">` + `<figcaption>`）。单张 5 MB 以内，支持 png / jpg / webp / gif。

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

   - `slug` 必须和正文文件名一致（不带 `.html`），只能用英文、数字、下划线和短横线。
   - `artLabel` 是没有封面时显示的大字，`\n` 表示换行。
   - 想指定封面就在这项里加 `"cover": "图片地址"`。
4. 提交到 GitHub。Cloudflare 会自动部署。

> 文章列表的封面默认取正文里的第一张图片；在 `posts.json` 里写了 `cover` 就用 `cover`。
>
> 文章页右侧的目录会根据正文里的 `<h2>` 自动生成，不需要手写锚点；首页的最新文章、文章数、阅读量和留言数也会自动读取，不用手动改。

## 加一个下载资料

**推荐：用后台的资料管理页。** 打开 <https://molt213.top/admin/downloads>，选文件、填标题、勾选确认，点「上传资料」即可。后台会自动把文件写进 `public/downloads/`，并把条目加到 `content/downloads.json`，大约一分钟后线上更新。单个文件上限 20 MB。

**手动加：**

1. 把文件放进 `public/downloads/`，文件名用英文、数字和短横线，例如 `ecut-803-geology-exams-2021-2026.zip`。也可以直接在 GitHub 网页上进入这个目录，用「Add file → Upload files」上传。
2. 打开 `content/downloads.json`，在数组最前面加一项：

   ```json
   {
     "title": "显示在页面上的标题",
     "file": "/downloads/文件名.zip",
     "format": "ZIP",
     "size": "1.1 MB",
     "count": "6 份 PDF",
     "date": "2026-10-22",
     "description": "一句话说明里面是什么。",
     "sha256": "可选的校验值"
   }
   ```

3. 提交后 Cloudflare 会自动部署，下载页是 `/downloads`。

> Cloudflare 单个静态文件最大 **25 MiB**，超过就放不上去。Git 会保留文件的每个版本，所以大文件不要反复替换，不然仓库会越来越大。
>
> 只放你有权分享的资料。教材扫描件、付费课程这类受版权保护的内容不要公开上传。

## 换侧栏播放器的歌单

打开 `content/music.js`，把单曲改成你的网易云歌单：

```js
export const MUSIC = {
  server: "netease",
  type: "playlist",
  id: "你的歌单ID",
  volume: 0.6
};
```

歌单 ID 在网页版歌单地址 `https://music.163.com/#/playlist?id=123456789` 里。现在的占位是一首单曲（`type: "song"`）；只放一首歌也可以保持 `song`，把 `id` 换成歌曲 ID 即可。

> 播放器用 MetingJS 读取网易云，第三方接口偶尔会不可用；遇到灰色/不可用歌曲，播放器会提示并尝试下一首。后台写文章、发布、图片和资料上传不受影响；后台页面不加载播放器，也不参与公开页的软导航。

不要修改 `src/` 或 `worker.js`，除非要改变网站功能或网址规则。