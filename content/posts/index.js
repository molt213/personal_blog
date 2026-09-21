// 文章资料放在 posts.json，正文放在 public/posts/<slug>.html。
// 用 /admin 在线后台写文章时，这两个文件会自动更新，不需要手改这个文件。
import posts from "./posts.json";

export const POSTS = posts;