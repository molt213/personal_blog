export function renderLinksPage(links, site) {
  const cards = links
    .filter(link => /^https?:\/\//i.test(String(link.url || "")))
    .map(renderLinkCard)
    .join("");

  const grid = cards
    ? `<section class="link-grid">${cards}</section>`
    : `<p class="loading">还没有友链,欢迎来当第一个。</p>`;

  return `${grid}
<p class="links-note">想交换友链?把你的站点地址和一句话简介发到 <a href="mailto:${escapeHtml(site.contactEmail)}">${escapeHtml(site.contactEmail)}</a>,合适的话我就加上。</p>`;
}

function renderLinkCard(link) {
  const url = String(link.url);
  const badge = escapeHtml(String(link.icon || link.name || "·").trim().charAt(0) || "·").toUpperCase();
  return `
<a class="link-card" href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer">
  <span class="link-top"><b class="link-badge" aria-hidden="true">${badge}</b><strong>${escapeHtml(link.name || "")}</strong></span>
  <p>${escapeHtml(link.description || "")}</p>
  <span class="link-foot"><span>${escapeHtml(hostnameOf(url))}</span><b aria-hidden="true">→</b></span>
</a>`;
}

function hostnameOf(url) {
  try {
    return new URL(url).hostname;
  } catch {
    return "";
  }
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
