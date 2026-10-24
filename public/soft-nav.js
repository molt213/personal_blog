(() => {
  const main = document.querySelector("main.page-content");
  if (!main) return;

  // 只允许本站的公开页面。后台、接口、下载文件、外链、hash 链接都不在这里。
  const PUBLIC_ORIGIN = window.location.origin;
  const isPublicPath = pathname =>
    pathname === "/" ||
    pathname === "/posts" ||
    /^\/posts\/[^/]+\.html$/.test(pathname) ||
    pathname === "/downloads" ||
    pathname === "/links" ||
    pathname === "/about" ||
    pathname === "/guestbook";

  // 浏览器端导航只接受同源、http(s)、且路径在白名单里的地址。
  // 返回值用固定 origin 重新拼，绝不把链接里的任意 host 直接交给请求。
  function resolvePublicUrl(value) {
    let url;
    try {
      url = new URL(value, window.location.href);
    } catch {
      return null;
    }
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.origin !== PUBLIC_ORIGIN) return null;
    if (url.username || url.password) return null;
    if (!isPublicPath(url.pathname)) return null;
    return `${PUBLIC_ORIGIN}${url.pathname}${url.search}${url.hash}`;
  }

  history.scrollRestoration = "manual";
  if (!history.state || !history.state.softNav) {
    history.replaceState({ softNav: true, scrollY: window.scrollY }, "", window.location.href);
  }

  let pendingXhr = null;
  let progress = null;

  function ensureProgress() {
    if (progress) return progress;
    progress = document.createElement("div");
    progress.className = "soft-nav-progress";
    progress.setAttribute("aria-hidden", "true");
    document.body.appendChild(progress);
    return progress;
  }

  function setLoading(loading) {
    ensureProgress();
    document.body.classList.toggle("is-soft-navigating", loading);
  }

  function closeOverlays() {
    if (typeof window.__closeOverlays === "function") {
      window.__closeOverlays();
      return;
    }
    const cmdk = document.querySelector(".cmdk");
    if (cmdk && !cmdk.hidden) {
      cmdk.hidden = true;
      document.body.classList.remove("cmdk-open");
    }
    const lightbox = document.querySelector(".lightbox");
    if (lightbox && !lightbox.hidden) {
      lightbox.hidden = true;
      document.body.classList.remove("lightbox-open");
    }
  }

  function updateNav(doc) {
    const active = new Set(
      [...doc.querySelectorAll(".side-nav .nav-link.active, .mobile-header nav .nav-link.active")].map(link =>
        link.getAttribute("href")
      )
    );
    document.querySelectorAll(".side-nav .nav-link, .mobile-header nav .nav-link").forEach(link => {
      link.classList.toggle("active", active.has(link.getAttribute("href")));
    });
  }

  function updateCanonical(doc) {
    const next = doc.querySelector('link[rel="canonical"]');
    let live = document.querySelector('link[rel="canonical"]');
    if (!next) {
      if (live) live.remove();
      return;
    }
    if (!live) {
      live = document.createElement("link");
      live.rel = "canonical";
      document.head.appendChild(live);
    }
    live.href = next.href;
  }

  function loadPublicHtml(target) {
    const relative = target.slice(PUBLIC_ORIGIN.length) || "/";
    const xhr = new XMLHttpRequest();
    const promise = new Promise((resolve, reject) => {
      xhr.open("GET", relative, true);
      xhr.setRequestHeader("Accept", "text/html");
      xhr.withCredentials = true;
      xhr.onload = () => {
        const type = xhr.getResponseHeader("content-type") || "";
        const finalUrl = xhr.responseURL || target;
        if (finalUrl !== PUBLIC_ORIGIN && !finalUrl.startsWith(`${PUBLIC_ORIGIN}/`)) {
          reject(new Error("redirected"));
          return;
        }
        if (xhr.status < 200 || xhr.status >= 300 || !type.includes("text/html")) {
          reject(new Error("bad response"));
          return;
        }
        resolve(xhr.responseText);
      };
      xhr.onerror = () => reject(new Error("network"));
      xhr.onabort = () => reject(Object.assign(new Error("aborted"), { name: "AbortError" }));
      xhr.send();
    });
    return { xhr, promise };
  }

  async function navigate(value, { push = true, scroll = 0 } = {}) {
    const target = resolvePublicUrl(value);
    if (!target) return;
    const url = new URL(target);

    if (pendingXhr) pendingXhr.abort();
    const request = loadPublicHtml(target);
    pendingXhr = request.xhr;
    setLoading(true);
    closeOverlays();

    try {
      const html = await request.promise;
      const doc = new DOMParser().parseFromString(html, "text/html");
      const nextMain = doc.querySelector("main.page-content");
      if (!nextMain) {
        window.location.assign(target);
        return;
      }

      if (push) {
        history.replaceState({ softNav: true, scrollY: window.scrollY }, "", window.location.href);
      }

      main.replaceChildren(...nextMain.childNodes);
      document.title = doc.title;
      updateCanonical(doc);
      updateNav(doc);

      if (push) {
        history.pushState({ softNav: true, scrollY: 0 }, "", target);
      }

      if (typeof window.__siteInitPage === "function") window.__siteInitPage();
      if (typeof window.__initLightbox === "function") window.__initLightbox();
      if (typeof window.__initGuestbook === "function") window.__initGuestbook();

      if (url.hash) {
        const id = decodeURIComponent(url.hash.slice(1));
        const targetNode = document.getElementById(id);
        if (targetNode) {
          // 同步、瞬时滚动：站点全局开了 scroll-behavior: smooth，
          // 这里如果跟着动画走，标签页不绘制时会停在原地。
          targetNode.scrollIntoView({ block: "start", behavior: "instant" });
          // pushState 不会触发 :target，用 class 补一次高亮。
          targetNode.classList.add("is-soft-target");
          setTimeout(() => targetNode.classList.remove("is-soft-target"), 2400);
          return;
        }
      }
      window.scrollTo(0, scroll);
    } catch (error) {
      if (error.name !== "AbortError") window.location.assign(target);
    } finally {
      if (pendingXhr === request.xhr) {
        pendingXhr = null;
        setLoading(false);
      }
    }
  }

  document.addEventListener("click", event => {
    if (event.defaultPrevented) return;
    if (event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
    const link = event.target.closest("a[href]");
    if (!link) return;
    if (link.target && link.target !== "_self") return;
    if (link.hasAttribute("download") || link.dataset.noSoftNav !== undefined) return;

    const href = link.getAttribute("href");
    if (!href || href.startsWith("#")) return;
    if (/^(?:mailto|tel|javascript):/i.test(href)) return;

    const target = resolvePublicUrl(link.href);
    if (!target) return;

    event.preventDefault();
    navigate(target, { push: true });
  });

  addEventListener("popstate", event => {
    const target = resolvePublicUrl(window.location.href);
    if (!target) {
      window.location.reload();
      return;
    }
    navigate(target, { push: false, scroll: Number(event.state?.scrollY) || 0 });
  });

  // 直接打开带 #锚点 的链接时浏览器会自己滚动，但不一定会触发 :target，补一次高亮。
  function highlightHashTarget() {
    if (!window.location.hash) return;
    const node = document.getElementById(decodeURIComponent(window.location.hash.slice(1)));
    if (!node) return;
    node.classList.add("is-soft-target");
    setTimeout(() => node.classList.remove("is-soft-target"), 2400);
  }

  highlightHashTarget();

  window.__softNavigate = href => navigate(href, { push: true });
})();
