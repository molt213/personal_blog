# 我的小站

这是一个部署在 Cloudflare Workers 上的个人博客。GitHub 的 `main` 分支更新后，Cloudflare 会自动重新部署；留言保存在 D1 数据库，浏览量保存在 KV。

## 日常编辑：只看这两个目录

```text
content/        页面文案、文章和站点信息
public/         网站的外观和浏览器交互
```

最常用的位置：

| 想做什么 | 修改的位置 |
| --- | --- |
| 改网站名称、邮箱、简介 | `content/site.js` |
| 改首页、关于页、留言页的文字 | `content/pages/` |
| 写新文章 | `content/posts/` |
| 改颜色、字号、页面间距 | `public/style.css` |

更具体的写文章说明放在 [`content/README.md`](content/README.md)。

## 项目结构

```text
worker.js                 只负责把网址分发到页面或接口
content/
  site.js                 网站基础信息
  pages/                  首页、关于页、留言页的文案
  posts/                  每篇文章的正文和文章资料
public/
  style.css               所有视觉样式
  site.js                 浏览量显示
  guestbook.js            留言板的浏览器交互
src/
  site/                   通用布局、文章列表和文章页模板
  api/                    留言与浏览量接口
  services/               邮件通知等后台服务
wrangler.jsonc            Cloudflare 的 Worker、D1、KV 与静态资源配置
```

## 修改后如何上线

```text
修改文件 → 提交到 GitHub main 分支 → Cloudflare 自动部署 → 网站更新
```

小改动可以直接用 GitHub 网页编辑；经常写文章时，建议用 VS Code 打开整个 `D:\claude\web` 文件夹。

## Cloudflare 数据库初始化

如果尚未创建留言表，在绑定给 Worker 的 D1 数据库中执行：

```sql
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

`wrangler.jsonc` 是 D1、KV 和静态资源的配置来源。不要把 `BREVO_API_KEY` 写进代码或仓库；它应继续作为 Cloudflare Secret 保存。
