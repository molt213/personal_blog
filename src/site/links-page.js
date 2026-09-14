export function renderLinksPage(links, site) {
  const cards = links
    .filter(link => isAllowedUrl(link.url))
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
  const avatar = isAllowedUrl(link.avatar) ? String(link.avatar) : "";
  const badge = avatar
    ? `<img src="${escapeHtml(avatar)}" alt="" loading="lazy" referrerpolicy="no-referrer">`
    : escapeHtml(String(link.icon || link.name || "·").trim().charAt(0) || "·").toUpperCase();
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

// 只放行 http/https 的公网地址:拒绝 localhost、环回、私有与保留地址
function isAllowedUrl(value) {
  let url;
  try {
    url = new URL(String(value || ""));
  } catch {
    return false;
  }
  if (url.protocol !== "http:" && url.protocol !== "https:") return false;

  const host = url.hostname.toLowerCase().replace(/^\[(.*)\]$/, "$1");
  if (!host) return false;
  if (host === "localhost" || host.endsWith(".localhost") || host.endsWith(".local")) return false;

  if (host.includes(":")) {
    if (host === "::" || host === "::1") return false;
    if (/^fe80:/.test(host) || /^f[cd][0-9a-f]{2}:/.test(host)) return false;
    return true;
  }

  const v4 = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (!v4) return true;
  const [a, b] = [Number(v4[1]), Number(v4[2])];
  if (a === 0 || a === 10 || a === 127) return false;
  if (a === 100 && b >= 64 && b <= 127) return false;
  if (a === 169 && b === 254) return false;
  if (a === 172 && b >= 16 && b <= 31) return false;
  if (a === 192 && b === 168) return false;
  if (a >= 224) return false;
  return true;
}

function escapeHtml(value) {
  return String(value).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
