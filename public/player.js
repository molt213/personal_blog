(() => {
  const player = document.querySelector(".splayer");
  const engine = document.querySelector(".site-player-engine");
  if (!player || !engine) return;

  const slot = document.querySelector(".splayer-slot");
  const drawer = player.querySelector(".splayer-drawer");
  const progressBar = player.querySelector(".splayer-progress");
  const progressFill = player.querySelector("[data-progress-fill]");
  const listToggle = player.querySelector("[data-list-toggle]");
  const mobileQuery = window.matchMedia("(max-width: 850px)");

  let ap = null;
  let tracks = [];
  let hasUserPlayed = false;
  let toastTimer = 0;

  document.body.classList.add("has-player");

  const ICONS = {
    play: '<svg class="icon icon-play" viewBox="0 0 24 24" aria-hidden="true"><path d="M8.5 5.8 18 12 8.5 18.2Z"/></svg>',
    pause: '<svg class="icon icon-pause" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5.5v13M15 5.5v13"/></svg>',
    repeat: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/></svg>',
    repeatOne: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="m17 2 4 4-4 4"/><path d="M3 11v-1a4 4 0 0 1 4-4h14"/><path d="m7 22-4-4 4-4"/><path d="M21 13v1a4 4 0 0 1-4 4H3"/><path d="M11.2 10.6 12.4 9.9v4.2"/></svg>',
    shuffle: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M16 3h5v5"/><path d="M4 20 21 3"/><path d="M21 16v5h-5"/><path d="m15 15 6 6"/><path d="m4 4 5 5"/></svg>',
    volume: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.5 8.8H3v6.4h3.5L11 19z"/><path d="M15.5 9a4 4 0 0 1 0 6"/><path d="M18 6.5a7.5 7.5 0 0 1 0 11"/></svg>',
    muted: '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true"><path d="M11 5 6.5 8.8H3v6.4h3.5L11 19z"/><path d="m16 9.5 5 5"/><path d="m21 9.5-5 5"/></svg>'
  };

  const MODES = [
    { id: "list", label: "顺序", title: "顺序播放", icon: ICONS.repeat },
    { id: "random", label: "随机", title: "随机播放", icon: ICONS.shuffle },
    { id: "one", label: "单曲", title: "单曲循环", icon: ICONS.repeatOne }
  ];

  const MODE_KEY = "molt213-player-mode";
  const VOLUME_KEY = "molt213-player-volume";

  const modeButton = player.querySelector("[data-mode]");
  const volumeInput = player.querySelector("[data-volume]");
  const muteButton = player.querySelector("[data-mute]");

  let modeIndex = 0;
  let lastVolume = 0.6;

  const storedMode = Number(readStored(MODE_KEY));
  if (Number.isInteger(storedMode) && storedMode >= 0 && storedMode < MODES.length) modeIndex = storedMode;

  function readStored(key) {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }

  function writeStored(key, value) {
    try {
      localStorage.setItem(key, value);
    } catch {
      /* 隐私模式下存不了就算了，不影响播放 */
    }
  }

  const fmt = value => {
    if (!Number.isFinite(value) || value < 0) return "0:00";
    const minutes = Math.floor(value / 60);
    const seconds = Math.floor(value % 60);
    return `${minutes}:${String(seconds).padStart(2, "0")}`;
  };

  const esc = value =>
    String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const setPlayIcon = playing => {
    player.querySelectorAll(".splayer-play").forEach(button => {
      button.innerHTML = playing ? ICONS.pause : ICONS.play;
      button.setAttribute("aria-label", playing ? "暂停" : "播放");
    });
  };

  function syncPlacement() {
    if (mobileQuery.matches) {
      if (player.parentElement !== document.body) document.body.appendChild(player);
      player.classList.add("is-mobile");
    } else {
      player.classList.remove("is-mobile");
      if (slot && player.parentElement !== slot) slot.appendChild(player);
    }
  }

  function showToast(message) {
    let toast = document.querySelector(".player-toast");
    if (!toast) {
      toast = document.createElement("div");
      toast.className = "player-toast";
      document.body.appendChild(toast);
    }
    toast.textContent = message;
    toast.classList.add("is-visible");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-visible"), 3200);
  }

  function waitFor(getter, timeout = 10000) {
    return new Promise((resolve, reject) => {
      const started = Date.now();
      const tick = () => {
        const value = getter();
        if (value) return resolve(value);
        if (Date.now() - started > timeout) return reject(new Error("player timeout"));
        setTimeout(tick, 60);
      };
      tick();
    });
  }

  function applyMode() {
    const mode = MODES[modeIndex];
    if (ap) {
      // APlayer 自己在播完时读这两个值：all 列表循环、one 单曲、random 走随机序。
      ap.options.loop = mode.id === "one" ? "one" : "all";
      ap.options.order = mode.id === "random" ? "random" : "list";
    }
    if (modeButton) {
      modeButton.innerHTML = `${mode.icon}<span class="mode-label">${mode.label}</span>`;
      modeButton.title = mode.title;
      modeButton.setAttribute("aria-label", `播放模式：${mode.title}`);
    }
  }

  function applyVolume(value, persist = true) {
    const volume = Math.min(1, Math.max(0, Number(value) || 0));
    if (ap) ap.audio.volume = volume;
    if (volume > 0) lastVolume = volume;
    if (volumeInput) {
      const percent = Math.round(volume * 100);
      volumeInput.value = String(percent);
      volumeInput.style.setProperty("--vol", `${percent}%`);
    }
    if (muteButton) {
      const muted = volume === 0;
      muteButton.innerHTML = muted ? ICONS.muted : ICONS.volume;
      muteButton.setAttribute("aria-label", muted ? "取消静音" : "静音");
      muteButton.setAttribute("aria-pressed", String(muted));
    }
    if (persist) writeStored(VOLUME_KEY, String(volume));
  }

  function bindPlayer() {
    ap.on("listswitch", updateAll);
    ap.on("play", () => {
      hasUserPlayed = true;
      updateAll();
    });
    ap.on("pause", updateAll);
    ap.on("ended", updateAll);
    ap.on("error", onPlaybackError);
    ap.audio.addEventListener("timeupdate", updateProgress);
    ap.audio.addEventListener("durationchange", updateProgress);

    player.querySelectorAll("[data-play]").forEach(button => {
      button.addEventListener("click", () => {
        hasUserPlayed = true;
        ap.toggle();
      });
    });
    player.querySelectorAll("[data-prev]").forEach(button => {
      button.addEventListener("click", () => ap.skipBack());
    });
    player.querySelectorAll("[data-next]").forEach(button => {
      button.addEventListener("click", () => ap.skipForward());
    });
    if (listToggle) {
      listToggle.addEventListener("click", () => {
        if (!drawer) return;
        drawer.hidden = !drawer.hidden;
        listToggle.setAttribute("aria-expanded", String(!drawer.hidden));
      });
    }
    if (modeButton) {
      modeButton.addEventListener("click", () => {
        modeIndex = (modeIndex + 1) % MODES.length;
        writeStored(MODE_KEY, String(modeIndex));
        applyMode();
        showToast(`播放模式：${MODES[modeIndex].title}`);
      });
    }
    if (volumeInput) {
      volumeInput.addEventListener("input", () => applyVolume(Number(volumeInput.value) / 100));
    }
    if (muteButton) {
      muteButton.addEventListener("click", () => {
        const current = ap ? ap.audio.volume : 0;
        applyVolume(current > 0 ? 0 : lastVolume || 0.6);
      });
    }
    if (progressBar) {
      progressBar.addEventListener("click", event => {
        if (!Number.isFinite(ap.audio.duration)) return;
        const rect = progressBar.getBoundingClientRect();
        const ratio = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width));
        ap.seek(ratio * ap.audio.duration);
      });
      progressBar.addEventListener("keydown", event => {
        if (!Number.isFinite(ap.audio.duration)) return;
        const step = event.shiftKey ? 15 : 5;
        if (event.key === "ArrowRight") {
          event.preventDefault();
          ap.seek(Math.min(ap.audio.duration, ap.audio.currentTime + step));
        } else if (event.key === "ArrowLeft") {
          event.preventDefault();
          ap.seek(Math.max(0, ap.audio.currentTime - step));
        } else if (event.key === "Home") {
          event.preventDefault();
          ap.seek(0);
        } else if (event.key === "End") {
          event.preventDefault();
          ap.seek(ap.audio.duration);
        }
      });
    }
    if (drawer) {
      drawer.addEventListener("click", event => {
        const row = event.target.closest("[data-track-index]");
        if (!row) return;
        ap.list.switch(Number(row.dataset.trackIndex));
        ap.play();
        drawer.hidden = true;
        if (listToggle) listToggle.setAttribute("aria-expanded", "false");
      });
    }
  }

  function updateAll() {
    if (!ap) return;
    const index = ap.list.index || 0;
    const track = tracks[index] || {};
    const playing = !ap.audio.paused;
    player.classList.toggle("is-playing", playing);
    player.querySelectorAll("[data-title]").forEach(el => (el.textContent = track.name || "—"));
    player.querySelectorAll("[data-artist]").forEach(el => (el.textContent = track.artist || "—"));
    player.querySelectorAll("[data-index]").forEach(el => {
      el.textContent = `${String(index + 1).padStart(2, "0")} / ${String(tracks.length).padStart(2, "0")}`;
    });
    player.querySelectorAll("[data-count]").forEach(el => (el.textContent = String(tracks.length)));
    player.querySelectorAll("[data-cover]").forEach(img => {
      if (!track.cover) return;
      if (img.getAttribute("src") !== track.cover) {
        img.classList.remove("is-loaded");
        img.src = track.cover;
      }
      const markLoaded = () => img.classList.add("is-loaded");
      if (img.complete && img.naturalWidth) markLoaded();
      else img.addEventListener("load", markLoaded, { once: true });
    });
    setPlayIcon(playing);
    renderPlaylist(index);
    updateProgress();
  }

  function renderPlaylist(currentIndex) {
    if (!drawer) return;
    const key = `${tracks.length}:${currentIndex}`;
    if (drawer.dataset.key === key) return;
    drawer.dataset.key = key;
    drawer.innerHTML = tracks
      .map((track, index) => {
        const current = index === currentIndex;
        return `<button class="track${current ? " is-current" : ""}" type="button" data-track-index="${index}">
          <span class="track-num">${String(index + 1).padStart(2, "0")}</span>
          <span class="track-copy"><b>${esc(track.name)}</b><small>${esc(track.artist)}</small></span>
          <span class="track-eq" aria-hidden="true"><i></i><i></i><i></i></span>
          <span class="track-play" aria-hidden="true">${ICONS.play}</span>
        </button>`;
      })
      .join("");
  }

  function updateProgress() {
    if (!ap) return;
    const duration = ap.audio.duration || 0;
    const current = ap.audio.currentTime || 0;
    const percent = duration ? Math.min(100, (current / duration) * 100) : 0;
    if (progressFill) progressFill.style.width = `${percent}%`;
    player.querySelectorAll("[data-current]").forEach(el => (el.textContent = fmt(current)));
    player.querySelectorAll("[data-duration]").forEach(el => (el.textContent = fmt(duration)));
    if (progressBar) {
      progressBar.setAttribute("aria-valuenow", String(Math.round(duration ? (current / duration) * 100 : 0)));
      progressBar.setAttribute("aria-valuetext", `${fmt(current)} / ${fmt(duration)}`);
    }
  }

  function onPlaybackError() {
    if (!hasUserPlayed) return;
    showToast("这首歌暂时不可用，正在换下一首…");
    if (tracks.length <= 1) return;
    setTimeout(() => {
      if (!ap || !ap.audio.error) return;
      ap.skipForward();
    }, 900);
  }

  async function boot() {
    try {
      ap = await waitFor(() => engine.aplayer);
      tracks = ap.list.audios || [];
      if (!tracks.length) throw new Error("empty playlist");
      ap.list.switch(0);
      bindPlayer();
      const savedVolume = readStored(VOLUME_KEY);
      applyVolume(savedVolume === null ? ap.audio.volume || 0.6 : Number(savedVolume), false);
      applyMode();
      updateAll();
      player.querySelectorAll("button").forEach(button => {
        button.disabled = false;
      });
      if (volumeInput) volumeInput.disabled = false;
      if (progressBar) progressBar.setAttribute("aria-disabled", "false");
    } catch {
      player.querySelectorAll("[data-title]").forEach(el => (el.textContent = "播放器暂时不可用"));
      showToast("歌单没有载入，稍后再试。");
    }
  }

  syncPlacement();
  if (mobileQuery.addEventListener) {
    mobileQuery.addEventListener("change", syncPlacement);
  } else if (mobileQuery.addListener) {
    mobileQuery.addListener(syncPlacement);
  }
  boot();
})();
