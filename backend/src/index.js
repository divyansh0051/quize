import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import route files
import authRouter from './routes/auth.js';
import usersRouter from './routes/users.js';
import categoriesRouter from './routes/categories.js';
import quizzesRouter from './routes/quizzes.js';
import questionsRouter from './routes/questions.js';
import attemptsRouter from './routes/attempts.js';
import adminRouter from './routes/admin.js';
import leaderboardRouter from './routes/leaderboard.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Backend availability check
app.get('/', (req, res) => {
  res.json({
    status: 'online',
    message: 'Quiz Management & Assessment API is fully functional',
    timestamp: new Date()
  });
});

// Mount Routes
app.use('/api/auth', authRouter);
app.use('/api/users', usersRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/quizzes', quizzesRouter);
app.use('/api', questionsRouter); // questions router has root matching /api/...
app.use('/api/attempts', attemptsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/leaderboard', leaderboardRouter);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('Express Error Handler:', err.stack);
  res.status(500).json({ error: 'Something went wrong inside the server!' });
});

// Start Server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running in development mode on http://localhost:${PORT}`);
});
