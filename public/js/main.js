window.PS = window.PS || {};

function fixViewportHeight() {
  const vh = window.innerHeight * 0.01;
  document.documentElement.style.setProperty("--vh", `${vh}px`);
}

function checkOrientation() {
  const isLandscape = window.innerWidth > window.innerHeight;
  document.getElementById("rotate-warning").classList.toggle("active", isLandscape);
}

function bindBackButtons() {
  document.querySelectorAll("[data-back]").forEach((btn) => {
    btn.addEventListener("click", () => PS.ui.showScreen(btn.dataset.back));
  });
}

function renderStageGrid() {
  const grid = document.getElementById("stage-grid");
  const unlocked = PS.runtime.devMode
    ? PS.TOTAL_STAGES
    : (PS.session.user ? PS.session.user.unlockedStage : 1);

  grid.innerHTML = "";
  PS.STAGES.forEach((s) => {
    const cell = document.createElement("div");
    const isLocked = s.id > unlocked;
    cell.className = `stage-cell ${isLocked ? "locked" : s.id < unlocked ? "cleared" : ""}`;
    cell.innerHTML = isLocked
      ? `<span class="lock-icon">🔒</span><span>${s.id}</span>`
      : `<span>${s.id < unlocked ? "✓" : ""}</span><span>${s.id}</span>`;
    if (!isLocked) {
      cell.addEventListener("click", () => {
        PS.ui.showScreen("");
        PS_GAME.startStage(s.id);
      });
    }
    grid.appendChild(cell);
  });
}

function wireMenu() {
  document.getElementById("btn-menu-start").addEventListener("click", () => {
    const startId = PS.session.user ? PS.session.user.unlockedStage : 1;
    PS_GAME.startStage(Math.min(startId, PS.TOTAL_STAGES));
  });
  document.getElementById("btn-menu-stages").addEventListener("click", () => {
    renderStageGrid();
    PS.ui.showScreen("screen-stage-select");
  });
  document.getElementById("btn-menu-tutorial").addEventListener("click", () => {
    PS.ui.showOverlay("screen-tutorial-intro");
  });
  document.getElementById("btn-menu-ranking").addEventListener("click", () => {
    PS.ui.showScreen("screen-ranking");
    PS.rankingUI.tab = "global";
    PS.rankingUI.page = 1;
    document.querySelectorAll("[data-rank-tab]").forEach((t) => t.classList.toggle("active", t.dataset.rankTab === "global"));
    PS.rankingUI.render();
  });
  document.getElementById("btn-menu-friends").addEventListener("click", () => {
    PS.ui.showScreen("screen-friends");
    PS.friendsUI.tab = "list";
    document.querySelectorAll("[data-friend-tab]").forEach((t) => t.classList.toggle("active", t.dataset.friendTab === "list"));
    PS.friendsUI.render();
  });
  document.getElementById("btn-menu-settings").addEventListener("click", () => {
    PS.ui.showScreen("screen-settings");
  });
  document.getElementById("menu-auth-link").addEventListener("click", () => {
    if (!PS.session.user) PS.ui.showScreen("screen-login");
  });
}

function wireAuthScreens() {
  document.getElementById("go-register").addEventListener("click", () => PS.ui.showScreen("screen-register"));

  document.getElementById("btn-login-submit").addEventListener("click", async () => {
    const username = document.getElementById("login-username").value.trim();
    const password = document.getElementById("login-password").value;
    const errEl = document.getElementById("login-error");
    errEl.textContent = "";
    const res = await PS.auth.login(username, password);
    if (!res.success) {
      errEl.textContent = res.error.message;
      return;
    }
    PS.ui.updateAuthLink();
    PS.ui.showScreen("screen-menu");
  });

  document.getElementById("btn-register-submit").addEventListener("click", async () => {
    const username = document.getElementById("register-username").value.trim();
    const password = document.getElementById("register-password").value;
    const password2 = document.getElementById("register-password2").value;
    const errEl = document.getElementById("register-error");
    errEl.textContent = "";
    const res = await PS.auth.register(username, password, password2);
    if (!res.success) {
      errEl.textContent = res.error.message;
      return;
    }
    PS.ui.updateAuthLink();
    PS.ui.showScreen("screen-menu");
  });
}

function wireHud() {
  document.getElementById("btn-pause").addEventListener("click", () => PS_GAME.pauseGame());
  document.getElementById("btn-resume").addEventListener("click", () => PS_GAME.resumeGame());
  document.getElementById("btn-restart").addEventListener("click", () => {
    PS.ui.hideOverlay("screen-pause");
    PS_GAME.restartStage();
  });
  document.getElementById("btn-quit").addEventListener("click", () => PS_GAME.exitToMenu());

  document.getElementById("btn-reset").addEventListener("click", () => PS_GAME.restartStage());
  document.getElementById("btn-camera-reset").addEventListener("click", () => PS_GAME.cameraCtrl.reset());

  document.getElementById("btn-retry-fail").addEventListener("click", () => PS_GAME.restartStage());

  document.getElementById("btn-next-stage").addEventListener("click", () => {
    const nextId = Math.min(PS_GAME.currentStage.id + 1, PS.TOTAL_STAGES);
    PS_GAME.startStage(nextId);
  });
  document.getElementById("btn-replay-stage").addEventListener("click", () => {
    PS_GAME.startStage(PS_GAME.currentStage.id);
  });
  document.getElementById("btn-clear-home").addEventListener("click", () => PS_GAME.exitToMenu());
}

function wireTutorial() {
  document.getElementById("btn-tutorial-begin").addEventListener("click", () => {
    PS.ui.hideOverlay("screen-tutorial-intro");
    PS_GAME.startTutorial();
  });
  document.getElementById("btn-tutorial-skip").addEventListener("click", () => {
    PS.ui.hideOverlay("screen-tutorial-intro");
  });
}

function wireRanking() {
  document.querySelectorAll("[data-rank-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-rank-tab]").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      PS.rankingUI.tab = tab.dataset.rankTab;
      PS.rankingUI.page = 1;
      PS.rankingUI.render();
    });
  });
  document.getElementById("rank-prev").addEventListener("click", () => PS.rankingUI.changePage(-1));
  document.getElementById("rank-next").addEventListener("click", () => PS.rankingUI.changePage(1));
}

function wireFriends() {
  document.querySelectorAll("[data-friend-tab]").forEach((tab) => {
    tab.addEventListener("click", () => {
      document.querySelectorAll("[data-friend-tab]").forEach((t) => t.classList.remove("active"));
      tab.classList.add("active");
      PS.friendsUI.tab = tab.dataset.friendTab;
      PS.friendsUI.render();
    });
  });
  document.getElementById("btn-friend-search").addEventListener("click", () => PS.friendsUI.doSearch());
}

function wireSettings() {
  function bindToggle(id, key) {
    const el = document.getElementById(id);
    el.classList.toggle("on", PS.settings[key]);
    el.addEventListener("click", () => {
      PS.settings[key] = !PS.settings[key];
      el.classList.toggle("on", PS.settings[key]);
    });
  }
  bindToggle("toggle-sound", "sound");
  bindToggle("toggle-sfx", "sfx");
  bindToggle("toggle-vibration", "vibration");

  document.getElementById("slider-sensitivity").addEventListener("input", (e) => {
    PS.settings.sensitivity = Number(e.target.value);
  });
  document.getElementById("select-graphics").addEventListener("change", (e) => {
    PS.settings.graphics = e.target.value;
  });

  document.getElementById("btn-logout").addEventListener("click", async () => {
    await PS.auth.logout();
    PS.ui.updateAuthLink();
    PS.ui.showScreen("screen-menu");
  });
}

function tutorialHintLoop() {
  setInterval(() => {
    if (!PS.runtime.inTutorial) return;
    const p = PS.runtime.tutorialProgress || {};
    let text = "왼쪽 아래 조이스틱으로 이동해보세요.";
    if (p.moved) text = "오른쪽을 드래그해서 카메라를 회전해보세요.";
    if (p.moved && p.rotated) text = "끊어진 길이 이어지는 각도를 찾아보세요.";
    if (p.illusionFound) text = "출구까지 도달해보세요! 가짜 벽도 있을 수 있어요.";
    const hintEl = document.getElementById("hud-hint");
    if (hintEl && !document.getElementById("hud").classList.contains("hidden")) {
      hintEl.textContent = text;
    }
  }, 500);
}

async function bootstrap() {
  fixViewportHeight();
  checkOrientation();
  window.addEventListener("resize", () => {
    fixViewportHeight();
    checkOrientation();
  });
  window.addEventListener("orientationchange", checkOrientation);

  window.addEventListener("online", () => PS.ui.setOfflineBanner(false));
  window.addEventListener("offline", () => PS.ui.setOfflineBanner(true));

  PS.ui.setLoadingProgress(0.1, "LOADING...");

  PS.input.init();
  PS.ui.setLoadingProgress(0.35);

  const canvas = document.getElementById("gameCanvas");
  PS_GAME.init(canvas);
  PS.ui.setLoadingProgress(0.7);

  bindBackButtons();
  wireMenu();
  wireAuthScreens();
  wireHud();
  wireTutorial();
  wireRanking();
  wireFriends();
  wireSettings();
  tutorialHintLoop();

  PS.ui.setLoadingProgress(0.9);

  const healthRes = await PS.apiFetch("/health");
  if (healthRes.success) {
    PS.runtime.devMode = !!healthRes.data.devMode;
    await PS.auth.fetchMe();
  }
  PS.ui.updateAuthLink();

  PS.ui.setLoadingProgress(1.0, "READY");
  setTimeout(() => PS.ui.hideLoadingScreen(), 250);
}

document.addEventListener("DOMContentLoaded", bootstrap);