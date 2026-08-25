# 动态个人网站 · 部署说明书(全免费)

这个迷你网站 = 静态页面 + 访客留言板(动态),跑在 Cloudflare 免费套餐上:
Cloudflare Pages(托管)+ Functions(边缘函数)+ D1(数据库),一分钱不花。

需要提前准备的:一个邮箱、一个 GitHub 账号(免费注册)、一个浏览器。**不需要信用卡。**

---

## 第 1 步:把代码放进 GitHub(5 分钟)

> 本仓库已经完成这一步(是直接 `git push` 上去的),**跳过**,从这里开始直接看第 2 步。

新项目的话:在 https://github.com/new 建仓库(选 Public),然后任选一种方式把 `index.html` 和 `functions` 文件夹放进去:

## 第 2 步:部署到 Cloudflare Pages(5 分钟)

1. 打开 https://dash.cloudflare.com/sign-up 用邮箱注册(免费套餐,不用绑卡)。
2. 登录后,左侧找 **Workers & Pages** → 点 **Create application** → 选 **Pages** 标签 → 点 **Connect to Git**。
3. 点 **Connect GitHub**,按提示授权——授权时**只勾选 `my-site` 这一个仓库**,别给全部仓库权限。
4. 选中仓库,框架预设选 **None**,构建命令留空,直接点 **Save and Deploy**。
5. 等一两分钟,出现绿色 **Success** 后,点 **Visit site**,得到你的免费网址:
   `https://my-site.pages.dev`
6. 打开它,留言板现在能显示"加载中…"再变成"还没有留言"——**函数已经生效了**,还差数据库。

## 第 3 步:开通免费数据库 D1(5 分钟)

1. Cloudflare 控制台侧边栏搜 **D1** → **Create database**,名字填 `my-db`,地区选 **APAC**,创建。
2. 进入刚建的数据库 → 点 **Console** 标签(网页版数据库操作台)→ 把下面这段 SQL 整个粘贴进去 → 点 **Run**:

```sql
CREATE TABLE IF NOT EXISTS messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  text TEXT NOT NULL,
  created_at TEXT DEFAULT (datetime('now'))
);
```

看到 "Success" 就说明表建好了。

## 第 4 步:把数据库"绑定"到网站(3 分钟)

1. 回到 **Workers & Pages** → 点进你的 `my-site` 项目 → **Settings** → 左侧选 **Bindings**。
2. 点 **Add binding** → 类型选 **D1 database** → 变量名**必须填 `DB`**(代码里就叫这个名字)→ 选择数据库 `my-db` → **Save**。
3. 绑定后需要重新部署一次才生效:进 **Deployments** → 点当前版本右边的 **⋯** → **Retry deployment**。

> ⚠️ **如果你是通过 Workers 的"连接到 Git"方式部署的**(网址以 `.workers.dev` 结尾,界面上看到的是"重试构建"):
> 后台加绑定**不会生效**,因为每次构建都是从代码仓库打包的。这时绑定必须写在仓库根目录的 `wrangler.jsonc` 里——
> 本项目**已经配好了**(包含你的 D1 数据库 ID),改动后 `git push` 就会自动带着绑定重新构建,后台的"无连接"状态会变成"已连接"。

## 第 5 步:验收(2 分钟)

打开你的 `https://my-site.pages.dev`,发一条留言,刷新页面——留言还在,就说明整条链路通了:
**浏览器 → 边缘函数 → D1 数据库 → 回显**,全程零服务器。

---

## 写文章:怎么发布一篇博客

现在的结构:`index.html`(首页,含文章列表和留言板)、`style.css`(全站样式)、`posts/`(文章文件)。

1. 复制 `posts/hello-world.html` 改名为 `posts/你的文章.html`(文件名用英文短横线);
2. 改 `<h1>` 标题、`<time>` 日期、正文(支持标题/列表/引用/代码/图片,样式已备好);
3. 在 `index.html` 文章列表里加一行 `<li><a href="posts/你的文章.html">标题</a><time>日期</time></li>`;
4. `git push`,自动发布。设计上走"极简文稿"路线(白纸黑字单栏),不花哨,重点是读得舒服。

## 日常更新:改内容要重传吗?不用

只要第 2 步连过一次 GitHub,之后改内容**永远不需要重新上传文件**。
有三种改法,任选其一,改完 Cloudflare 自动重新部署(约 1~2 分钟后线上生效):

1. **最省事(零工具)**:GitHub 网页上直接改。打开仓库里的文件 → 点右上角 ✏️ 铅笔图标 → 改内容 → 点 **Commit changes**。适合改文字、加一段话。
2. **正经做法(装个 Git)**:本地改好 → `git add .` → `git commit -m "更新"` → `git push`,自动部署。
3. **加新页面**:GitHub 网页点 **Add file** 新建 `xxx.html`,或在本地建好后 push 上去,新文件自动上线。

两个不用担心的事:

- **留言数据不会丢**:重新部署只替换"代码",你的留言板数据存在 D1 数据库里,和代码是分开的,重启一百次都在。
- **50 次拖拽?不存在**:连接 GitHub 之后,"上传"这个过程彻底消失了,你只跟文字打交道。

## 之后想升级什么,照着做

| 想要 | 做法 |
|---|---|
| 自己的域名 | 买个 `.com`(约 10 美元/年)→ 控制台 **Add a site** → 改 Nameserver → Pages 里绑定域名 |
| 收信邮箱 | 域名下 **Email Routing**,`hello@你的域名` 转发到你的私人邮箱 |
| 防垃圾留言 | Cloudflare **Turnstile**(免费无感验证码),把 Site Key 加进表单再校验 |
| 更多页面/文章 | 直接改 `index.html` 或换成 Hugo/Astro,git push 自动重新部署 |
| 评论/计数/搜索 | 往 `functions/` 目录里加文件,就是新接口,D1/KV 都免费 |

## 常见问题

- **留言发送失败/500**:大概率是第 4 步绑定忘了做,或变量名不是 `DB`。
- **拖拽上传时目录乱了**:保证最终结构是 `functions/api/guestbook.js`,路径不对接口就 404。
- **想本地调试**:装 Node.js 后执行 `npm i -g wrangler`,在项目目录跑 `wrangler pages dev`,但需要先 `wrangler login`——纯小白可以先跳过,直接线上测。