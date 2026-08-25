// 전역 네임스페이스. 모든 모듈은 window.PS 아래에서 상태를 공유한다.
window.PS = window.PS || {};

PS.STATE = {
  MENU: "MENU",
  TUTORIAL: "TUTORIAL",
  PLAYING: "PLAYING",
  PAUSED: "PAUSED",
  FAILED: "FAILED",
  CLEAR: "CLEAR",
  STAGE_SELECT: "STAGE_SELECT",
  RANKING: "RANKING",
  FRIENDS: "FRIENDS",
  SETTINGS: "SETTINGS",
  LOGIN: "LOGIN",
  REGISTER: "REGISTER"
};

PS.settings = {
  sound: true,
  sfx: true,
  vibration: true,
  sensitivity: 5,
  graphics: "MEDIUM"
};

PS.session = {
  user: null // { id, username, totalScore, tutorialCompleted, unlockedStage }
};

PS.runtime = {
  currentState: PS.STATE.MENU,
  currentStageId: 1,
  devMode: false
};

const PS_UI = {};
PS.ui = PS_UI;

PS_UI.showScreen = function (screenId) {
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  const target = document.getElementById(screenId);
  if (target) target.classList.add("active");
};

PS_UI.showOverlay = function (id) {
  document.getElementById(id).classList.add("active");
};

PS_UI.hideOverlay = function (id) {
  document.getElementById(id).classList.remove("active");
};

PS_UI.hideAllOverlays = function () {
  document.querySelectorAll(".overlay-center").forEach((el) => el.classList.remove("active"));
};

let toastTimer = null;
PS_UI.toast = function (message, durationMs) {
  const el = document.getElementById("toast");
  el.textContent = message;
  el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), durationMs || 2000);
};

PS_UI.setOfflineBanner = function (visible) {
  document.getElementById("offline-banner").classList.toggle("active", !!visible);
};

PS_UI.setLoadingProgress = function (ratio, label) {
  document.getElementById("loading-bar").style.width = `${Math.round(ratio * 100)}%`;
  if (label) document.getElementById("loading-label").textContent = label;
};

PS_UI.hideLoadingScreen = function () {
  const el = document.getElementById("loading-screen");
  el.style.transition = "opacity 0.3s ease";
  el.style.opacity = "0";
  setTimeout(() => (el.style.display = "none"), 300);
};

PS_UI.formatTime = function (ms) {
  return (ms / 1000).toFixed(2) + "초";
};

PS_UI.updateAuthLink = function () {
  const link = document.getElementById("menu-auth-link");
  if (PS.session.user) {
    link.textContent = `${PS.session.user.username} 님 · 총점 ${PS.session.user.totalScore}`;
  } else {
    link.textContent = "로그인 / 회원가입";
  }
};