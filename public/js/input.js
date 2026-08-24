const JOYSTICK_RADIUS = 64; // px, #joystick-zone 크기의 절반

export class InputController {
  constructor(cameraRig) {
    this.cameraRig = cameraRig;
    this.moveVec = { x: 0, y: 0 };

    this.joystickZone = document.getElementById("joystick-zone");
    this.joystickStick = document.getElementById("joystick-stick");
    this.camZone = document.getElementById("cam-zone");
    this.angleIndicator = document.getElementById("angle-indicator");

    this.joystickPointerId = null;
    this.camPointerId = null;

    this._bindJoystick();
    this._bindCamera();
  }

  _bindJoystick() {
    const zone = this.joystickZone;

    const start = (e) => {
      if (this.joystickPointerId !== null) return;
      this.joystickPointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      updateStick(e);
    };

    const updateStick = (e) => {
      const rect = zone.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      let dx = e.clientX - cx;
      let dy = e.clientY - cy;
      const dist = Math.min(Math.hypot(dx, dy), JOYSTICK_RADIUS);
      const angle = Math.atan2(dy, dx);
      const clampedX = Math.cos(angle) * dist;
      const clampedY = Math.sin(angle) * dist;

      this.joystickStick.style.transform = `translate(calc(-50% + ${clampedX}px), calc(-50% + ${clampedY}px))`;

      this.moveVec.x = clampedX / JOYSTICK_RADIUS;
      this.moveVec.y = clampedY / JOYSTICK_RADIUS;
    };

    const move = (e) => {
      if (e.pointerId !== this.joystickPointerId) return;
      updateStick(e);
    };

    const end = (e) => {
      if (e.pointerId !== this.joystickPointerId) return;
      this.joystickPointerId = null;
      this.moveVec.x = 0;
      this.moveVec.y = 0;
      this.joystickStick.style.transform = `translate(-50%, -50%)`;
    };

    zone.addEventListener("pointerdown", start);
    zone.addEventListener("pointermove", move);
    zone.addEventListener("pointerup", end);
    zone.addEventListener("pointercancel", end);
  }

  _bindCamera() {
    const zone = this.camZone;

    const start = (e) => {
      if (this.camPointerId !== null) return;
      this.camPointerId = e.pointerId;
      zone.setPointerCapture(e.pointerId);
      this.cameraRig.onDragStart(e.clientX);
    };

    const move = (e) => {
      if (e.pointerId !== this.camPointerId) return;
      this.cameraRig.onDragMove(e.clientX);
      if (this.angleIndicator) {
        this.angleIndicator.textContent = `${this.cameraRig.yawDegrees}°`;
      }
    };

    const end = (e) => {
      if (e.pointerId !== this.camPointerId) return;
      this.camPointerId = null;
      this.cameraRig.onDragEnd();
      if (this.angleIndicator) {
        this.angleIndicator.textContent = `${this.cameraRig.yawDegrees}°`;
      }
    };

    zone.addEventListener("pointerdown", start);
    zone.addEventListener("pointermove", move);
    zone.addEventListener("pointerup", end);
    zone.addEventListener("pointercancel", end);
  }
}
