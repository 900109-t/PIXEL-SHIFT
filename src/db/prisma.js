const { PrismaClient } = require("@prisma/client");

// 개발 환경 hot-reload 시 커넥션이 중복 생성되는 것을 방지
const globalForPrisma = globalThis;

const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"]
  });

if (process.env.NODE_ENV === "development") {
  globalForPrisma.prisma = prisma;
}

module.exports = prisma;