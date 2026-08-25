const express = require("express");
const bcrypt = require("bcryptjs");
const prisma = require("../db/prisma");
const { issueSession, clearSession, requireAuth } = require("../middleware/auth");
const { loginLimiter, registerLimiter } = require("../middleware/rateLimit");
const { isValidUsername, isValidPassword } = require("../utils/validation");

const router = express.Router();

router.post("/register", registerLimiter, async (req, res, next) => {
  try {
    const { username, password, passwordConfirm } = req.body || {};

    if (!isValidUsername(username)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_USERNAME", message: "닉네임은 3~16자의 영문/숫자/밑줄만 가능합니다." }
      });
    }
    if (!isValidPassword(password)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_PASSWORD", message: "비밀번호는 최소 8자 이상이어야 합니다." }
      });
    }
    if (password !== passwordConfirm) {
      return res.status(400).json({
        success: false,
        error: { code: "PASSWORD_MISMATCH", message: "비밀번호가 일치하지 않습니다." }
      });
    }

    const existing = await prisma.user.findUnique({ where: { username } });
    if (existing) {
      return res.status(409).json({
        success: false,
        error: { code: "USERNAME_TAKEN", message: "이미 사용 중인 닉네임입니다." }
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await prisma.user.create({
      data: { username, passwordHash, lastLoginAt: new Date() }
    });

    await issueSession(res, user);

    res.status(201).json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        totalScore: user.totalScore,
        tutorialCompleted: user.tutorialCompleted,
        unlockedStage: user.unlockedStage
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/login", loginLimiter, async (req, res, next) => {
  try {
    const { username, password } = req.body || {};

    if (typeof username !== "string" || typeof password !== "string") {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_REQUEST", message: "닉네임과 비밀번호를 입력해주세요." }
      });
    }

    const user = await prisma.user.findUnique({ where: { username } });
    if (!user) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "닉네임 또는 비밀번호가 올바르지 않습니다." }
      });
    }

    const match = await bcrypt.compare(password, user.passwordHash);
    if (!match) {
      return res.status(401).json({
        success: false,
        error: { code: "INVALID_CREDENTIALS", message: "닉네임 또는 비밀번호가 올바르지 않습니다." }
      });
    }

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLoginAt: new Date() }
    });

    await issueSession(res, user);

    res.json({
      success: true,
      data: {
        id: user.id,
        username: user.username,
        totalScore: user.totalScore,
        tutorialCompleted: user.tutorialCompleted,
        unlockedStage: user.unlockedStage
      }
    });
  } catch (err) {
    next(err);
  }
});

router.post("/logout", async (req, res, next) => {
  try {
    await clearSession(req, res);
    res.json({ success: true, data: {} });
  } catch (err) {
    next(err);
  }
});

router.get("/me", requireAuth, async (req, res) => {
  const { id, username, totalScore, tutorialCompleted, unlockedStage } = req.user;
  res.json({
    success: true,
    data: { id, username, totalScore, tutorialCompleted, unlockedStage }
  });
});

module.exports = router;