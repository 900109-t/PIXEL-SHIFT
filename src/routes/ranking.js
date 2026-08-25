const express = require("express");
const prisma = require("../db/prisma");
const { requireAuth } = require("../middleware/auth");
const { isValidStageId } = require("../utils/validation");
const { TOTAL_STAGES } = require("../utils/stageConfig");

const router = express.Router();
const PAGE_SIZE = 20;

function parsePage(req) {
  const page = parseInt(req.query.page, 10);
  return Number.isInteger(page) && page > 0 ? page : 1;
}

// GET /api/ranking/global?page=1
router.get("/global", requireAuth, async (req, res, next) => {
  try {
    const page = parsePage(req);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        orderBy: { totalScore: "desc" },
        select: { id: true, username: true, totalScore: true },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE
      }),
      prisma.user.count()
    ]);

    res.json({
      success: true,
      data: {
        entries: users.map((u, i) => ({
          rank: (page - 1) * PAGE_SIZE + i + 1,
          username: u.username,
          score: u.totalScore
        })),
        page,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE))
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ranking/weekly?page=1 - 최근 7일간 획득한 점수 합산 기준
router.get("/weekly", requireAuth, async (req, res, next) => {
  try {
    const page = parsePage(req);
    const since = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

    const grouped = await prisma.stageScore.groupBy({
      by: ["userId"],
      where: { updatedAt: { gte: since } },
      _sum: { score: true },
      orderBy: { _sum: { score: "desc" } },
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE
    });

    const totalGrouped = await prisma.stageScore.groupBy({
      by: ["userId"],
      where: { updatedAt: { gte: since } }
    });

    const userIds = grouped.map((g) => g.userId);
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: { id: true, username: true }
    });
    const userMap = new Map(users.map((u) => [u.id, u.username]));

    res.json({
      success: true,
      data: {
        entries: grouped.map((g, i) => ({
          rank: (page - 1) * PAGE_SIZE + i + 1,
          username: userMap.get(g.userId) || "알 수 없음",
          score: g._sum.score || 0
        })),
        page,
        totalPages: Math.max(1, Math.ceil(totalGrouped.length / PAGE_SIZE))
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ranking/stage/:stageId?page=1
router.get("/stage/:stageId", requireAuth, async (req, res, next) => {
  try {
    if (!isValidStageId(req.params.stageId, TOTAL_STAGES)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STAGE", message: "존재하지 않는 스테이지입니다." }
      });
    }
    const stageId = Number(req.params.stageId);
    const page = parsePage(req);

    const [scores, total] = await Promise.all([
      prisma.stageScore.findMany({
        where: { stageId },
        orderBy: [{ score: "desc" }, { bestTimeMs: "asc" }],
        include: { user: { select: { username: true } } },
        skip: (page - 1) * PAGE_SIZE,
        take: PAGE_SIZE
      }),
      prisma.stageScore.count({ where: { stageId } })
    ]);

    res.json({
      success: true,
      data: {
        entries: scores.map((s, i) => ({
          rank: (page - 1) * PAGE_SIZE + i + 1,
          username: s.user.username,
          score: s.score,
          bestTimeMs: s.bestTimeMs
        })),
        page,
        totalPages: Math.max(1, Math.ceil(total / PAGE_SIZE))
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ranking/friends - 나와 내 친구만 비교
router.get("/friends", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const friendships = await prisma.friendship.findMany({
      where: { status: "ACCEPTED", OR: [{ requesterId: userId }, { receiverId: userId }] },
      include: {
        requester: { select: { id: true, username: true, totalScore: true } },
        receiver: { select: { id: true, username: true, totalScore: true } }
      }
    });

    const others = friendships.map((f) => (f.requesterId === userId ? f.receiver : f.requester));
    const all = [...others, { id: userId, username: req.user.username, totalScore: req.user.totalScore }];
    all.sort((a, b) => b.totalScore - a.totalScore);

    res.json({
      success: true,
      data: {
        entries: all.map((u, i) => ({
          rank: i + 1,
          username: u.username,
          score: u.totalScore,
          isMe: u.id === userId
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/ranking/me - 내 전체 랭킹 순위
router.get("/me", requireAuth, async (req, res, next) => {
  try {
    const higherCount = await prisma.user.count({
      where: { totalScore: { gt: req.user.totalScore } }
    });

    res.json({
      success: true,
      data: { rank: higherCount + 1, score: req.user.totalScore, username: req.user.username }
    });
  } catch (err) {
    next(err);
  }
});

module.exports = router;