import express from 'express';
import prisma from '../db.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// GET leaderboard positions
router.get('/', authenticateToken, async (req, res) => {
  const { categoryId, timeframe } = req.query; // timeframe = overall | monthly | weekly

  try {
    // 1. Build date filter for attempts
    const attemptFilters = {
      NOT: { completedAt: null }
    };

    if (timeframe === 'weekly') {
      const oneWeekAgo = new Date();
      oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
      attemptFilters.completedAt = {
        gte: oneWeekAgo
      };
    } else if (timeframe === 'monthly') {
      const oneMonthAgo = new Date();
      oneMonthAgo.setDate(oneMonthAgo.getDate() - 30);
      attemptFilters.completedAt = {
        gte: oneMonthAgo
      };
    }

    // 2. Build category filter for quizzes
    if (categoryId) {
      attemptFilters.quiz = {
        categoryId: categoryId
      };
    }

    // 3. Fetch all completed attempts satisfying filters
    const attempts = await prisma.attempt.findMany({
      where: attemptFilters,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true
          }
        }
      }
    });

    // 4. Aggregate data per student in Javascript
    const studentAggregates = {};

    attempts.forEach(att => {
      const user = att.user;
      if (!user) return;

      if (!studentAggregates[user.id]) {
        studentAggregates[user.id] = {
          userId: user.id,
          name: user.name,
          email: user.email,
          totalScorePercentage: 0,
          highestScore: 0,
          completedCount: 0,
          passedCount: 0
        };
      }

      const stud = studentAggregates[user.id];
      stud.completedCount++;
      stud.totalScorePercentage += att.percentage;
      if (att.percentage > stud.highestScore) {
        stud.highestScore = att.percentage;
      }
      if (att.status === 'PASSED') {
        stud.passedCount++;
      }
    });

    // 5. Transform map to sorted list
    const leaderboardList = Object.values(studentAggregates).map(student => {
      const avgScore = student.completedCount > 0 
        ? parseFloat((student.totalScorePercentage / student.completedCount).toFixed(1)) 
        : 0;

      return {
        userId: student.userId,
        name: student.name,
        email: student.email,
        averageScore: avgScore,
        highestScore: student.highestScore,
        quizzesCompleted: student.completedCount,
        passedQuizzes: student.passedCount
      };
    });

    // Sort by: highest score first, then average score, then completed count
    leaderboardList.sort((a, b) => {
      if (b.highestScore !== a.highestScore) {
        return b.highestScore - a.highestScore;
      }
      if (b.averageScore !== a.averageScore) {
        return b.averageScore - a.averageScore;
      }
      return b.quizzesCompleted - a.quizzesCompleted;
    });

    // Add Rank 1-indexed
    const rankedLeaderboard = leaderboardList.map((entry, index) => ({
      rank: index + 1,
      ...entry
    }));

    res.json(rankedLeaderboard);
  } catch (error) {
    console.error('Error generating leaderboard:', error);
    res.status(500).json({ error: 'Server error generating leaderboard' });
  }
});

export default router;
