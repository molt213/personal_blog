(() => {
  const $ = id => document.getElementById(id);

  const form = {
    title: $("f-title"),
    slug: $("f-slug"),
    date: $("f-date"),
    category: $("f-category"),
    excerpt: $("f-excerpt"),
    lead: $("f-lead"),
    artLabel: $("f-artLabel"),
    cover: $("f-cover"),
    content: $("f-content")
  };
  if (!form.content) return;

  const listEl = $("admin-list");
  const hintEl = $("admin-hint");
  const warnEl = $("admin-warn");
  const frame = $("admin-preview-frame");
  const noteEl = $("admin-preview-note");
  const countEl = $("admin-count");
  const fileEl = $("admin-file");
  const fieldsEl = document.querySelector(".admin-fields");
  const draftWrap = $("admin-drafts");
  const draftListEl = $("admin-draft-list");
  const draftCountEl = $("admin-draft-count");
  const postCountEl = $("admin-post-count");
  const btnNew = $("admin-new");
  const btnRestore = $("admin-restore");
  const btnDraft = $("admin-draft");
  const btnPreview = $("admin-preview");
  const btnDelete = $("admin-delete");
  const btnPublish = $("admin-publish");

  const SLUG_PATTERN = /^[A-Za-z0-9][A-Za-z0-9_-]{0,60}$/;
  const MAX_CONTENT = 200000;
  const MAX_IMAGES = 10;

  // 图片统一用带说明的图注模板：上传、拖放、粘贴、外链都插入同一套 <figure class="article-image"> 结构，
  // 图片下方的说明文字对应 style.css 里的 .article .article-image figcaption
  const imageFigure = src => `<figure class="article-image">\n  <img src="${src}" alt="说明">\n  <figcaption>图片说明。</figcaption>\n</figure>\n`;

  // 工具栏。wrap 表示"选中文字时用它包裹"，template 表示"没选中时插入的模板"。
  const SNIPPETS = [
    { label: "上传图片", action: "upload", hint: "选图片上传，也可以直接拖进来或粘贴" },
    { label: "外链图片", template: imageFigure("https://example.com/image.jpg") },
    { label: "大标题", template: "<h2>一、标题</h2>\n", wrap: ["<h2>", "</h2>"] },
    { label: "小标题", template: "<h3>① 小标题</h3>\n", wrap: ["<h3>", "</h3>"] },
    { label: "段落", template: "<p>正文</p>\n", wrap: ["<p>", "</p>"] },
    { label: "灰字注释", template: '<small class="note">说明</small>\n', wrap: ['<small class="note">', "</small>"] },
    { label: "引用框", template: '<blockquote>\n  引用内容。<br>\n  <small class="note">来源或翻译。</small>\n</blockquote>\n', wrap: ["<blockquote>\n  ", "\n</blockquote>\n"] },
    { label: "链接", template: '<a class="text-link" href="https://example.com/">链接文字</a>', wrap: ['<a class="text-link" href="https://example.com/">', "</a>"] },
    { label: "视频", template: '<figure class="video-embed">\n  <iframe src="https://www.youtube.com/embed/视频ID" title="视频标题" loading="lazy" allowfullscreen></iframe>\n  <figcaption>视频来源。</figcaption>\n</figure>\n' },
    { label: "音乐", template: '<figure class="music-embed">\n  <iframe src="https://music.163.com/outchain/player?type=2&id=歌曲ID&auto=0&height=66" title="歌曲名" loading="lazy"></iframe>\n  <figcaption>音乐：歌曲名。来源：网易云音乐。</figcaption>\n</figure>\n' },
    { label: "剧透块", template: '<button class="spoiler" type="button">隐藏内容</button>', wrap: ['<button class="spoiler" type="button">', "</button>"] }
  ];

  let currentSlug = "";
  let dirty = false;
  let previewTimer = 0;
  let pendingCaret = null;
  let publishedSlugs = [];
  let draftsCache = [];
  let activeDraftSlug = "";

  buildToolbar();
  bindFields();
  bindUpload();
  bindShortcuts();

  btnNew.addEventListener("click", newPost);
  btnRestore.addEventListener("click", restoreDraft);
  btnDraft.addEventListener("click", () => saveDraft(false));
  btnPreview.addEventListener("click", renderPreview);
  btnDelete.addEventListener("click", removePost);
  btnPublish.addEventListener("click", publish);

  window.addEventListener("beforeunload", event => {
    if (!dirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
  window.setInterval(() => {
    if (dirty) saveDraft(true);
  }, 45000);

  loadList();
  updateCount();

  function buildToolbar() {
    const bar = $("admin-toolbar");
    if (!bar) return;
    bar.innerHTML = SNIPPETS.map((snippet, index) =>
      `<button type="button" data-index="${index}" title="${escapeHtml(snippet.hint || (snippet.wrap ? "选中文字后点击可直接包裹" : "插入到光标处"))}">${escapeHtml(snippet.label)}</button>`
    ).join("");
    bar.addEventListener("click", event => {
      const button = event.target.closest("button[data-index]");
      if (!button) return;
      const snippet = SNIPPETS[Number(button.dataset.index)];
      if (snippet.action === "upload") {
        if (fileEl) fileEl.click();
        return;
      }
      applySnippet(snippet);
    });
  }

  function bindFields() {
    Object.values(form).forEach(field => {
      field.addEventListener("input", () => {
        markDirty();
        schedulePreview();
        updateCount();
      });
    });
  }

  function bindUpload() {
    if (fileEl) {
      fileEl.addEventListener("change", () => {
        uploadFiles(fileEl.files);
        fileEl.value = "";
      });
    }

    // 粘贴图片直接上传（截图工具复制后 Ctrl+V 就能用）
    form.content.addEventListener("paste", event => {
      const files = pastedFiles(event.clipboardData);
      if (!files.length) return;
      event.preventDefault();
      uploadFiles(files);
    });

    if (!fieldsEl) return;
    fieldsEl.addEventListener("dragover", event => {
      if (!hasFiles(event.dataTransfer)) return;
      event.preventDefault();
      fieldsEl.classList.add("is-dropping");
    });
    fieldsEl.addEventListener("dragleave", event => {
      if (event.target === fieldsEl) fieldsEl.classList.remove("is-dropping");
    });
    fieldsEl.addEventListener("drop", event => {
      fieldsEl.classList.remove("is-dropping");
      const files = event.dataTransfer ? event.dataTransfer.files : null;
      if (!files || !files.length) return;
      event.preventDefault();
      uploadFiles(files);
    });

    // 拖到页面别处时，别让浏览器直接打开图片
    document.addEventListener("dragover", event => {
      if (hasFiles(event.dataTransfer)) event.preventDefault();
    });
    document.addEventListener("drop", event => {
      if (event.dataTransfer && event.dataTransfer.files.length) event.preventDefault();
    });
  }

  function bindShortcuts() {
    document.addEventListener("keydown", event => {
      if (!event.ctrlKey && !event.metaKey) return;
      const key = String(event.key).toLowerCase();
      if (key === "s") {
        event.preventDefault();
        saveDraft(false);
        return;
      }
      if (event.key === "Enter") {
        event.preventDefault();
        publish();
      }
    });
  }

  // 插入文本：优先用 execCommand，它能保留浏览器的撤销记录
  function writeAt(area, text, start, end) {
    area.focus();
    area.setSelectionRange(start, end);

    let inserted = false;
    try {
      inserted = document.execCommand("insertText", false, text);
    } catch (error) {
      inserted = false;
    }
    if (!inserted) area.setRangeText(text, start, end, "end");

    markDirty();
    schedulePreview();
    updateCount();
  }

  // 主动点按钮插入：按当前选中的范围插入（选中文字时就是包裹/替换）
  function insertAtCaret(text) {
    const area = form.content;
    const start = area.selectionStart === null ? area.value.length : area.selectionStart;
    const end = area.selectionEnd === null ? start : area.selectionEnd;
    writeAt(area, text, start, end);
  }

  // 记下用户触发上传那一刻的光标位置。上传要花几秒，期间选区可能变（比如用户按了 Ctrl+A），
  // 所以自动插入必须用这里记下的位置，并且只插入、不替换任何内容。
  function rememberCaret() {
    const area = form.content;
    pendingCaret = {
      start: area.selectionStart === null ? area.value.length : area.selectionStart,
      end: area.selectionEnd === null ? 0 : area.selectionEnd
    };
  }

  function insertUploaded(text) {
    const area = form.content;
    const start = pendingCaret ? pendingCaret.start : (area.selectionStart === null ? area.value.length : area.selectionStart);
    pendingCaret = null;
    writeAt(area, text, start, start);
  }

  function applySnippet(snippet) {
    const area = form.content;
    const start = area.selectionStart || 0;
    const end = area.selectionEnd || 0;

    if (snippet.wrap && end > start) {
      insertAtCaret(snippet.wrap[0] + area.value.slice(start, end) + snippet.wrap[1]);
      return;
    }
    insertAtCaret(snippet.template);
  }

  async function uploadFiles(fileList) {
    const picked = Array.from(fileList || []).filter(Boolean);

    // 上传要花几秒，先把光标位置记下来，并把当前内容存一份草稿当保险
    rememberCaret();
    if (dirty) saveDraft(true, true);

    const images = picked.filter(file => file.type && file.type.startsWith("image/"));
    if (!images.length) {
      if (picked.length) setHint("只能上传 png / jpg / webp / gif 图片。", "error");
      return;
    }
    if (images.length > MAX_IMAGES) {
      setHint(`一次最多上传 ${MAX_IMAGES} 张图片。`, "error");
      return;
    }

    setHint(`正在上传 ${images.length} 张图片…`);
    const body = new FormData();
    images.forEach(file => body.append("file", file));

    try {
      const data = await api("/api/admin/upload", body);
      insertUploaded(data.urls.map(imageFigure).join("\n"));
      setHint(`已上传 ${data.urls.length} 张图片并插入正文。图片要等约 1 分钟构建完成才会显示，我等会儿自动刷新一次预览。`, "success");
      // 构建完成后自动重画一次预览，让刚上传的图片自己出现
      window.setTimeout(renderPreview, 80000);
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  async function loadList() {
    try {
      const data = await api("/api/admin/posts");
      if (!data.configured) {
        warnEl.hidden = false;
        warnEl.textContent = "后台还没有配置 GitHub 密钥（GITHUB_TOKEN），现在只能看和写草稿，发布和传图还不通。按《后台使用说明》里的步骤配好就能用。";
      }
      const posts = data.posts || [];
      publishedSlugs = posts.map(post => post.slug);
      if (postCountEl) postCountEl.textContent = publishedSlugs.length ? `(${publishedSlugs.length})` : "";
      renderList(posts);
    } catch (error) {
      listEl.innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`;
    }
    await loadDrafts();
  }

  // 左侧草稿栏：草稿存在云端（KV），刷新页面也不会丢，点一下就能接着写
  async function loadDrafts() {
    if (!draftWrap || !draftListEl) return;
    try {
      const data = await api("/api/admin/drafts");
      draftsCache = data.drafts || [];
      draftWrap.hidden = draftsCache.length === 0;
      if (draftCountEl) draftCountEl.textContent = draftsCache.length ? `(${draftsCache.length})` : "";
      draftListEl.innerHTML = draftsCache.map(draft => `
        <div class="admin-item admin-draft${draft.slug === activeDraftSlug ? " active" : ""}" data-slug="${escapeHtml(draft.slug)}">
          <button class="admin-open" type="button" data-open="${escapeHtml(draft.slug)}">
            <b>${escapeHtml(draft.title || "（还没写标题）")}</b>
            <span>${escapeHtml(timeLabel(draft.savedAt))}　·　${draft.length} 字</span>
          </button>
          <button class="admin-drop" type="button" data-drop="${escapeHtml(draft.slug)}" title="删除这份草稿" aria-label="删除草稿">✕</button>
        </div>`).join("");
      draftListEl.querySelectorAll("[data-open]").forEach(button => {
        button.addEventListener("click", () => openDraft(button.dataset.open));
      });
      draftListEl.querySelectorAll("[data-drop]").forEach(button => {
        button.addEventListener("click", () => dropDraft(button.dataset.drop));
      });
    } catch (error) {
      draftWrap.hidden = true;
    }
  }

  async function openDraft(slug) {
    if (!confirmDiscard()) return;
    try {
      const data = await api(`/api/admin/draft?slug=${encodeURIComponent(slug)}`);
      if (!data.draft) {
        setHint("这份草稿已经不在了。", "error");
        await loadDrafts();
        return;
      }

      const published = publishedSlugs.includes(slug);
      currentSlug = published ? slug : "";
      activeDraftSlug = slug;
      fill({ ...data.draft, slug });
      form.slug.disabled = published;
      btnDelete.hidden = !published;
      btnRestore.hidden = true;
      markClean();
      markActive();
      renderPreview();
      updateCount();
      setHint(published
        ? "正在编辑已发布文章的草稿，点“发布”会覆盖线上那一篇。"
        : "正在编辑草稿（还没发布），点“发布”才会提交到 GitHub。");
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  async function dropDraft(slug) {
    if (!window.confirm("删掉这份草稿？删了就找不回来了。")) return;
    try {
      await api("/api/admin/delete-draft", { slug });
      if (activeDraftSlug === slug) activeDraftSlug = "";
      setHint("草稿已删除。", "success");
      await loadDrafts();
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  function renderList(posts) {
    if (!posts.length) {
      listEl.innerHTML = '<p class="loading">还没有文章。点上面的“新建文章”开始写第一篇。</p>';
      return;
    }
    listEl.innerHTML = posts.map(post => `
      <button class="admin-item${post.slug === currentSlug ? " active" : ""}" type="button" data-slug="${escapeHtml(post.slug)}">
        <b>${escapeHtml(post.title || post.slug)}</b>
        <span>${escapeHtml(post.date || "")}　·　${escapeHtml(post.slug)}</span>
      </button>`).join("");
    listEl.querySelectorAll(".admin-item").forEach(item => {
      item.addEventListener("click", () => openPost(item.dataset.slug));
    });
  }

  function markActive() {
    listEl.querySelectorAll(".admin-item").forEach(item => {
      item.classList.toggle("active", item.dataset.slug === currentSlug);
    });
    if (draftListEl) {
      draftListEl.querySelectorAll(".admin-item").forEach(item => {
        item.classList.toggle("active", Boolean(activeDraftSlug) && item.dataset.slug === activeDraftSlug);
      });
    }
  }

  async function openPost(slug) {
    if (!confirmDiscard()) return;
    setHint("正在读取…");
    try {
      const data = await api(`/api/admin/post?slug=${encodeURIComponent(slug)}`);
      currentSlug = data.post.slug;
      activeDraftSlug = "";
      fill(data.post);
      form.slug.disabled = true;
      btnDelete.hidden = false;
      markClean();
      markActive();
      renderPreview();
      updateCount();
      setHint(`正在编辑：${data.post.title}`);
      await checkDraft(slug);
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  function newPost() {
    if (!confirmDiscard()) return;
    const today = dateToday();
    const slug = `post-${today.replace(/\./g, "")}`;
    currentSlug = "";
    activeDraftSlug = "";
    fill({ slug, title: "", category: "随记", date: today, excerpt: "", lead: "", artLabel: "", cover: "", content: "" });
    form.slug.disabled = false;
    btnDelete.hidden = true;
    btnRestore.hidden = true;
    markClean();
    markActive();
    renderPreview();
    updateCount();

    if (draftsCache.some(draft => draft.slug === slug)) {
      setHint(`提示：${slug} 这份草稿还在，左边“草稿”里点它就能接着写。`);
    } else {
      setHint("新文章：先填标题，再写正文，最后点“发布”。图片可以直接拖进来或粘贴。");
    }
    form.title.focus();
  }

  async function checkDraft(slug) {
    try {
      const data = await api(`/api/admin/draft?slug=${encodeURIComponent(slug)}`);
      if (!data.draft) {
        btnRestore.hidden = true;
        return;
      }
      btnRestore.hidden = false;
      setHint(`这篇有一份 ${timeLabel(data.draft.savedAt)} 存的草稿，要恢复就点“恢复草稿”。`);
    } catch (error) {
      btnRestore.hidden = true;
    }
  }

  async function restoreDraft() {
    const slug = currentSlug || form.slug.value.trim();
    if (!SLUG_PATTERN.test(slug)) return;
    try {
      const data = await api(`/api/admin/draft?slug=${encodeURIComponent(slug)}`);
      if (!data.draft) {
        btnRestore.hidden = true;
        setHint("没有找到草稿。", "error");
        return;
      }
      fill(data.draft);
      markDirty();
      renderPreview();
      updateCount();
      setHint("草稿已恢复，检查一下再点“发布”。", "success");
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  async function saveDraft(silent, quiet) {
    const payload = collect();
    if (!SLUG_PATTERN.test(payload.slug)) {
      if (!silent) setHint("先把“网址代号”填好（英文、数字、下划线或短横线），才能存草稿。", "error");
      return;
    }
    try {
      await api("/api/admin/draft", payload);
      if (!quiet) {
        setHint(silent ? `已自动存草稿（${clock()}）` : `草稿已保存（${clock()}），只有你能看到。`, "success");
        if (!currentSlug) btnRestore.hidden = false;
        activeDraftSlug = payload.slug;
        await loadDrafts();
      }
    } catch (error) {
      if (!quiet) setHint(error.message, "error");
    }
  }

  async function publish() {
    const payload = collect();
    if (!SLUG_PATTERN.test(payload.slug)) return setHint("网址代号只能用英文、数字、下划线和短横线，例如 kanc-2026-09。", "error");
    if (!payload.title) return setHint("标题还没填。", "error");
    if (!payload.content.trim()) return setHint("正文还没写。", "error");
    if (!window.confirm(`发布《${payload.title}》？\n提交到 GitHub 后大约一分钟线上生效。`)) return;

    await run(btnPublish, "发布中…", async () => {
      const data = await api("/api/admin/publish", payload);
      currentSlug = data.slug;
      activeDraftSlug = "";
      form.slug.disabled = true;
      btnDelete.hidden = false;
      btnRestore.hidden = true;
      markClean();
      await loadList();
      markActive();
      setHint(`已提交到 GitHub（${data.created ? "新文章" : "更新"}）。大约一分钟后刷新首页就能看到。`, "success");
    });
  }

  async function removePost() {
    if (!currentSlug) return;
    const title = form.title.value.trim() || currentSlug;
    if (!window.confirm(`确定删除《${title}》？\n会从 GitHub 里删掉正文和文章资料，旧链接会失效。`)) return;
    if (!window.confirm("真的删掉？这一步不能撤销。")) return;

    await run(btnDelete, "删除中…", async () => {
      await api("/api/admin/delete", { slug: currentSlug });
      currentSlug = "";
      activeDraftSlug = "";
      fill({ slug: "", title: "", category: "随记", date: dateToday(), excerpt: "", lead: "", artLabel: "", cover: "", content: "" });
      form.slug.disabled = false;
      btnDelete.hidden = true;
      btnRestore.hidden = true;
      markClean();
      renderPreview();
      updateCount();
      await loadList();
      setHint("已从 GitHub 删除，大约一分钟后线上更新。", "success");
    });
  }

  async function run(button, label, work) {
    const original = button.textContent;
    button.disabled = true;
    button.textContent = label;
    try {
      await work();
    } catch (error) {
      setHint(error.message, "error");
    } finally {
      button.disabled = false;
      button.textContent = original;
    }
  }

  function schedulePreview() {
    window.clearTimeout(previewTimer);
    previewTimer = window.setTimeout(renderPreview, 400);
  }

  function renderPreview() {
    const title = form.title.value.trim() || "（还没有标题）";
    const lead = form.lead.value.trim() || form.excerpt.value.trim();
    const category = form.category.value.trim() || "随记";
    const date = form.date.value.trim();
    frame.srcdoc = `<!DOCTYPE html><html lang="zh-CN"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1"><link rel="stylesheet" href="/style.css"></head><body style="background:#fff"><main style="padding:20px"><article class="article"><p class="eyebrow"><i></i>${escapeHtml(category)} · ${escapeHtml(date)}</p><h1>${escapeHtml(title).replace("：", "：<br>")}</h1>${lead ? `<p class="article-lead">${escapeHtml(lead)}</p>` : ""}<em></em>${form.content.value}</article></main></body></html>`;
    if (noteEl) noteEl.textContent = `预览已更新 ${clock()}`;
  }

  function updateCount() {
    if (!countEl) return;
    const length = form.content.value.length;
    countEl.textContent = `${length} 字`;
    countEl.classList.toggle("over", length > MAX_CONTENT * 0.75);
  }

  function collect() {
    const payload = {};
    Object.entries(form).forEach(([key, field]) => {
      payload[key] = field.value.trim();
    });
    payload.content = form.content.value;
    return payload;
  }

  function fill(post) {
    form.title.value = post.title || "";
    form.slug.value = post.slug || "";
    form.date.value = post.date || dateToday();
    form.category.value = post.category || "随记";
    form.excerpt.value = post.excerpt || "";
    form.lead.value = post.lead || "";
    form.artLabel.value = post.artLabel || "";
    form.cover.value = post.cover || "";
    form.content.value = post.content || "";
  }

  function markDirty() {
    dirty = true;
  }

  function markClean() {
    dirty = false;
  }

  function confirmDiscard() {
    if (!dirty) return true;
    return window.confirm("现在的改动还没发布，切换会丢掉这些改动。确定切换吗？");
  }

  function setHint(message, kind) {
    hintEl.textContent = message;
    hintEl.className = kind || "";
  }

  function hasFiles(dataTransfer) {
    if (!dataTransfer) return false;
    const types = Array.from(dataTransfer.types || []);
    return types.includes("Files");
  }

  function pastedFiles(clipboardData) {
    if (!clipboardData) return [];
    const files = Array.from(clipboardData.files || []);
    if (files.length) return files;
    return Array.from(clipboardData.items || [])
      .filter(item => item.kind === "file")
      .map(item => item.getAsFile())
      .filter(Boolean);
  }

  async function api(path, body) {
    let options = {};
    if (body instanceof FormData) {
      options = { method: "POST", body };
    } else if (body !== undefined) {
      options = { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };
    }

    const response = await fetch(path, options);
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

  function dateToday() {
    const now = new Date();
    return `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, "0")}.${String(now.getDate()).padStart(2, "0")}`;
  }

  function clock() {
    const now = new Date();
    return `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
  }

  function timeLabel(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "之前";
    return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
  }

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }
})();