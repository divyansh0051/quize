import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireStudent } from '../middleware/auth.js';

const router = express.Router();

// GET all attempts for the current log-in Student
router.get('/', authenticateToken, async (req, res) => {
  try {
    const attempts = await prisma.attempt.findMany({
      where: {
        userId: req.user.id
      },
      include: {
        quiz: {
          select: {
            title: true,
            duration: true,
            passingScore: true
          }
        }
      },
      orderBy: { startedAt: 'desc' }
    });

    res.json(attempts);
  } catch (error) {
    console.error('Error fetching attempts:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// START a quiz attempt (Student Only)
router.post('/quizzes/:quizId/start', authenticateToken, requireStudent, async (req, res) => {
  const { quizId } = req.params;

  try {
    // 1. Fetch quiz details
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: {
              select: {
                id: true,
                optionText: true // DO NOT select isCorrect!
              }
            }
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    if (quiz.status !== 'PUBLISHED') {
      return res.status(403).json({ error: 'This quiz is not published and cannot be attempted' });
    }

    if (quiz.questions.length === 0) {
      return res.status(400).json({ error: 'This quiz has no questions and cannot be attempted' });
    }

    // 2. Enforce max attempts
    const attemptsCount = await prisma.attempt.count({
      where: {
        quizId,
        userId: req.user.id
      }
    });

    if (attemptsCount >= quiz.maxAttempts) {
      return res.status(403).json({ error: `You have reached the maximum allowed attempts (${quiz.maxAttempts}) for this quiz.` });
    }

    // 3. Create a new Attempt record
    const attempt = await prisma.attempt.create({
      data: {
        quizId,
        userId: req.user.id,
        status: 'FAILED', // Default until submission
        startedAt: new Date()
      }
    });

    // 4. Return attempt details and questions sanitized (without correct answers)
    res.status(201).json({
      attemptId: attempt.id,
      startedAt: attempt.startedAt,
      quiz: {
        id: quiz.id,
        title: quiz.title,
        duration: quiz.duration
      },
      questions: quiz.questions
    });

  } catch (error) {
    console.error('Error starting quiz:', error);
    res.status(500).json({ error: 'Server error starting the quiz' });
  }
});

// SUBMIT a quiz attempt (Student Only)
router.post('/quizzes/:quizId/submit', authenticateToken, requireStudent, async (req, res) => {
  const { quizId } = req.params;
  const { attemptId, answers } = req.body; // Check answers = array of { questionId, selectedOptionId }

  if (!attemptId) {
    return res.status(400).json({ error: 'Attempt ID is required' });
  }

  try {
    // 1. Fetch attempt and verify it belongs to current user
    const attempt = await prisma.attempt.findUnique({
      where: { id: attemptId }
    });

    if (!attempt || attempt.userId !== req.user.id || attempt.quizId !== quizId) {
      return res.status(404).json({ error: 'Attempt path not valid' });
    }

    if (attempt.completedAt) {
      return res.status(400).json({ error: 'This attempt is already submitted' });
    }

    // 2. Fetch quiz questions and correct options
    const quiz = await prisma.quiz.findUnique({
      where: { id: quizId },
      include: {
        questions: {
          include: {
            options: true
          }
        }
      }
    });

    if (!quiz) {
      return res.status(404).json({ error: 'Quiz not found' });
    }

    const questions = quiz.questions;
    let totalMarks = 0;
    let obtainedScore = 0;
    let correctAnswers = 0;
    let incorrectAnswers = 0;
    let unanswered = 0;

    const answerInputs = [];

    // Calculate score
    for (const question of questions) {
      totalMarks += question.marks;
      
      const submittedAnswer = answers ? answers.find(ans => ans.questionId === question.id) : null;
      const selectedOptionId = submittedAnswer ? submittedAnswer.selectedOptionId : null;

      if (!selectedOptionId) {
        unanswered++;
        answerInputs.push({
          attemptId,
          questionId: question.id,
          selectedOptionId: null,
          isCorrect: false
        });
      } else {
        // Find correct option for this question
        const correctOption = question.options.find(opt => opt.isCorrect);
        const isCorrect = correctOption && correctOption.id === selectedOptionId;

        if (isCorrect) {
          correctAnswers++;
          obtainedScore += question.marks;
        } else {
          incorrectAnswers++;
        }

        answerInputs.push({
          attemptId,
          questionId: question.id,
          selectedOptionId,
          isCorrect: !!isCorrect
        });
      }
    }

    // Calculate percentage and status
    const percentage = totalMarks > 0 ? (obtainedScore / totalMarks) * 100 : 0;
    const isPassed = percentage >= quiz.passingScore;
    const finalStatus = isPassed ? 'PASSED' : 'FAILED';
    const completedAt = new Date();
    
    // Calculate time taken (in seconds)
    const timeTaken = Math.max(0, Math.floor((completedAt.getTime() - attempt.startedAt.getTime()) / 1000));

    // Write Answers and Update Attempt in a database transaction
    const finalAttempt = await prisma.$transaction(async (tx) => {
      // 1. Create answers
      await tx.answer.createMany({
        data: answerInputs
      });

      // 2. Update attempt
      return await tx.attempt.update({
        where: { id: attemptId },
        data: {
          score: obtainedScore,
          percentage: parseFloat(percentage.toFixed(2)),
          correctAnswers,
          incorrectAnswers,
          unanswered,
          timeTaken,
          completedAt,
          status: finalStatus
        },
        include: {
          quiz: {
            select: {
              title: true,
              passingScore: true
            }
          }
        }
      });
    });

    res.json({
      message: 'Quiz submitted successfully',
      attempt: finalAttempt
    });

  } catch (error) {
    console.error('Error submitting quiz answers:', error);
    res.status(500).json({ error: 'Server error submitting answers' });
  }
});

// GET single attempt details + full review (Accessible by Admin and the attempted Student)
router.get('/:id', authenticateToken, async (req, res) => {
  const { id } = req.params;

  try {
    const attempt = await prisma.attempt.findUnique({
      where: { id },
      include: {
        quiz: {
          include: {
            category: { select: { name: true } }
          }
        },
        user: {
          select: { id: true, name: true, email: true }
        },
        answers: true
      }
    });

    if (!attempt) {
      return res.status(404).json({ error: 'Attempt results not found' });
    }

    // Authorization check: User must be Admin, or the Student who created this attempt
    if (req.user.role === 'STUDENT' && attempt.userId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    // Fetch quiz questions + options so they can be merged with answers for review
    const questions = await prisma.question.findMany({
      where: { quizId: attempt.quizId },
      include: { options: true }
    });

    // Merge answers into questions structure for easy render on frontend
    const questionReview = questions.map(q => {
      const dbAnswer = attempt.answers.find(ans => ans.questionId === q.id);
      return {
        id: q.id,
        questionText: q.questionText,
        marks: q.marks,
        explanation: q.explanation,
        difficulty: q.difficulty,
        options: q.options, // Contains isCorrect so they can check right answers
        selectedOptionId: dbAnswer ? dbAnswer.selectedOptionId : null,
        isCorrect: dbAnswer ? dbAnswer.isCorrect : false
      };
    });

    res.json({
      attempt: {
        id: attempt.id,
        quizId: attempt.quizId,
        quizTitle: attempt.quiz.title,
        category: attempt.quiz.category.name,
        passingScore: attempt.quiz.passingScore,
        score: attempt.score,
        percentage: attempt.percentage,
        correctAnswers: attempt.correctAnswers,
        incorrectAnswers: attempt.incorrectAnswers,
        unanswered: attempt.unanswered,
        timeTaken: attempt.timeTaken,
        status: attempt.status,
        startedAt: attempt.startedAt,
        completedAt: attempt.completedAt,
        studentName: attempt.user.name,
        studentEmail: attempt.user.email
      },
      questions: questionReview
    });

  } catch (error) {
    console.error('Error fetching attempt details:', error);
    res.status(500).json({ error: 'Server error fetching details' });
  }
});

export default router;
