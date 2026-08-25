window.PS = window.PS || {};

// 착시 타입 정의. 각 타입은 실제 게임플레이(충돌/통과 여부)에 영향을 준다.
PS.IllusionType = {
  CAMERA_ALIGNMENT: "cameraAlignment", // 특정 카메라 각도 범위에서만 두 블록 사이의 다리가 활성화됨
  FALSE_WALL: "falseWall",             // 벽처럼 보이지만 통과 가능
  HIDDEN_PATH: "hiddenPath",           // 평소엔 거의 안 보이지만 항상 밟을 수 있는 길
  FORCED_PERSPECTIVE: "forcedPerspective", // 배경 장식용 원근 착시 (통행에 직접 관여하지 않음)
  IMPOSSIBLE_STAIRCASE: "impossibleStaircase" // 순환 구조의 계단 (텔레포트로 무한히 도는 것처럼 보이게 함)
};

function normalizeAngleDeg(deg) {
  let d = deg % 360;
  if (d < 0) d += 360;
  return d;
}

function angleDiff(a, b) {
  const d = Math.abs(normalizeAngleDeg(a) - normalizeAngleDeg(b));
  return Math.min(d, 360 - d);
}

// 착시 시스템: 매 프레임 camera yaw / player 위치를 기준으로 각 IllusionObject의 활성 상태를 갱신
class IllusionSystem {
  constructor() {
    this.objects = []; // { mesh, def, solid, revealed }
  }

  reset() {
    this.objects = [];
  }

  register(entry) {
    this.objects.push(entry);
  }

  // cameraYawDeg: 현재 카메라 수평 회전각(도)
  update(cameraYawDeg, playerPosition) {
    for (const obj of this.objects) {
      const def = obj.def;
      if (def.type === PS.IllusionType.CAMERA_ALIGNMENT) {
        const diff = angleDiff(cameraYawDeg, def.targetAngle);
        const active = diff <= (def.tolerance || 12);
        obj.solid = active;
        this.applyVisual(obj, active ? 1.0 : 0.25, active ? 0x4dd0ff : 0x2a2f3d);
      } else if (def.type === PS.IllusionType.FALSE_WALL) {
        obj.solid = false; // 항상 통과 가능
        this.applyVisual(obj, 0.85, 0xff5566, true);
      } else if (def.type === PS.IllusionType.HIDDEN_PATH) {
        const dist = playerPosition
          ? Math.hypot(playerPosition.x - obj.mesh.position.x, playerPosition.z - obj.mesh.position.z)
          : 999;
        const revealed = dist < (def.revealRadius || 3.5);
        obj.solid = true; // 항상 밟을 수 있음
        this.applyVisual(obj, revealed ? 0.9 : 0.12, 0x4dff9e);
      } else {
        obj.solid = !!def.solid;
      }
    }
  }

  applyVisual(obj, opacity, hintColorHex) {
    if (!obj.mesh || !obj.mesh.material) return;
    obj.mesh.material.opacity = opacity;
    obj.mesh.material.transparent = true;
    if (obj.hintEdge) {
      obj.hintEdge.material.color.setHex(hintColorHex);
      obj.hintEdge.material.opacity = Math.max(0.08, opacity * 0.3);
    }
  }

  getSolidBoxes() {
    return this.objects.filter((o) => o.solid).map((o) => o.box);
  }
}

PS.IllusionSystem = IllusionSystem;
PS.illusionUtil = { normalizeAngleDeg, angleDiff };