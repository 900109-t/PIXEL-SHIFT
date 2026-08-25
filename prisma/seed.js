// 개발 환경 전용 seed 스크립트. Production에서는 절대 실행하지 않는다.
const { PrismaClient } = require("@prisma/client");
const bcrypt = require("bcryptjs");

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    console.log("Production 환경에서는 seed를 실행하지 않습니다.");
    return;
  }

  const demoUsers = [
    { username: "demo1", score: 5120, stage: 6 },
    { username: "demo2", score: 4900, stage: 5 },
    { username: "demo3", score: 3200, stage: 4 },
    { username: "demo4", score: 2100, stage: 3 },
    { username: "demo5", score: 950, stage: 2 }
  ];

  for (const d of demoUsers) {
    const passwordHash = await bcrypt.hash("demo1234", 10);
    const user = await prisma.user.upsert({
      where: { username: d.username },
      update: {},
      create: {
        username: d.username,
        passwordHash,
        totalScore: d.score,
        tutorialCompleted: true,
        unlockedStage: d.stage,
        lastLoginAt: new Date()
      }
    });

    for (let stageId = 1; stageId < d.stage; stageId++) {
      await prisma.stageScore.upsert({
        where: { userId_stageId: { userId: user.id, stageId } },
        update: {},
        create: {
          userId: user.id,
          stageId,
          bestTimeMs: 30000 + stageId * 1500,
          attempts: 1,
          score: Math.floor(d.score / d.stage)
        }
      });
    }
  }

  console.log("Seed 완료: demo1 ~ demo5 (비밀번호: demo1234)");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });