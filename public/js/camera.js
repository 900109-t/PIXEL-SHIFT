import * as THREE from "three";

const DISTANCE = 6.5;
const HEIGHT = 5.2;
const DRAG_SENSITIVITY = 0.012;
const MAX_YAW_SPEED = 0.14; // 프레임당 최대 회전(과속 방지)
const SNAP_STEP = Math.PI / 4; // 45도 단위 스냅 후보

export class CameraRig {
  constructor(camera) {
    this.camera = camera;
    this.yaw = 0;
    this.targetYaw = 0;
    this.isDragging = false;
    this.lastX = 0;
    this.snapTimer = null;
  }

  onDragStart(x) {
    this.isDragging = true;
    this.lastX = x;
    if (this.snapTimer) clearTimeout(this.snapTimer);
  }

  onDragMove(x) {
    if (!this.isDragging) return;
    const dx = x - this.lastX;
    this.lastX = x;
    let delta = dx * DRAG_SENSITIVITY;
    delta = THREE.MathUtils.clamp(delta, -MAX_YAW_SPEED, MAX_YAW_SPEED);
    this.targetYaw -= delta;
  }

  onDragEnd() {
    this.isDragging = false;
    // 놓으면 가장 가까운 45도 각도로 부드럽게 스냅
    const snapped = Math.round(this.targetYaw / SNAP_STEP) * SNAP_STEP;
    this.targetYaw = snapped;
  }

  update(dt, playerPosition) {
    this.yaw = lerpAngle(this.yaw, this.targetYaw, Math.min(1, dt * 6));

    const offsetX = Math.sin(this.yaw) * DISTANCE;
    const offsetZ = Math.cos(this.yaw) * DISTANCE;

    const desired = new THREE.Vector3(
      playerPosition.x + offsetX,
      playerPosition.y + HEIGHT,
      playerPosition.z + offsetZ
    );

    this.camera.position.lerp(desired, Math.min(1, dt * 8));
    this.camera.lookAt(
      playerPosition.x,
      playerPosition.y + 0.6,
      playerPosition.z
    );
  }

  get yawDegrees() {
    let deg = THREE.MathUtils.radToDeg(this.yaw) % 360;
    if (deg < 0) deg += 360;
    return Math.round(deg);
  }
}

function lerpAngle(a, b, t) {
  let diff = ((b - a + Math.PI) % (Math.PI * 2)) - Math.PI;
  if (diff < -Math.PI) diff += Math.PI * 2;
  return a + diff * t;
}
