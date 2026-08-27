(() => {
  const form = document.getElementById("form");
  if (!form) return;

  const hint = document.getElementById("hint");
  const button = document.getElementById("btn");
  const list = document.getElementById("list");
  const nameInput = document.getElementById("name");
  const textInput = document.getElementById("text");

  function escapeHtml(value) {
    return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function loadMessages() {
    fetch("/api/guestbook")
      .then(response => {
        if (!response.ok) throw new Error("load failed");
        return response.json();
      })
      .then(rows => {
        if (!rows.length) {
          list.innerHTML = '<p class="loading">这里还没有留言。要不要留下第一句？</p>';
          return;
        }

        list.innerHTML = rows.map(row => `
          <article class="message"><b>${escapeHtml(String(row.name || "匿").slice(0, 1))}</b><div><p><strong>${escapeHtml(row.name || "匿名")}</strong><time>${escapeHtml(String(row.created_at || "").replace(" ", " · "))}</time></p><span>${escapeHtml(row.text)}</span></div></article>
        `).join("");
      })
      .catch(() => {
        list.innerHTML = '<p class="loading">暂时没能读取留言，稍后再来看看吧。</p>';
      });
  }

  form.addEventListener("submit", event => {
    event.preventDefault();
    button.disabled = true;
    hint.textContent = "正在送达…";
    hint.className = "";

    fetch("/api/guestbook", {
      method: "POST",
      body: new URLSearchParams({ name: nameInput.value, text: textInput.value })
    })
      .then(async response => {
        const data = await response.json();
        if (!response.ok || !data.ok) throw new Error("submit failed");
        textInput.value = "";
        hint.textContent = "已收到，感谢你留下这句话。";
        hint.className = "success";
        loadMessages();
      })
      .catch(() => {
        hint.textContent = "没有发送成功，请稍后再试。";
        hint.className = "error";
      })
      .finally(() => {
        button.disabled = false;
      });
  });

  loadMessages();
})();
