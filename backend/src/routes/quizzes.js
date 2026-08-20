import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all quizzes (with filters & search)
router.get('/', authenticateToken, async (req, res) => {
  const { title, categoryId, difficulty, status } = req.query;

  try {
    const isStudent = req.user.role === 'STUDENT';
    
    // Build query conditions
    const whereConditions = {};
    
    // Students can only see published quizzes
    if (isStudent) {
      whereConditions.status = 'PUBLISHED';
    } else if (status) {
      whereConditions.status = status; // Admin filter by status
    }

    if (title) {
      whereConditions.title = { contains: title };
    }
    if (categoryId) {
      whereConditions.categoryId = categoryId;
    }
    if (difficulty) {
      whereConditions.difficulty = difficulty;
    }

    const quizzes = await prisma.quiz.findMany({
      where: whereConditions,
      include: {
        category: {
          select: { name: true }
        },
        _count: {
          select: { questions: true, attempts: true }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.json(quizzes);
  } catch (error) {
    console.error('Error fetching quizzes:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET quiz details by ID (Students get details without questions, Admin gets details + question count)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;
  try {
    const quiz = await prisma.quiz.findUnique({
      where: { id },
      include: {
        category: {
          select: { name: true }
        },
        _count: {
          select: { questions: true }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Check permissions
    if (req.user.role === 'STUDENT' && quiz.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'Access denied: Quiz is not published' });
    }

    // Get previous attempts count for user
    let userAttemptsCount = 0;
    if (req.user.role === 'STUDENT') {
      userAttemptsCount = await prisma.attempt.count({
        where: {
          quizId: id,
          userId: req.user.id
        }
      });
    }

    res.json({
      ...quiz,
      userAttemptsCount
    });
  } catch (error) {
    console.error('Error fetching quiz details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create quiz (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { title, description, categoryId, difficulty, duration, passingScore, maxAttempts, status } = req.body;

  if (!title || !categoryId || !duration) {
    return res.status(400).json({ error: 'Title, category, and duration are required' });
  }

  try {
    const quiz = await prisma.quiz.create({
      data: {
        title,
        description,
        categoryId,
        difficulty: difficulty || 'INTERMEDIATE',
        duration: parseInt(duration),
        passingScore: parseInt(passingScore) || 60,
        maxAttempts: parseInt(maxAttempts) || 2,
        status: status || 'DRAFT'
      },
      include: {
        category: { select: { name: true } }
      }
    });

    res.status(201).json(quiz);
  } catch (error) {
    console.error('Error creating quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update quiz (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { title, description, categoryId, difficulty, duration, passingScore, maxAttempts, status } = req.body;

  if (!title || !categoryId || !duration) {
    return res.status(400).json({ error: 'Title, category, and duration are required' });
  }

  try {
    const updated = await prisma.quiz.update({
      where: { id },
      data: {
        title,
        description,
        categoryId,
        difficulty,
        duration: parseInt(duration),
        passingScore: parseInt(passingScore),
        maxAttempts: parseInt(maxAttempts),
        status
      },
      include: {
        category: { select: { name: true } }
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH publish/unpublish quiz (Admin Only)
router.patch('/:id/publish', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // e.g. "PUBLISHED" or "UNPUBLISHED" or "DRAFT"

  if (!status || !['DRAFT', 'PUBLISHED', 'UNPUBLISHED'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    // If publishing, ensure there is at least 1 question
    if (status === 'PUBLISHED') {
      const questionCount = await prisma.question.count({
        where: { quizId: id }
      });
      if (questionCount === 0) {
        return res.status(400).json({ error: 'Cannot publish a quiz with 0 questions' });
      }
    }

    const updated = await prisma.quiz.update({
      where: { id },
      data: { status }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating quiz status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE quiz (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.quiz.delete({
      where: { id }
    });
    res.json({ message: 'Quiz deleted successfully' });
  } catch (error) {
    console.error('Error deleting quiz:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
