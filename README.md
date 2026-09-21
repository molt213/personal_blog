# 我的小站

这是一个部署在 Cloudflare Workers 上的个人博客。GitHub 的 `main` 分支更新后，Cloudflare 会自动重新部署；留言保存在 D1 数据库，浏览量保存在 KV，文章可以在线编辑。

## 写文章：直接用在线后台

```text
https://molt213.top/admin
```

在浏览器里写正文、点发布，后台会通过 GitHub API 把内容提交到仓库，约一分钟后线上更新。图片可以直接拖进编辑区或截图后粘贴上传，会存进 `public/images/`。**内容仍然 100% 存在 GitHub 里**，也可以照旧手动改文件。

第一次使用需要先做一次性配置（申请 GitHub Token、填进 Cloudflare、配好访问门禁），完整步骤见 [`后台使用说明.md`](后台使用说明.md)。

## 日常编辑：只看这两个目录

```text
content/        页面文案、文章资料和站点信息
public/         网站的外观、浏览器交互和文章正文
```

最常用的位置：

| 想做什么 | 修改的位置 |
| --- | --- |
| 在线写文章 | `/admin` 后台 |
| 改网站名称、邮箱、简介 | `content/site.js` |
| 改首页、关于页、留言页的文字 | `content/pages/` |
| 手动改文章资料（标题、日期、摘要） | `content/posts/posts.json` |
| 手动改文章正文 | `public/posts/<网址代号>.html` |
| 加友情链接 | `content/links.js` |
| 改颜色、字号、页面间距 | `public/style.css` |

更具体的写文章说明放在 [`content/README.md`](content/README.md) 和 [`content/文章写作速查表.md`](content/文章写作速查表.md)。

## 项目结构

```text
worker.js                 只负责把网址分发到页面或接口
content/
  site.js                 网站基础信息
  links.js                友情链接列表
  pages/                  首页、关于页、留言页、友链页的文案
  posts/posts.json        每篇文章的标题、日期、摘要等资料
public/
  posts/                  每篇文章的正文（静态文件，运行时读取）
  style.css               所有视觉样式
  admin.css / admin.js    写作后台的样式和浏览器交互
  site.js                 浏览量显示
  guestbook.js            留言板的浏览器交互
src/
  site/                   通用布局、文章列表和文章页模板、后台页面
  api/                    留言、浏览量、写作后台接口
  services/               GitHub 读写、正文读取、邮件通知等后台服务
wrangler.jsonc            Cloudflare 的 Worker、D1、KV 与静态资源配置
```

## 修改后如何上线

```text
修改文件 → 提交到 GitHub main 分支 → Cloudflare 自动部署 → 网站更新
```

小改动可以直接用 GitHub 网页编辑；用 `/admin` 后台写文章则不需要手动提交。

## Cloudflare 配置要点

- **留言表**：如果尚未创建，在绑定给 Worker 的 D1 数据库中执行：

  ```sql
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TEXT DEFAULT (datetime('now'))
  );
  ```

- **写作后台**：需要 Cloudflare Secret `GITHUB_TOKEN`（GitHub 细粒度令牌，只给这个仓库的 Contents 读写权限），并用 Cloudflare Access 保护 `/admin` 与 `/api/admin`。步骤见 [`后台使用说明.md`](后台使用说明.md)。
- **邮件通知**：`BREVO_API_KEY` 同样只作为 Cloudflare Secret 保存。

不要把 `GITHUB_TOKEN`、`BREVO_API_KEY` 或任何密钥写进代码、写进仓库、或粘贴给其他人；它们只应该存在于 Cloudflare 的 Secret 里（本机预览用 `.dev.vars`，该文件已被 `.gitignore` 忽略）。