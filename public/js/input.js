window.PS = window.PS || {};

const PS_INPUT = {
  joystick: { active: false, pointerId: null, dx: 0, dy: 0 }, // dx,dy: -1..1
  camera: { active: false, pointerId: null, lastX: 0, lastY: 0, deltaX: 0, deltaY: 0 }
};
PS.input = PS_INPUT;

PS_INPUT.init = function () {
  const joyZone = document.getElementById("joystick-zone");
  const joyBase = document.getElementById("joystick-base");
  const joyStick = document.getElementById("joystick-stick");
  const camZone = document.getElementById("camera-zone");

  const JOY_RADIUS = 50;

  function setJoyBasePosition(x, y) {
    joyBase.style.left = `${x - JOY_RADIUS}px`;
    joyBase.style.top = `${y - JOY_RADIUS}px`;
    joyBase.style.display = "block";
  }

  function resetJoystick() {
    PS_INPUT.joystick.active = false;
    PS_INPUT.joystick.pointerId = null;
    PS_INPUT.joystick.dx = 0;
    PS_INPUT.joystick.dy = 0;
    joyBase.style.display = "none";
    joyStick.style.left = "28px";
    joyStick.style.top = "28px";
  }

  joyZone.addEventListener("pointerdown", (e) => {
    if (PS_INPUT.joystick.pointerId !== null) return; // 이미 조이스틱 조작 중이면 무시 (멀티터치 안전)
    e.preventDefault();
    try { joyZone.setPointerCapture(e.pointerId); } catch (err) {}
    PS_INPUT.joystick.active = true;
    PS_INPUT.joystick.pointerId = e.pointerId;
    const rect = joyZone.getBoundingClientRect();
    setJoyBasePosition(e.clientX - rect.left, e.clientY - rect.top);
    PS_INPUT.joystick.originX = e.clientX;
    PS_INPUT.joystick.originY = e.clientY;
  });

  joyZone.addEventListener("pointermove", (e) => {
    if (e.pointerId !== PS_INPUT.joystick.pointerId) return;
    e.preventDefault();
    let dx = e.clientX - PS_INPUT.joystick.originX;
    let dy = e.clientY - PS_INPUT.joystick.originY;
    const dist = Math.min(Math.hypot(dx, dy), JOY_RADIUS);
    const angle = Math.atan2(dy, dx);
    const clampedX = Math.cos(angle) * dist;
    const clampedY = Math.sin(angle) * dist;
    joyStick.style.left = `${28 + clampedX}px`;
    joyStick.style.top = `${28 + clampedY}px`;
    PS_INPUT.joystick.dx = clampedX / JOY_RADIUS;
    PS_INPUT.joystick.dy = clampedY / JOY_RADIUS;
  });

  function endJoystick(e) {
    if (e.pointerId !== PS_INPUT.joystick.pointerId) return;
    resetJoystick();
  }
  joyZone.addEventListener("pointerup", endJoystick);
  joyZone.addEventListener("pointercancel", endJoystick);
  joyZone.addEventListener("pointerleave", (e) => {
    // 조이스틱은 leave만으로 끊지 않음 (드래그 중 zone 경계를 벗어날 수 있음)
  });

  // ---- 카메라 드래그 ----
  camZone.addEventListener("pointerdown", (e) => {
    if (PS_INPUT.camera.pointerId !== null) return;
    if (PS_INPUT.joystick.pointerId === e.pointerId) return;
    try { camZone.setPointerCapture(e.pointerId); } catch (err) {}
    PS_INPUT.camera.active = true;
    PS_INPUT.camera.pointerId = e.pointerId;
    PS_INPUT.camera.lastX = e.clientX;
    PS_INPUT.camera.lastY = e.clientY;
  });

  camZone.addEventListener("pointermove", (e) => {
    if (e.pointerId !== PS_INPUT.camera.pointerId) return;
    const dx = e.clientX - PS_INPUT.camera.lastX;
    const dy = e.clientY - PS_INPUT.camera.lastY;
    PS_INPUT.camera.deltaX += dx;
    PS_INPUT.camera.deltaY += dy;
    PS_INPUT.camera.lastX = e.clientX;
    PS_INPUT.camera.lastY = e.clientY;
  });

  function endCamera(e) {
    if (e.pointerId !== PS_INPUT.camera.pointerId) return;
    PS_INPUT.camera.active = false;
    PS_INPUT.camera.pointerId = null;
  }
  camZone.addEventListener("pointerup", endCamera);
  camZone.addEventListener("pointercancel", endCamera);

  resetJoystick();
};

// game.js의 매 프레임에서 호출: 누적된 카메라 델타를 가져오고 초기화
PS_INPUT.consumeCameraDelta = function () {
  const d = { x: PS_INPUT.camera.deltaX, y: PS_INPUT.camera.deltaY };
  PS_INPUT.camera.deltaX = 0;
  PS_INPUT.camera.deltaY = 0;
  return d;
};