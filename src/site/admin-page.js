export function renderAdminPage() {
  return `
<section class="page-heading admin-heading">
  <p class="eyebrow"><i></i>WRITING DESK</p>
  <h1>写作<br><strong>后台</strong></h1>
  <p>左边挑一篇文章，右边写正文。点“发布”会提交到 GitHub，大约一分钟后线上更新。</p>
</section>
<section class="admin-layout">
  <aside class="admin-side">
    <button class="admin-new" id="admin-new" type="button">＋ 新建文章</button>
    <div class="admin-list" id="admin-list"><p class="loading">正在读取文章…</p></div>
  </aside>
  <div class="admin-main">
    <p class="admin-warn" id="admin-warn" hidden></p>
    <div class="admin-fields">
      <label for="f-title">标题</label>
      <input id="f-title" type="text" maxlength="120" placeholder="文章的标题">
      <div class="admin-row">
        <div><label for="f-slug">网址代号 <small>小写英文</small></label><input id="f-slug" type="text" maxlength="61" placeholder="kanc-2026-09"></div>
        <div><label for="f-date">日期</label><input id="f-date" type="text" maxlength="10" placeholder="2026.09.21"></div>
        <div><label for="f-category">分类</label><input id="f-category" type="text" maxlength="20" placeholder="随记"></div>
      </div>
      <label for="f-excerpt">摘要 <small>列表里的一句话</small></label>
      <input id="f-excerpt" type="text" maxlength="200" placeholder="一句话说明这篇写了什么">
      <label for="f-lead">导语 <small>文章页标题下面那句</small></label>
      <input id="f-lead" type="text" maxlength="200" placeholder="留空就和摘要一样">
      <label for="f-artLabel">卡片标签 <small>没有封面时显示的大字，可以按回车换行</small></label>
      <textarea id="f-artLabel" class="admin-short" maxlength="80" placeholder="舰c26年"></textarea>
      <label for="f-cover">封面地址 <small>留空就自动取正文里的第一张图</small></label>
      <input id="f-cover" type="text" maxlength="500" placeholder="/images/xxx.png 或 https://…">
      <div class="admin-toolbar" id="admin-toolbar" role="group" aria-label="插入常用片段"></div>
      <label for="f-content">正文 <small>可以直接粘贴 HTML</small></label>
      <textarea id="f-content" spellcheck="false" placeholder="<p>在这里写正文…</p>"></textarea>
    </div>
    <div class="admin-foot">
      <span id="admin-hint" role="status" aria-live="polite">从左边选一篇文章，或者点“新建文章”。</span>
      <div class="admin-actions">
        <button class="admin-ghost" id="admin-restore" type="button" hidden>恢复草稿</button>
        <button class="admin-ghost" id="admin-draft" type="button">存草稿</button>
        <button class="admin-ghost" id="admin-preview" type="button">刷新预览</button>
        <button class="admin-danger" id="admin-delete" type="button" hidden>删除这篇</button>
        <button class="admin-publish" id="admin-publish" type="button">发布　↗</button>
      </div>
    </div>
    <div class="admin-preview-wrap">
      <div class="admin-preview-head"><span>预览</span><span id="admin-preview-note">改完正文会自动刷新</span></div>
      <iframe class="admin-preview-frame" id="admin-preview-frame" title="文章预览" sandbox="allow-scripts"></iframe>
    </div>
  </div>
</section>`;
}