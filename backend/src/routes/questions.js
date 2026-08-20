import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all questions for a specific quiz (Admin Only)
router.get('/quizzes/:quizId/questions', authenticateToken, requireAdmin, async (req, res) => {
  const { quizId } = req.params;

  try {
    const questions = await prisma.question.findMany({
      where: { quizId },
      include: {
        options: true
      },
      orderBy: { createdAt: 'asc' }
    });
    res.json(questions);
  } catch (error) {
    console.error('Error fetching questions:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST add a question to a quiz (Admin Only)
router.post('/quizzes/:quizId/questions', authenticateToken, requireAdmin, async (req, res) => {
  const { quizId } = req.params;
  const { questionText, marks, explanation, difficulty, options } = req.body;

  if (!questionText || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Question text and at least 2 options are required' });
  }

  // Check if at least one correct option exists
  const hasCorrect = options.some(opt => opt.isCorrect === true);
  if (!hasCorrect) {
    return res.status(400).json({ error: 'At least one option must be marked as correct' });
  }

  try {
    // Check if the quiz exists
    const quiz = await prisma.quiz.findUnique({ where: { id: quizId } });
    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    // Create question and its options inside a transaction
    const newQuestion = await prisma.$transaction(async (tx) => {
      const q = await tx.question.create({
        data: {
          quizId,
          questionText,
          marks: parseFloat(marks) || 1.0,
          explanation,
          difficulty: difficulty || 'INTERMEDIATE'
        }
      });

      // Create options
      const optData = options.map(opt => ({
        questionId: q.id,
        optionText: opt.optionText,
        isCorrect: !!opt.isCorrect
      }));

      await tx.option.createMany({
        data: optData
      });

      // Fetch the complete question back with options
      return await tx.question.findUnique({
        where: { id: q.id },
        include: { options: true }
      });
    });

    res.status(201).json(newQuestion);
  } catch (error) {
    console.error('Error creating question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update a question (Admin Only)
router.put('/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { questionText, marks, explanation, difficulty, options } = req.body;

  if (!questionText || !options || !Array.isArray(options) || options.length < 2) {
    return res.status(400).json({ error: 'Question text and at least 2 options are required' });
  }

  // Check if at least one correct option exists
  const hasCorrect = options.some(opt => opt.isCorrect === true);
  if (!hasCorrect) {
    return res.status(400).json({ error: 'At least one option must be marked as correct' });
  }

  try {
    const question = await prisma.question.findUnique({ where: { id } });
    if (!question) {
      return res.status(404).json({ error: 'Question not found' });
    }

    // Perform update in transaction: update question, delete old options, insert new options
    const updatedQuestion = await prisma.$transaction(async (tx) => {
      const updated = await tx.question.update({
        where: { id },
        data: {
          questionText,
          marks: parseFloat(marks) || 1.0,
          explanation,
          difficulty: difficulty || 'INTERMEDIATE'
        }
      });

      // Delete existing options
      await tx.option.deleteMany({
        where: { questionId: id }
      });

      // Re-create options
      const optData = options.map(opt => ({
        questionId: id,
        optionText: opt.optionText,
        isCorrect: !!opt.isCorrect
      }));

      await tx.option.createMany({
        data: optData
      });

      return await tx.question.findUnique({
        where: { id },
        include: { options: true }
      });
    });

    res.json(updatedQuestion);
  } catch (error) {
    console.error('Error updating question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE a question (Admin Only)
router.delete('/questions/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.question.delete({
      where: { id }
    });
    res.json({ message: 'Question deleted successfully' });
  } catch (error) {
    console.error('Error deleting question:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
