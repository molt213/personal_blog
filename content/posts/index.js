import helloWorld from "./hello-world.html";

// 新文章按这个格式加到最前面，文章列表与网址会自动生成。
export const POSTS = [
  {
    slug: "hello-world",
    category: "随笔",
    date: "2026.08.26",
    title: "第一篇：小站开张",
    excerpt: "从今天开始，把一些没有标准答案的念头，和一些不想被轻易忘记的日常，好好存放在这里。",
    lead: "从今天开始，这里会慢慢存下我不想忘记的片段。",
    artLabel: "HELLO\nWORLD",
    content: helloWorld
  }
];
