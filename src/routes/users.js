const express = require("express");
const prisma = require("../db/prisma");
const { requireAuth } = require("../middleware/auth");
const { searchLimiter } = require("../middleware/rateLimit");
const { isValidUsername } = require("../utils/validation");

const router = express.Router();

// GET /api/users/search?q=
router.get("/search", requireAuth, searchLimiter, async (req, res, next) => {
  try {
    const q = (req.query.q || "").toString().trim();

    if (q.length < 2) {
      return res.json({ success: true, data: { users: [] } });
    }

    const users = await prisma.user.findMany({
      where: {
        username: { contains: q, mode: "insensitive" },
        NOT: { id: req.user.id }
      },
      select: { id: true, username: true, totalScore: true },
      orderBy: { totalScore: "desc" },
      take: 20
    });

    res.json({ success: true, data: { users } });
  } catch (err) {
    next(err);
  }
});

router.get("/:id", requireAuth, async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: { id: true, username: true, totalScore: true, createdAt: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        error: { code: "NOT_FOUND", message: "존재하지 않는 사용자입니다." }
      });
    }

    res.json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

module.exports = router;