const express = require("express");
const prisma = require("../db/prisma");
const { requireAuth } = require("../middleware/auth");
const { friendRequestLimiter } = require("../middleware/rateLimit");

const router = express.Router();

// GET /api/friends - 내 친구 목록 (수락된 관계만)
router.get("/", requireAuth, async (req, res, next) => {
  try {
    const userId = req.user.id;
    const friendships = await prisma.friendship.findMany({
      where: {
        status: "ACCEPTED",
        OR: [{ requesterId: userId }, { receiverId: userId }]
      },
      include: {
        requester: { select: { id: true, username: true, totalScore: true, lastLoginAt: true } },
        receiver: { select: { id: true, username: true, totalScore: true, lastLoginAt: true } }
      },
      orderBy: { updatedAt: "desc" }
    });

    const friends = friendships.map((f) =>
      f.requesterId === userId ? f.receiver : f.requester
    );

    res.json({ success: true, data: { friends } });
  } catch (err) {
    next(err);
  }
});

// GET /api/friends/requests - 나에게 온 대기 중인 요청
router.get("/requests", requireAuth, async (req, res, next) => {
  try {
    const requests = await prisma.friendship.findMany({
      where: { receiverId: req.user.id, status: "PENDING" },
      include: { requester: { select: { id: true, username: true, totalScore: true } } },
      orderBy: { createdAt: "desc" }
    });

    res.json({
      success: true,
      data: {
        requests: requests.map((r) => ({
          id: r.id,
          user: r.requester,
          createdAt: r.createdAt
        }))
      }
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/friends/request { receiverUsername }
router.post("/request", requireAuth, friendRequestLimiter, async (req, res, next) => {
  try {
    const { receiverUsername } = req.body || {};
    if (typeof receiverUsername !== "string" || !receiverUsername.trim()) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "닉네임을 입력해주세요." }
      });
    }

    const receiver = await prisma.user.findUnique({ where: { username: receiverUsername } });
    if (!receiver) {
      return res.status(404).json({
        success: false,
        error: { code: "USER_NOT_FOUND", message: "존재하지 않는 사용자입니다." }
      });
    }

    if (receiver.id === req.user.id) {
      return res.status(400).json({
        success: false,
        error: { code: "SELF_REQUEST", message: "자기 자신에게 친구 요청을 보낼 수 없습니다." }
      });
    }

    const existing = await prisma.friendship.findFirst({
      where: {
        OR: [
          { requesterId: req.user.id, receiverId: receiver.id },
          { requesterId: receiver.id, receiverId: req.user.id }
        ]
      }
    });

    if (existing) {
      if (existing.status === "ACCEPTED") {
        return res.status(409).json({
          success: false,
          error: { code: "ALREADY_FRIENDS", message: "이미 친구입니다." }
        });
      }
      if (existing.status === "PENDING") {
        return res.status(409).json({
          success: false,
          error: { code: "REQUEST_EXISTS", message: "이미 친구 요청이 존재합니다." }
        });
      }
      // REJECTED였던 경우 재요청 허용: 상태를 PENDING으로 갱신
      const updated = await prisma.friendship.update({
        where: { id: existing.id },
        data: {
          status: "PENDING",
          requesterId: req.user.id,
          receiverId: receiver.id
        }
      });
      return res.status(201).json({ success: true, data: { requestId: updated.id } });
    }

    const friendship = await prisma.friendship.create({
      data: { requesterId: req.user.id, receiverId: receiver.id, status: "PENDING" }
    });

    res.status(201).json({ success: true, data: { requestId: friendship.id } });
  } catch (err) {
    if (err.code === "P2002") {
      return res.status(409).json({
        success: false,
        error: { code: "REQUEST_EXISTS", message: "이미 친구 요청이 존재합니다." }
      });
    }
    next(err);
  }
});

router.post("/:id/accept", requireAuth, async (req, res, next) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });

    if (!friendship || friendship.receiverId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "요청을 찾을 수 없습니다." }
      });
    }
    if (friendship.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STATE", message: "이미 처리된 요청입니다." }
      });
    }

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: "ACCEPTED" }
    });

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

router.post("/:id/reject", requireAuth, async (req, res, next) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });

    if (!friendship || friendship.receiverId !== req.user.id) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "요청을 찾을 수 없습니다." }
      });
    }
    if (friendship.status !== "PENDING") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STATE", message: "이미 처리된 요청입니다." }
      });
    }

    await prisma.friendship.update({
      where: { id: friendship.id },
      data: { status: "REJECTED" }
    });

    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

router.delete("/:id", requireAuth, async (req, res, next) => {
  try {
    const friendship = await prisma.friendship.findUnique({ where: { id: req.params.id } });

    if (
      !friendship ||
      (friendship.requesterId !== req.user.id && friendship.receiverId !== req.user.id)
    ) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "친구 관계를 찾을 수 없습니다." }
      });
    }

    await prisma.friendship.delete({ where: { id: friendship.id } });
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

module.exports = router;