fetch("/api/views")
  .then(response => response.json())
  .then(data => {
    if (!data.ok) return;
    const stats = document.getElementById("stats");
    if (stats) stats.textContent = `已相遇 ${data.views} 次 · 开站第 ${data.days} 天`;
  })
  .catch(() => {});
