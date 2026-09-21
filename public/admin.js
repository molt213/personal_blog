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
  const btnNew = $("admin-new");
  const btnRestore = $("admin-restore");
  const btnDraft = $("admin-draft");
  const btnPreview = $("admin-preview");
  const btnDelete = $("admin-delete");
  const btnPublish = $("admin-publish");

  const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{0,60}$/;
  const SNIPPETS = [
    { label: "大标题", text: "<h2>一、标题</h2>\n" },
    { label: "小标题", text: "<h3>① 小标题</h3>\n" },
    { label: "段落", text: "<p>正文</p>\n" },
    { label: "灰字注释", text: '<small class="note">说明</small>\n' },
    { label: "引用框", text: '<blockquote>\n  引用内容。<br>\n  <small class="note">来源或翻译。</small>\n</blockquote>\n' },
    { label: "链接", text: '<a class="text-link" href="https://example.com/">链接文字</a>' },
    { label: "图片", text: '<img src="/images/文件名.png" alt="说明">\n' },
    { label: "图片带说明", text: '<figure class="article-image">\n  <img src="/images/文件名.png" alt="说明">\n  <figcaption>图片说明。</figcaption>\n</figure>\n' },
    { label: "视频", text: '<figure class="video-embed">\n  <iframe src="https://www.youtube.com/embed/视频ID" title="视频标题" loading="lazy" allowfullscreen></iframe>\n  <figcaption>视频来源。</figcaption>\n</figure>\n' },
    { label: "音乐", text: '<figure class="music-embed">\n  <iframe src="https://music.163.com/outchain/player?type=2&id=歌曲ID&auto=0&height=66" title="歌曲名" loading="lazy"></iframe>\n  <figcaption>音乐：歌曲名。来源：网易云音乐。</figcaption>\n</figure>\n' },
    { label: "剧透块", text: '<button class="spoiler" type="button">隐藏内容</button>' }
  ];

  let currentSlug = "";
  let dirty = false;
  let previewTimer = 0;

  buildToolbar();
  Object.values(form).forEach(field => {
    field.addEventListener("input", () => {
      markDirty();
      if (field === form.content || field === form.title || field === form.lead || field === form.excerpt) schedulePreview();
    });
  });

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

  function buildToolbar() {
    const bar = $("admin-toolbar");
    if (!bar) return;
    bar.innerHTML = SNIPPETS.map((snippet, index) => `<button type="button" data-index="${index}">${escapeHtml(snippet.label)}</button>`).join("");
    bar.addEventListener("click", event => {
      const button = event.target.closest("button[data-index]");
      if (!button) return;
      insertSnippet(SNIPPETS[Number(button.dataset.index)].text);
    });
  }

  function insertSnippet(text) {
    const area = form.content;
    const start = area.selectionStart === null ? area.value.length : area.selectionStart;
    const end = area.selectionEnd === null ? start : area.selectionEnd;
    area.value = area.value.slice(0, start) + text + area.value.slice(end);
    const caret = start + text.length;
    area.focus();
    area.setSelectionRange(caret, caret);
    markDirty();
    schedulePreview();
  }

  async function loadList() {
    try {
      const data = await api("/api/admin/posts");
      if (!data.configured) {
        warnEl.hidden = false;
        warnEl.textContent = "后台还没有配置 GitHub 密钥（GITHUB_TOKEN），现在只能看和写草稿，发布还不通。按《后台使用说明》里的步骤配好就能用。";
      }
      renderList(data.posts || []);
    } catch (error) {
      listEl.innerHTML = `<p class="loading">${escapeHtml(error.message)}</p>`;
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
  }

  async function openPost(slug) {
    if (!confirmDiscard()) return;
    setHint("正在读取…");
    try {
      const data = await api(`/api/admin/post?slug=${encodeURIComponent(slug)}`);
      currentSlug = data.post.slug;
      fill(data.post);
      form.slug.disabled = true;
      btnDelete.hidden = false;
      markClean();
      markActive();
      renderPreview();
      setHint(`正在编辑：${data.post.title}`);
      await checkDraft(slug);
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  function newPost() {
    if (!confirmDiscard()) return;
    const today = dateToday();
    currentSlug = "";
    fill({ slug: `post-${today.replace(/\./g, "")}`, title: "", category: "随记", date: today, excerpt: "", lead: "", artLabel: "", cover: "", content: "" });
    form.slug.disabled = false;
    btnDelete.hidden = true;
    btnRestore.hidden = true;
    markClean();
    markActive();
    renderPreview();
    setHint("新文章：先填标题，再写正文，最后点“发布”。");
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
      setHint("草稿已恢复，检查一下再点“发布”。", "success");
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  async function saveDraft(silent) {
    const payload = collect();
    if (!SLUG_PATTERN.test(payload.slug)) {
      if (!silent) setHint("先把“网址代号”填好（小写英文、数字、短横线），才能存草稿。", "error");
      return;
    }
    try {
      const data = await api("/api/admin/draft", payload);
      setHint(silent ? `已自动存草稿（${clock()}）` : `草稿已保存（${clock()}），只有你能看到。`, "success");
      if (!silent && !currentSlug) btnRestore.hidden = false;
    } catch (error) {
      setHint(error.message, "error");
    }
  }

  async function publish() {
    const payload = collect();
    if (!SLUG_PATTERN.test(payload.slug)) return setHint("网址代号只能用英文小写、数字和短横线，例如 kanc-2026-09。", "error");
    if (!payload.title) return setHint("标题还没填。", "error");
    if (!payload.content.trim()) return setHint("正文还没写。", "error");
    if (!window.confirm(`发布《${payload.title}》？\n提交到 GitHub 后大约一分钟线上生效。`)) return;

    await run(btnPublish, "发布中…", async () => {
      const data = await api("/api/admin/publish", payload);
      currentSlug = data.slug;
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
      fill({ slug: "", title: "", category: "随记", date: dateToday(), excerpt: "", lead: "", artLabel: "", cover: "", content: "" });
      form.slug.disabled = false;
      btnDelete.hidden = true;
      btnRestore.hidden = true;
      markClean();
      renderPreview();
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

  async function api(path, body) {
    const options = body === undefined
      ? {}
      : { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) };

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