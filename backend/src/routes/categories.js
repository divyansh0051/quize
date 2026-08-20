import express from 'express';
import prisma from '../db.js';
import { authenticateToken, requireAdmin } from '../middleware/auth.js';

const router = express.Router();

// GET all categories
router.get('/', authenticateToken, async (req, res) => {
  try {
    const categories = await prisma.category.findMany({
      include: {
        _count: {
          select: { quizzes: true }
        }
      },
      orderBy: { name: 'asc' }
    });
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST create category (Admin Only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
  const { name, description } = req.body;
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    const existing = await prisma.category.findUnique({
      where: { name }
    });
    if (existing) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { name, description }
    });
    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT update category (Admin Only)
router.put('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  const { name, description } = req.body;
  
  if (!name) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  try {
    // Check duplicate name excluding current record
    const duplicate = await prisma.category.findFirst({
      where: {
        name,
        NOT: { id }
      }
    });

    if (duplicate) {
      return res.status(400).json({ error: 'Another category with this name already exists' });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: { name, description }
    });
    res.json(updated);
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE category (Admin Only)
router.delete('/:id', authenticateToken, requireAdmin, async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.category.delete({
      where: { id }
    });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

export default router;
