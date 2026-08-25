window.PS = window.PS || {};

class CameraController {
  constructor(camera) {
    this.camera = camera;
    this.yawDeg = 0; // 0 = player 뒤쪽 기준
    this.pitchDeg = 28;
    this.distance = 7;
    this.target = new THREE.Vector3(0, 1, 0);
  }

  reset() {
    this.yawDeg = 0;
    this.pitchDeg = 28;
  }

  applyDrag(deltaX, deltaY) {
    const sensitivity = 0.15 + (PS.settings.sensitivity / 10) * 0.25;
    this.yawDeg -= deltaX * sensitivity;
    this.pitchDeg -= deltaY * sensitivity;
    this.pitchDeg = Math.max(8, Math.min(70, this.pitchDeg));
  }

  update(playerPosition) {
    this.target.set(playerPosition.x, playerPosition.y + 0.6, playerPosition.z);

    const yawRad = THREE.MathUtils.degToRad(this.yawDeg);
    const pitchRad = THREE.MathUtils.degToRad(this.pitchDeg);

    const horizontalDist = this.distance * Math.cos(pitchRad);
    const height = this.distance * Math.sin(pitchRad);

    const offsetX = Math.sin(yawRad) * horizontalDist;
    const offsetZ = Math.cos(yawRad) * horizontalDist;

    this.camera.position.set(
      this.target.x + offsetX,
      this.target.y + height,
      this.target.z + offsetZ
    );
    this.camera.lookAt(this.target);
  }

  // 카메라가 실제로 바라보는 수평 각도 (착시 시스템에서 사용)
  getYawForIllusion() {
    return PS.illusionUtil.normalizeAngleDeg(this.yawDeg);
  }
}

PS.CameraController = CameraController;