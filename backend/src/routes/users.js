import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all students/users (Admin Only)
router.get('/', authenticateToken, requireAdmin, async (req, res) => {
  const { search } = req.query;

  try {
    const whereConditions = {
      role: 'STUDENT'
    };

    if (search) {
      whereConditions.OR = [
        { name: { contains: search } },
        { email: { contains: search } }
      ];
    }

    const students = await prisma.user.findMany({
      where: whereConditions,
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        createdAt: true,
        attempts: {
          select: {
            score: true,
            percentage: true,
            status: true
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Format list with aggregated info
    const formattedStudents = students.map(student => {
      const attemptsCount = student.attempts.length;
      let highestScore = 0;
      let sumPercentage = 0;

      student.attempts.forEach(att => {
        if (att.percentage > highestScore) highestScore = att.percentage;
        sumPercentage += att.percentage;
      });

      const avgScore = attemptsCount > 0 ? (sumPercentage / attemptsCount).toFixed(1) : 0;

      return {
        id: student.id,
        name: student.name,
        email: student.email,
        status: student.status,
        createdAt: student.createdAt,
        quizzesAttempted: attemptsCount,
        averageScore: parseFloat(avgScore),
        highestScore: parseFloat(highestScore)
      };
    });

    res.json(formattedStudents);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET single student details + full quiz history (Admin Only)
router.get('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;

  try {
    const student = await prisma.user.findUnique({
      where: { id },
      include: {
        attempts: {
          include: {
            quiz: {
              select: { title: true }
            }
          },
          orderBy: { startedAt: 'desc' }
        }
      }
    });

    if (!student) {
      return res.status(404).json({ error: 'Student not found' });
    }

    const attemptsCount = student.attempts.length;
    let highestScore = 0;
    let sumPercentage = 0;
    let passedCount = 0;

    student.attempts.forEach(att => {
      if (att.percentage > highestScore) highestScore = att.percentage;
      sumPercentage += att.percentage;
      if (att.status === 'PASSED') passedCount++;
    });

    const avgScore = attemptsCount > 0 ? (sumPercentage / attemptsCount).toFixed(1) : 0;

    res.json({
      profile: {
        id: student.id,
        name: student.name,
        email: student.email,
        status: student.status,
        createdAt: student.createdAt,
        quizzesAttempted: attemptsCount,
        averageScore: parseFloat(avgScore),
        highestScore: parseFloat(highestScore),
        passedAttempts: passedCount,
        failedAttempts: attemptsCount - passedCount
      },
      attempts: student.attempts
    });
  } catch (error) {
    console.error('Error fetching student details:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update student profile (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }

  try {
    // Check duplicates
    const duplicate = await prisma.user.findFirst({
      where: {
        email,
        NOT: { id }
      }
    });

    if (duplicate) {
      return res.status(400).json({ error: 'Another user with this email already exists' });
    }

    const updated = await prisma.user.update({
      where: { id },
      data: { name, email },
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PATCH change user status (Admin Only)
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { status } = req.body; // "ACTIVE" or "INACTIVE"

  if (!status || !['ACTIVE', 'INACTIVE'].includes(status)) {
    return res.status(400).json({ error: 'Valid status is required' });
  }

  try {
    const updated = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        name: true,
        email: true,
        status: true
      }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating user status:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE student account (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.user.delete({
      where: { id }
    });
    res.json({ message: 'Student account deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
