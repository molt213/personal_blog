# 动态个人网站 · 部署说明书(全免费)

这个迷你网站 = 静态页面 + 访客留言板(动态),跑在 Cloudflare 免费套餐上:
Cloudflare Pages(托管)+ Functions(边缘函数)+ D1(数据库),一分钱不花。

需要提前准备的:一个邮箱、一个 GitHub 账号(免费注册)、一个浏览器。**不需要信用卡。**

---

## 第 1 步:把代码放进 GitHub(5 分钟)

1. 打开 https://github.com/new ,仓库名随意(比如 `my-site`),选 **Public**,点击 **Create repository**。
2. 新页面里点 **uploading an existing file** → 把本文件夹里的 `index.html` 和 `functions` 文件夹拖进去 → 点 **Commit changes**。
   (网页里拖拽上传时,把 `functions/api/guestbook.js` 一起拖上,保持目录结构不变。)

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

## 第 5 步:验收(2 分钟)

打开你的 `https://my-site.pages.dev`,发一条留言,刷新页面——留言还在,就说明整条链路通了:
**浏览器 → 边缘函数 → D1 数据库 → 回显**,全程零服务器。

---

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