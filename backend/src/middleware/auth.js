import jwt from 'jsonwebtoken';
import prisma from '../db.js';

export const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    return res.status(401).json({ error: 'Access token required' });
  }

  try {
    const secret = process.env.JWT_SECRET || 'quiz_super_secret_jwt_key_987654321';
    const decoded = jwt.verify(token, secret);
    
    // Find the user to ensure they still exist and are active
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.status === 'INACTIVE') {
      return res.status(403).json({ error: 'Your account is deactivated' });
    }

    req.user = user;
    next();
  } catch (error) {
    console.error('Auth error:', error);
    return res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({ error: 'Forbidden: Admin access required' });
  }
  next();
};

export const requireStudent = (req, res, next) => {
  if (!req.user || req.user.role !== 'STUDENT') {
    return res.status(403).json({ error: 'Forbidden: Student access required' });
  }
  next();
};
