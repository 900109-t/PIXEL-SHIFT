const express = require("express");
const prisma = require("../db/prisma");
const { requireAuth } = require("../middleware/auth");
const { scoreSubmitLimiter } = require("../middleware/rateLimit");
const { isValidStageId, isPlausibleCompletion } = require("../utils/validation");
const { TOTAL_STAGES, minTimeFor } = require("../utils/stageConfig");

const router = express.Router();

const BASE_SCORE = 500;
const PERFECT_BONUS = 200; // 1회 시도로 클리어
const FIRST_CLEAR_BONUS = 300;

// 시간 보너스: 빠를수록 높음. 목표 시간(targetMs) 대비 남은 비율로 계산, 0~300점.
function timeBonus(elapsedMs, minTimeMs) {
  const targetMs = minTimeMs * 4; // 여유 있는 기준 시간
  if (elapsedMs >= targetMs) return 0;
  const ratio = 1 - elapsedMs / targetMs;
  return Math.round(ratio * 300);
}

// 실패 적음 보너스: 시도 횟수가 적을수록 높음, 0~150점.
function fewAttemptsBonus(attempts) {
  if (attempts <= 1) return 150;
  if (attempts <= 3) return 90;
  if (attempts <= 6) return 40;
  return 0;
}

function calculateScore({ elapsedMs, attempts, minTimeMs, isFirstClear }) {
  let score = BASE_SCORE;
  score += timeBonus(elapsedMs, minTimeMs);
  score += fewAttemptsBonus(attempts);
  if (isFirstClear) score += FIRST_CLEAR_BONUS;
  if (attempts === 1) score += PERFECT_BONUS;
  return score;
}

// POST /api/stages/:stageId/complete { elapsedMs, attempts }
router.post("/:stageId/complete", requireAuth, scoreSubmitLimiter, async (req, res, next) => {
  try {
    if (!isValidStageId(req.params.stageId, TOTAL_STAGES)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STAGE", message: "존재하지 않는 스테이지입니다." }
      });
    }
    const stageId = Number(req.params.stageId);
    const { elapsedMs, attempts } = req.body || {};

    const minTimeMs = minTimeFor(stageId);
    if (!isPlausibleCompletion({ elapsedMs, attempts }, minTimeMs)) {
      return res.status(400).json({
        success: false,
        error: { code: "IMPLAUSIBLE_RESULT", message: "제출된 기록이 비정상적입니다." }
      });
    }

    const existing = await prisma.stageScore.findUnique({
      where: { userId_stageId: { userId: req.user.id, stageId } }
    });

    const isFirstClear = !existing;
    const newScore = calculateScore({ elapsedMs, attempts, minTimeMs, isFirstClear });

    let stageScoreRecord;
    let scoreDelta = 0;

    if (!existing) {
      stageScoreRecord = await prisma.stageScore.create({
        data: { userId: req.user.id, stageId, bestTimeMs: elapsedMs, attempts, score: newScore }
      });
      scoreDelta = newScore;
    } else {
      const improved = newScore > existing.score;
      stageScoreRecord = await prisma.stageScore.update({
        where: { id: existing.id },
        data: {
          bestTimeMs: Math.min(existing.bestTimeMs, elapsedMs),
          attempts: existing.attempts + attempts,
          score: improved ? newScore : existing.score
        }
      });
      scoreDelta = improved ? newScore - existing.score : 0;
    }

    const nextUnlocked = Math.max(req.user.unlockedStage, Math.min(stageId + 1, TOTAL_STAGES));

    const updatedUser = await prisma.user.update({
      where: { id: req.user.id },
      data: {
        totalScore: { increment: scoreDelta },
        unlockedStage: nextUnlocked
      }
    });

    res.json({
      success: true,
      data: {
        stageId,
        score: stageScoreRecord.score,
        bestTimeMs: stageScoreRecord.bestTimeMs,
        attempts: stageScoreRecord.attempts,
        isFirstClear,
        totalScore: updatedUser.totalScore,
        unlockedStage: updatedUser.unlockedStage
      }
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/stages/:stageId/score - 내 최고 기록
router.get("/:stageId/score", requireAuth, async (req, res, next) => {
  try {
    if (!isValidStageId(req.params.stageId, TOTAL_STAGES)) {
      return res.status(400).json({
        success: false,
        error: { code: "INVALID_STAGE", message: "존재하지 않는 스테이지입니다." }
      });
    }
    const stageId = Number(req.params.stageId);

    const record = await prisma.stageScore.findUnique({
      where: { userId_stageId: { userId: req.user.id, stageId } }
    });

    res.json({ success: true, data: { record: record || null } });
  } catch (err) {
    next(err);
  }
});

// POST /api/stages/tutorial-complete
router.post("/tutorial-complete", requireAuth, async (req, res, next) => {
  try {
    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: { tutorialCompleted: true }
    });
    res.json({ success: true, data: { tutorialCompleted: updated.tutorialCompleted } });
  } catch (err) {
    next(err);
  }
});

module.exports = router;