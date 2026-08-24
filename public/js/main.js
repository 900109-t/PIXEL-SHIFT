import { Game, STATE } from "./game.js";

const loadingScreen = document.getElementById("loading-screen");
const loadingFill = document.getElementById("loading-fill");
const titleScreen = document.getElementById("screen-title");
const hud = document.getElementById("hud");
const controls = document.getElementById("controls");
const rotateNotice = document.getElementById("rotate-notice");
const hudStageEl = document.getElementById("hud-stage");

let game = null;

function checkOrientation() {
  const isPortrait = window.innerHeight >= window.innerWidth;
  rotateNotice.classList.toggle("show", !isPortrait);
}
window.addEventListener("resize", checkOrientation);
window.addEventListener("orientationchange", checkOrientation);
checkOrientation();

function fakeLoad() {
  return new Promise((resolve) => {
    let p = 0;
    const t = setInterval(() => {
      p += 8 + Math.random() * 12;
      if (p >= 100) {
        p = 100;
        clearInterval(t);
        setTimeout(resolve, 150);
      }
      loadingFill.style.width = `${p}%`;
    }, 60);
  });
}

async function boot() {
  await fakeLoad();
  loadingScreen.classList.add("fade-out");
  setTimeout(() => loadingScreen.classList.add("hidden"), 250);

  titleScreen.classList.remove("hidden");

  const canvas = document.getElementById("game-canvas");
  game = new Game(canvas);

  titleScreen.querySelectorAll(".menu-btn").forEach((btn) => {
    btn.addEventListener("click", () => onMenuAction(btn.dataset.action));
  });

  document.getElementById("btn-reset").addEventListener("click", () => {
    if (game) game.respawn();
  });

  document.getElementById("btn-pause").addEventListener("click", () => {
    if (!game) return;
    game.state = game.state === STATE.PAUSED ? STATE.PLAYING : STATE.PAUSED;
  });

  watchGameState();
}

function onMenuAction(action) {
  if (action === "start") {
    titleScreen.classList.add("hidden");
    hud.classList.remove("hidden");
    controls.classList.remove("hidden");
    game.loadStage(1);
    return;
  }
  // 랭킹 / 친구 / 튜토리얼 / 설정은 이후 단계에서 화면을 추가한다.
  console.log(`[PIXEL SHIFT] "${action}" 화면은 다음 단계에서 연결됩니다.`);
}

// 임시 HUD 피드백 (정식 클리어/실패 화면은 다음 단계에서 구현)
let lastState = null;
function watchGameState() {
  requestAnimationFrame(watchGameState);
  if (!game || game.state === lastState) return;
  lastState = game.state;

  const label = hudStageEl.firstChild;
  if (game.state === STATE.CLEAR) {
    label.textContent = "STAGE CLEAR! ";
  } else if (game.state === STATE.FAILED) {
    label.textContent = "떨어졌습니다... ";
  } else if (game.state === STATE.PLAYING && game.currentLevel) {
    label.textContent = `${game.currentLevel.name} `;
  }
}

boot();
