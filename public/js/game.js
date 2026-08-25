window.PS = window.PS || {};

const PS_GAME = {
  three: null,
  cameraCtrl: null,
  player: null,
  illusion: null,
  stageGroup: null,
  menuBgGroup: null,
  playerMesh: null,
  currentStage: null,
  startTime: 0,
  attempts: 0,
  running: false,
  lastFrame: 0,
  tutorialStep: 0
};
PS.game = PS_GAME;

const TUTORIAL_STEPS = [
  { text: "왼쪽 아래 조이스틱으로 이동해보세요.", check: "move" },
  { text: "오른쪽을 드래그해서 카메라를 회전해보세요.", check: "rotate" },
  { text: "끊어진 길이 이어지는 각도를 찾아보세요.", check: "illusionFound" },
  { text: "벽처럼 보여도 통과되는 가짜 벽이 있습니다.", check: "wallPassed" },
  { text: "출구까지 도달해보세요!", check: "cleared" }
];

PS_GAME.init = function (canvas) {
  const three = PS_RENDER.initThree(canvas);
  PS_GAME.three = three;
  PS_GAME.cameraCtrl = new PS.CameraController(three.camera);
  PS_GAME.player = new PS.Player();
  PS_GAME.illusion = new PS.IllusionSystem();
  PS_GAME.playerMesh = PS_RENDER.createPlayerMesh(three.scene);
  PS_GAME.playerMesh.visible = false;

  PS_GAME.menuBgGroup = PS_RENDER.buildMenuBackground(three.scene);
  three.camera.position.set(4, 2, 8);
  three.camera.lookAt(0, 0, -4);

  PS_GAME.lastFrame = performance.now();
  requestAnimationFrame(PS_GAME.loop);
};

PS_GAME.loop = function (now) {
  requestAnimationFrame(PS_GAME.loop);
  const dt = Math.min((now - PS_GAME.lastFrame) / 1000, 0.05);
  PS_GAME.lastFrame = now;

  if (PS_GAME.menuBgGroup) {
    PS_GAME.menuBgGroup.rotation.y += dt * 0.05;
  }

  if (PS_GAME.running) {
    PS_GAME.tick(dt);
  }

  PS_GAME.three.renderer.render(PS_GAME.three.scene, PS_GAME.three.camera);
};

PS_GAME.tick = function (dt) {
  const camDelta = PS.input.consumeCameraDelta();
  PS_GAME.cameraCtrl.applyDrag(camDelta.x, camDelta.y);

  const yaw = PS_GAME.cameraCtrl.getYawForIllusion();
  PS_GAME.illusion.update(yaw, PS_GAME.player.position);

  if (PS.runtime.inTutorial) {
    const t = (PS.runtime.tutorialProgress = PS.runtime.tutorialProgress || {});
    if (Math.hypot(PS.input.joystick.dx, PS.input.joystick.dy) > 0.15) t.moved = true;
    if (Math.abs(camDelta.x) > 1 || Math.abs(camDelta.y) > 1) t.rotated = true;
    if (PS_GAME.illusion.objects.some((o) => o.def.type === "cameraAlignment" && o.solid)) t.illusionFound = true;
    if (PS_GAME.illusion.objects.some((o) => o.def.type === "falseWall")) t.wallPassed = t.wallPassed || t.illusionFound;
  }

  const result = PS_GAME.player.update(
    dt,
    PS.input.joystick.dx,
    PS.input.joystick.dy,
    PS_GAME.cameraCtrl.yawDeg,
    PS_GAME.illusion,
    PS_GAME.currentStage
  );

  PS_GAME.playerMesh.position.set(
    PS_GAME.player.position.x,
    PS_GAME.player.position.y + 0.45,
    PS_GAME.player.position.z
  );

  PS_GAME.cameraCtrl.update(PS_GAME.player.position);

  document.getElementById("hud-timer").textContent = PS.ui.formatTime(performance.now() - PS_GAME.startTime);

  // 출구 도달 체크
  const exit = PS_GAME.currentStage.exit;
  const distToExit = Math.hypot(
    PS_GAME.player.position.x - exit.x,
    PS_GAME.player.position.z - exit.z
  );
  if (distToExit < 0.6 && Math.abs(PS_GAME.player.position.y - exit.y) < 1.2) {
    PS_GAME.handleClear();
    return;
  }

  if (result.failed) {
    PS_GAME.handleFail(result.reason);
  }
};

PS_GAME.startStage = function (stageId) {
  const stage = PS.getStage(stageId);
  PS_GAME.currentStage = stage;
  PS.runtime.currentStageId = stageId;

  if (PS_GAME.stageGroup) PS_RENDER.disposeGroup(PS_GAME.three.scene, PS_GAME.stageGroup);
  if (PS_GAME.menuBgGroup) {
    PS_RENDER.disposeGroup(PS_GAME.three.scene, PS_GAME.menuBgGroup);
    PS_GAME.menuBgGroup = null;
  }

  PS_GAME.stageGroup = PS_RENDER.buildStageScene(PS_GAME.three.scene, stage, PS_GAME.illusion);
  PS_GAME.player.spawn(stage.playerStart);
  PS_GAME.cameraCtrl.reset();
  PS_GAME.playerMesh.visible = true;

  PS_GAME.attempts = 1;
  PS_GAME.startTime = performance.now();
  PS_GAME.running = true;

  document.getElementById("hud-stage-name").textContent = stage.name;
  document.getElementById("hud-hint").textContent = stage.hint || "";
  document.getElementById("hud").classList.remove("hidden");
  document.querySelectorAll(".screen").forEach((el) => el.classList.remove("active"));
  PS.ui.hideAllOverlays();
  PS.runtime.currentState = PS.STATE.PLAYING;
};

PS_GAME.restartStage = function () {
  PS_GAME.attempts += 1;
  PS_GAME.player.respawnAtCheckpoint();
  PS_GAME.startTime = performance.now();
  PS_GAME.running = true;
  PS.ui.hideAllOverlays();
};

PS_GAME.handleFail = function (reason) {
  PS_GAME.running = false;
  PS.runtime.currentState = PS.STATE.FAILED;
  const hintEl = document.getElementById("fail-hint");
  hintEl.textContent = reason === "trap" ? "함정을 밟았다." : "아, 저건 가짜였구나.";
  PS.ui.showOverlay("screen-fail");
  if (PS.settings.vibration && navigator.vibrate) navigator.vibrate(80);
};

PS_GAME.handleClear = async function () {
  PS_GAME.running = false;
  PS.runtime.currentState = PS.STATE.CLEAR;
  const elapsedMs = Math.round(performance.now() - PS_GAME.startTime);

  document.getElementById("clear-time").textContent = PS.ui.formatTime(elapsedMs);
  document.getElementById("clear-attempts").textContent = `${PS_GAME.attempts}회`;
  document.getElementById("clear-score").textContent = "계산 중...";
  document.getElementById("clear-stars").textContent = "";

  PS.ui.showOverlay("screen-clear");
  if (PS.settings.vibration && navigator.vibrate) navigator.vibrate([40, 40, 40]);

  if (PS.session.user) {
    const res = await PS.apiFetch(`/stages/${PS_GAME.currentStage.id}/complete`, {
      method: "POST",
      body: { elapsedMs, attempts: PS_GAME.attempts }
    });
    if (res.success) {
      document.getElementById("clear-score").textContent = res.data.score;
      const stars = res.data.isFirstClear && PS_GAME.attempts === 1 ? 3 : PS_GAME.attempts <= 3 ? 2 : 1;
      document.getElementById("clear-stars").textContent = "★".repeat(stars) + "☆".repeat(3 - stars);
      PS.session.user.totalScore = res.data.totalScore;
      PS.session.user.unlockedStage = res.data.unlockedStage;
      PS.ui.updateAuthLink();
    } else {
      document.getElementById("clear-score").textContent = "저장 실패";
    }
  } else {
    document.getElementById("clear-score").textContent = "- (로그인 필요)";
  }

  // 튜토리얼 진행 중이면 완료 처리
  if (PS.runtime.inTutorial) {
    PS_GAME.completeTutorial();
  }
};

PS_GAME.pauseGame = function () {
  if (!PS_GAME.running) return;
  PS_GAME.running = false;
  PS.runtime.pausedElapsed = performance.now() - PS_GAME.startTime;
  PS.ui.showOverlay("screen-pause");
};

PS_GAME.resumeGame = function () {
  PS_GAME.startTime = performance.now() - (PS.runtime.pausedElapsed || 0);
  PS_GAME.running = true;
  PS.ui.hideOverlay("screen-pause");
};

PS_GAME.exitToMenu = function () {
  PS_GAME.running = false;
  document.getElementById("hud").classList.add("hidden");
  PS_GAME.playerMesh.visible = false;
  if (PS_GAME.stageGroup) {
    PS_RENDER.disposeGroup(PS_GAME.three.scene, PS_GAME.stageGroup);
    PS_GAME.stageGroup = null;
  }
  if (!PS_GAME.menuBgGroup) {
    PS_GAME.menuBgGroup = PS_RENDER.buildMenuBackground(PS_GAME.three.scene);
  }
  PS_GAME.three.camera.position.set(4, 2, 8);
  PS_GAME.three.camera.lookAt(0, 0, -4);
  PS.ui.hideAllOverlays();
  PS.runtime.currentState = PS.STATE.MENU;
  PS.ui.showScreen("screen-menu");
};

// ---- 튜토리얼 ----
PS_GAME.startTutorial = function () {
  PS.runtime.inTutorial = true;
  PS_GAME.tutorialStep = 0;
  PS_GAME.startStage(1); // 튜토리얼은 Stage 1 지형을 재사용해 실제 조작을 익히게 한다
  document.getElementById("hud-hint").textContent = TUTORIAL_STEPS[0].text;
};

PS_GAME.completeTutorial = async function () {
  PS.runtime.inTutorial = false;
  if (PS.session.user) {
    await PS.apiFetch("/stages/tutorial-complete", { method: "POST" });
    PS.session.user.tutorialCompleted = true;
  }
};