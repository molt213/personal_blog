// 站点侧栏播放器。
// 换歌单：type 用 "playlist"，id 填歌单 ID（网页版地址 https://music.163.com/#/playlist?id=123456789 里的数字）。
// api 是 Meting 取数接口。默认实例 api.i-meto.com 的取音源接口已失效（2026-10-24 实测返回 404），
// 所以这里指向 api.injahow.cn；换接口时保持 :server / :type / :id 三个占位符不变。
export const MUSIC = {
  server: "netease",
  type: "playlist",
  id: "18518900889",
  volume: 0.6,
  api: "https://api.injahow.cn/meting/?server=:server&type=:type&id=:id"
};
