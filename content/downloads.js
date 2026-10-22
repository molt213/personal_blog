// 资料下载列表。后台的「上传资料」按钮会自动写 downloads.json；
// 手动加文件时，把文件放进 public/downloads/，再在 downloads.json 里加一条。
import downloads from "./downloads.json";
export const DOWNLOADS = downloads;
