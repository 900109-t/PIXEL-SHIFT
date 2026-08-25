window.PS = window.PS || {};

// 타일 타입:
//  floor        - 항상 밟을 수 있는 일반 발판
//  wall         - 항상 막히는 진짜 벽
//  falseWall    - 벽처럼 보이지만 통과 가능 (illusion: falseWall)
//  bridge       - 카메라 각도가 맞을 때만 밟을 수 있는 발판 (illusion: cameraAlignment)
//  hidden       - 항상 밟을 수 있지만 가까이 가야 잘 보이는 발판 (illusion: hiddenPath)
//  trap         - 밟으면 실패 처리되는 함정
//  checkpoint   - 밟으면 리스폰 지점 갱신
//  deco         - 순수 배경 장식 (원근 착시 / 불가능한 계단 연출용, 충돌 없음)

function tile(x, y, z, type, extra) {
  return Object.assign({ x, y, z, w: 1, h: 1, d: 1, type }, extra || {});
}

PS.STAGES = [
  {
    id: 1,
    name: "STAGE 1",
    hint: "조이스틱으로 이동해 출구를 찾아라.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -6 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"), tile(0, 0, -2, "floor"),
      tile(0, 0, -3, "floor"), tile(0, 0, -4, "floor"), tile(0, 0, -5, "floor"),
      tile(0, 0, -6, "floor")
    ]
  },
  {
    id: 2,
    name: "STAGE 2",
    hint: "발판 사이의 좁은 길을 조심스럽게 지나가라.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 2, y: 1, z: -8 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"), tile(1, 0, -2, "floor"),
      tile(1, 0, -3, "floor"), tile(2, 0, -4, "floor"), tile(2, 0, -5, "floor"),
      tile(2, 0, -6, "floor"), tile(2, 0, -7, "floor"), tile(2, 0, -8, "floor"),
      tile(0, 0, -3, "trap"), tile(1, 0, -5, "trap")
    ]
  },
  {
    id: 3,
    name: "STAGE 3",
    hint: "체크포인트를 밟으면 그 자리에서 다시 시작할 수 있다.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -10 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"), tile(0, 0, -2, "floor"),
      tile(0, 0, -3, "checkpoint"), tile(0, 0, -4, "floor"), tile(0, 0, -5, "floor"),
      tile(1, 0, -5, "trap"), tile(0, 0, -6, "floor"), tile(0, 0, -7, "checkpoint"),
      tile(0, 0, -8, "floor"), tile(0, 0, -9, "floor"), tile(0, 0, -10, "floor")
    ]
  },
  {
    id: 4,
    name: "STAGE 4",
    hint: "오른쪽을 드래그해 카메라를 돌려라. 끊어진 두 발판이 이어져 보이는 각도가 있다.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -6 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"), tile(0, 0, -2, "floor"),
      tile(0, 0, -3, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 0, tolerance: 14 } }),
      tile(0, 0, -4, "floor"), tile(0, 0, -5, "floor"), tile(0, 0, -6, "floor")
    ]
  },
  {
    id: 5,
    name: "STAGE 5",
    hint: "각도를 90도 정도 돌려서 다리를 찾아라.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 3, y: 1, z: -5 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"), tile(1, 0, -1, "floor"),
      tile(2, 0, -1, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 90, tolerance: 14 } }),
      tile(3, 0, -1, "floor"), tile(3, 0, -2, "floor"), tile(3, 0, -3, "floor"),
      tile(3, 0, -4, "floor"), tile(3, 0, -5, "floor")
    ]
  },
  {
    id: 6,
    name: "STAGE 6",
    hint: "두 개의 카메라 다리를 연속으로 통과해야 한다.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -8 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"),
      tile(0, 0, -2, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 0, tolerance: 12 } }),
      tile(0, 0, -3, "floor"), tile(0, 0, -4, "floor"),
      tile(0, 0, -5, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 180, tolerance: 12 } }),
      tile(0, 0, -6, "floor"), tile(0, 0, -7, "floor"), tile(0, 0, -8, "floor")
    ]
  },
  {
    id: 7,
    name: "STAGE 7",
    hint: "앞을 가로막은 벽 중 하나는 가짜다. 자세히 보면 미세하게 다르다.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -6 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"), tile(0, 0, -2, "floor"),
      tile(0, 0, -3, "floor"), tile(0, 0, -4, "floor"), tile(0, 0, -5, "floor"),
      tile(0, 0, -6, "floor")
    ],
    walls: [
      tile(-1, 0, -3, "wall"),
      tile(0, 0, -3, "falseWall", { illusion: { type: "falseWall" } }),
      tile(1, 0, -3, "wall")
    ]
  },
  {
    id: 8,
    name: "STAGE 8",
    hint: "진짜 벽과 가짜 벽이 나란히 있다. 부딪혀서 확인하지 말고 잘 관찰하라.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -8 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"), tile(0, 0, -2, "floor"),
      tile(0, 0, -3, "floor"), tile(0, 0, -4, "floor"), tile(0, 0, -5, "floor"),
      tile(0, 0, -6, "floor"), tile(0, 0, -7, "floor"), tile(0, 0, -8, "floor")
    ],
    walls: [
      tile(0, 0, -2, "falseWall", { illusion: { type: "falseWall" } }),
      tile(0, 0, -5, "wall"),
      tile(1, 0, -5, "falseWall", { illusion: { type: "falseWall" } })
    ]
  },
  {
    id: 9,
    name: "STAGE 9",
    hint: "가짜 벽과 카메라 다리를 함께 사용해야 한다.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -8 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"),
      tile(0, 0, -2, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 45, tolerance: 12 } }),
      tile(0, 0, -3, "floor"), tile(0, 0, -4, "floor"), tile(0, 0, -5, "floor"),
      tile(0, 0, -6, "floor"), tile(0, 0, -7, "floor"), tile(0, 0, -8, "floor")
    ],
    walls: [
      tile(0, 0, -5, "falseWall", { illusion: { type: "falseWall" } })
    ]
  },
  {
    id: 10,
    name: "STAGE 10",
    hint: "발판이 거의 보이지 않는다. 플레이어에게 가까이 다가가면 서서히 드러난다.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -7 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"),
      tile(0, 0, -2, "hidden", { illusion: { type: "hiddenPath", revealRadius: 3 } }),
      tile(0, 0, -3, "hidden", { illusion: { type: "hiddenPath", revealRadius: 3 } }),
      tile(0, 0, -4, "hidden", { illusion: { type: "hiddenPath", revealRadius: 3 } }),
      tile(0, 0, -5, "floor"), tile(0, 0, -6, "floor"), tile(0, 0, -7, "floor")
    ]
  },
  {
    id: 11,
    name: "STAGE 11",
    hint: "숨겨진 길, 카메라 다리, 가짜 벽. 세 가지 착시를 모두 사용하라.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 0, y: 1, z: -10 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"),
      tile(0, 0, -2, "hidden", { illusion: { type: "hiddenPath", revealRadius: 3 } }),
      tile(0, 0, -3, "floor"),
      tile(0, 0, -4, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 315, tolerance: 12 } }),
      tile(0, 0, -5, "floor"), tile(0, 0, -6, "floor"), tile(0, 0, -7, "floor"),
      tile(0, 0, -8, "floor"), tile(0, 0, -9, "floor"), tile(0, 0, -10, "floor")
    ],
    walls: [
      tile(0, 0, -7, "falseWall", { illusion: { type: "falseWall" } })
    ]
  },
  {
    id: 12,
    name: "STAGE 12 - FINAL",
    hint: "지금까지 배운 모든 착시가 이 마지막 공간에 있다.",
    playerStart: { x: 0, y: 1, z: 0 },
    exit: { x: 1, y: 1, z: -12 },
    tiles: [
      tile(0, 0, 0, "floor"), tile(0, 0, -1, "floor"),
      tile(0, 0, -2, "hidden", { illusion: { type: "hiddenPath", revealRadius: 3 } }),
      tile(0, 0, -3, "floor"),
      tile(0, 0, -4, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 0, tolerance: 10 } }),
      tile(0, 0, -5, "floor"), tile(1, 0, -5, "floor"),
      tile(1, 0, -6, "bridge", { illusion: { type: "cameraAlignment", targetAngle: 200, tolerance: 10 } }),
      tile(1, 0, -7, "floor"), tile(1, 0, -8, "floor"),
      tile(1, 0, -9, "hidden", { illusion: { type: "hiddenPath", revealRadius: 3 } }),
      tile(1, 0, -10, "floor"), tile(1, 0, -11, "floor"), tile(1, 0, -12, "floor")
    ],
    walls: [
      tile(1, 0, -3, "wall"),
      tile(0, 0, -7, "falseWall", { illusion: { type: "falseWall" } }),
      tile(1, 0, -3.5, "falseWall", { illusion: { type: "falseWall" } })
    ]
  }
];

PS.TOTAL_STAGES = PS.STAGES.length;

PS.getStage = function (id) {
  return PS.STAGES.find((s) => s.id === id) || PS.STAGES[0];
};