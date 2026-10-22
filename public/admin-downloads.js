(() => {
  const $ = id => document.getElementById(id);

  const fileEl = $("dl-file");
  const pickEl = $("dl-pick");
  const nameEl = $("dl-file-name");
  const titleEl = $("dl-title");
  const descEl = $("dl-desc");
  const confirmEl = $("dl-confirm");
  const uploadEl = $("dl-upload");
  const hintEl = $("dl-hint");
  const listEl = $("admin-dl-list");
  const countEl = $("admin-dl-count");
  if (!fileEl || !uploadEl) return;

  const MAX_DOWNLOAD_BYTES = 20 * 1024 * 1024;

  pickEl.addEventListener("click", () => fileEl.click());

  fileEl.addEventListener("change", () => {
    const file = fileEl.files && fileEl.files[0];
    nameEl.textContent = file ? `${file.name}（${formatFileSize(file.size)}）` : "还没有选择文件";
    if (file && !titleEl.value.trim()) titleEl.value = file.name.replace(/\.[^.]+$/, "");
  });

  uploadEl.addEventListener("click", upload);

  async function upload() {
    const file = fileEl.files && fileEl.files[0];
    if (!file) return setHint("先选一个文件。", "error");
    if (file.size > MAX_DOWNLOAD_BYTES) {
      return setHint(`文件 ${formatFileSize(file.size)}，超过 20 MB 上限。`, "error");
    }
    if (!confirmEl.checked) {
      return setHint("请先勾选“我确认这个文件可以公开分享”。", "error");
    }

    const body = new FormData();
    body.append("file", file);
    body.append("title", titleEl.value.trim());
    body.append("description", descEl.value.trim());
    body.append("date", todayIso());
    body.append("confirm", "1");

    uploadEl.disabled = true;
    setHint(`正在上传 ${file.name}…大文件可能要几十秒。`);

    try {
      const data = await api("/api/admin/upload-download", body);
      setHint(`已上传「${data.title}」。约 1 分钟后刷新下载页就能看到。`, "success");
      prependItem(data);
      fileEl.value = "";
      nameEl.textContent = "还没有选择文件";
      titleEl.value = "";
      descEl.value = "";
      confirmEl.checked = false;
    } catch (error) {
      setHint(error.message, "error");
    } finally {
      uploadEl.disabled = false;
    }
  }

  function prependItem(data) {
    if (!listEl) return;
    const empty = listEl.querySelector(".loading");
    if (empty) empty.remove();

    const item = document.createElement("a");
    item.className = "admin-dl-item";
    item.href = data.url;
    item.setAttribute("download", "");

    const format = document.createElement("span");
    format.className = "admin-dl-format";
    format.setAttribute("aria-hidden", "true");
    format.textContent = data.format || "FILE";

    const main = document.createElement("span");
    main.className = "admin-dl-main";
    const title = document.createElement("b");
    title.textContent = data.title;
    const meta = document.createElement("small");
    meta.textContent = [data.size, data.date].filter(Boolean).join(" · ");
    main.append(title, meta);

    const open = document.createElement("span");
    open.className = "admin-dl-open";
    open.textContent = "下载 ↓";

    item.append(format, main, open);
    listEl.prepend(item);

    if (countEl) {
      const current = Number((countEl.textContent.match(/\d+/) || [0])[0]) || 0;
      countEl.textContent = `${current + 1} 个文件`;
    }
  }

  function setHint(message, kind = "") {
    hintEl.textContent = message;
    hintEl.className = kind;
  }

  function formatFileSize(bytes) {
    if (bytes >= 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    if (bytes >= 1024) return `${Math.round(bytes / 1024)} KB`;
    return `${bytes} B`;
  }

  function todayIso() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  }

  async function api(path, body) {
    const response = await fetch(path, { method: "POST", body });
    let data = null;
    try {
      data = await response.json();
    } catch (error) {
      data = null;
    }
    if (!response.ok || !data || data.error) {
      throw new Error((data && data.error) || `请求失败（HTTP ${response.status}）`);
    }
    return data;
  }
})();
