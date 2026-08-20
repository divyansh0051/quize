import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all attempts list for monitoring (Admin Only)
router.get('/attempts', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      include: {
        quiz: {
          select: { title: true }
        },
        user: {
          select: { name: true, email: true }
        }
      },
      orderBy: { startedAt: 'desc' }
    });
    res.json(attempts);
  } catch (error) {
    console.error('Error fetching admin attempts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET dashboard statistics & analytics data (Admin Only)
router.get('/analytics', authenticateToken, requireAdmin, async (req, res) => {
  try {
    // 1. Core Counts
    const totalStudents = await prisma.user.count({ where: { role: 'STUDENT' } });
    const totalQuizzes = await prisma.quiz.count();
    const publishedQuizzes = await prisma.quiz.count({ where: { status: 'PUBLISHED' } });
    const draftQuizzes = await prisma.quiz.count({ where: { status: 'DRAFT' } });
    const totalQuestions = await prisma.question.count();
    const totalAttempts = await prisma.attempt.count({ where: { NOT: { completedAt: null } } });

    // 2. Scores Aggregation
    const attemptsScoreAgg = await prisma.attempt.aggregate({
      where: { NOT: { completedAt: null } },
      _avg: {
        percentage: true
      }
    });
    const averageScore = attemptsScoreAgg._avg.percentage || 0;

    const totalPassed = await prisma.attempt.count({ where: { status: 'PASSED' } });
    const totalFailed = await prisma.attempt.count({ where: { status: 'FAILED', NOT: { completedAt: null } } });

    // 3. Registrations over time (last 30 days, grouped by date)
    const users = await prisma.user.findMany({
      where: { role: 'STUDENT' },
      select: { createdAt: true }
    });

    const regTrendMap = {};
    users.forEach(u => {
      const dateStr = u.createdAt.toISOString().split('T')[0];
      regTrendMap[dateStr] = (regTrendMap[dateStr] || 0) + 1;
    });

    // Make an ordered array of last 7 days registrations
    const regTrend = Object.keys(regTrendMap)
      .sort()
      .slice(-7)
      .map(date => ({
        date,
        registrations: regTrendMap[date]
      }));

    // 4. Attempts over time (last 7 dates)
    const dbAttempts = await prisma.attempt.findMany({
      where: { NOT: { completedAt: null } },
      select: { completedAt: true }
    });

    const attTrendMap = {};
    dbAttempts.forEach(a => {
      if (a.completedAt) {
        const dateStr = a.completedAt.toISOString().split('T')[0];
        attTrendMap[dateStr] = (attTrendMap[dateStr] || 0) + 1;
      }
    });

    const attemptTrend = Object.keys(attTrendMap)
      .sort()
      .slice(-7)
      .map(date => ({
        date,
        attempts: attTrendMap[date]
      }));

    // 5. Popular Categories
    // Group attempts by quiz, then map to categories
    const allAttempts = await prisma.attempt.findMany({
      include: {
        quiz: {
          include: { category: true }
        }
      }
    });

    const categoryPopularityMap = {};
    allAttempts.forEach(att => {
      const catName = att.quiz.category.name;
      categoryPopularityMap[catName] = (categoryPopularityMap[catName] || 0) + 1;
    });

    const popularCategories = Object.keys(categoryPopularityMap).map(name => ({
      name,
      value: categoryPopularityMap[name]
    })).sort((a,b) => b.value - a.value).slice(0, 5);

    // 6. Average score per category (Category performance metrics)
    const categoryScoresMap = {};
    const categoryCountMap = {};

    allAttempts.forEach(att => {
      const catName = att.quiz.category.name;
      categoryScoresMap[catName] = (categoryScoresMap[catName] || 0) + att.percentage;
      categoryCountMap[catName] = (categoryCountMap[catName] || 0) + 1;
    });

    const categoryPerformance = Object.keys(categoryScoresMap).map(name => ({
      name,
      avgScore: parseFloat((categoryScoresMap[name] / categoryCountMap[name]).toFixed(1))
    })).sort((a,b) => b.avgScore - a.avgScore);

    res.json({
      stats: {
        totalStudents,
        totalQuizzes,
        publishedQuizzes,
        draftQuizzes,
        totalQuestions,
        totalAttempts,
        averageScore: parseFloat(averageScore.toFixed(1)),
        passedAttempts: totalPassed,
        failedAttempts: totalFailed
      },
      charts: {
        regTrend,
        attemptTrend,
        popularCategories,
        categoryPerformance
      }
    });

  } catch (error) {
    console.error('Error compiling analytics:', error);
    res.status(500).json({ error: 'Server error compiling analytics' });
  }
});

export default router;
