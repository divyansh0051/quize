import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // 1. Clear database
  await prisma.answer.deleteMany({});
  await prisma.attempt.deleteMany({});
  await prisma.option.deleteMany({});
  await prisma.question.deleteMany({});
  await prisma.quiz.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('Cleared existing data.');

  // 2. Hash passwords
  const salt = await bcrypt.genSalt(10);
  const adminPassword = await bcrypt.hash('admin123', salt);
  const studentPassword = await bcrypt.hash('student123', salt);

  // 3. Create Users
  const admin = await prisma.user.create({
    data: {
      name: 'System Admin',
      email: 'admin@quiz.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE'
    }
  });

  console.log('Created Admin account.');

  // 4. Create Categories
  const catTechnical = await prisma.category.create({
    data: { name: 'Technical', description: 'General software engineering, IT, and programming concepts' }
  });

  console.log('Created categories.');

  // 5. Create a Quiz
  const quiz = await prisma.quiz.create({
    data: {
      title: 'Technical Quiz Round',
      description: 'Standard technical evaluation round covering HTML, CSS, JavaScript, and general programming concepts.',
      categoryId: catTechnical.id,
      difficulty: 'INTERMEDIATE',
      duration: 15, // 15 minutes
      passingScore: 60, // 60%
      maxAttempts: 3,
      status: 'PUBLISHED'
    }
  });

  console.log('Created Technical Quiz Round.');

  // 6. Create Questions and Options for Quiz
  // Question 1
  const q1 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'What does HTML stand for?',
      marks: 1.0,
      explanation: 'HTML stands for Hyper Text Markup Language. It is the standard markup language for creating web pages.',
      difficulty: 'EASY'
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: q1.id, optionText: 'Hyper Text Markup Language', isCorrect: true },
      { questionId: q1.id, optionText: 'Home Tool Markup Language', isCorrect: false },
      { questionId: q1.id, optionText: 'Hyperlinks and Text Markup Language', isCorrect: false },
      { questionId: q1.id, optionText: 'Hyper Tool Markup Language', isCorrect: false }
    ]
  });

  // Question 2
  const q2 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'Which CSS property is used to control the display layout (e.g. aligning items in rows or columns)?',
      marks: 1.0,
      explanation: 'The CSS display property with value flex allows you to easily design layout structures where elements align inline or in columns.',
      difficulty: 'EASY'
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: q2.id, optionText: 'display: flex', isCorrect: true },
      { questionId: q2.id, optionText: 'layout: aligned', isCorrect: false },
      { questionId: q2.id, optionText: 'float-direction', isCorrect: false },
      { questionId: q2.id, optionText: 'flex-grid', isCorrect: false }
    ]
  });

  // Question 3
  const q3 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'How do you write "Hello World" in an alert box in modern JavaScript?',
      marks: 1.0,
      explanation: 'In JavaScript, the alert() method displays an alert box with a specified message and an OK button.',
      difficulty: 'EASY'
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: q3.id, optionText: 'alert("Hello World");', isCorrect: true },
      { questionId: q3.id, optionText: 'msg("Hello World");', isCorrect: false },
      { questionId: q3.id, optionText: 'msgBox("Hello World");', isCorrect: false },
      { questionId: q3.id, optionText: 'alertBox("Hello World");', isCorrect: false }
    ]
  });

  // Question 4
  const q4 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'In React.js, which Hook is used to handle component side-effects such as fetching data?',
      marks: 1.0,
      explanation: 'The useEffect hook lets you perform side effects in functional components.',
      difficulty: 'INTERMEDIATE'
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: q4.id, optionText: 'useState', isCorrect: false },
      { questionId: q4.id, optionText: 'useEffect', isCorrect: true },
      { questionId: q4.id, optionText: 'useContext', isCorrect: false },
      { questionId: q4.id, optionText: 'useReducer', isCorrect: false }
    ]
  });

  // Question 5
  const q5 = await prisma.question.create({
    data: {
      quizId: quiz.id,
      questionText: 'Which database type organizes database elements in document structures or key-value pairs?',
      marks: 1.0,
      explanation: 'NoSQL databases are document-oriented or key-value stores rather than table/relation structures.',
      difficulty: 'INTERMEDIATE'
    }
  });

  await prisma.option.createMany({
    data: [
      { questionId: q5.id, optionText: 'NoSQL', isCorrect: true },
      { questionId: q5.id, optionText: 'Relational SQL', isCorrect: false },
      { questionId: q5.id, optionText: 'Plain text files', isCorrect: false },
      { questionId: q5.id, optionText: 'CSV spreadsheets', isCorrect: false }
    ]
  });

  console.log('Created quiz questions and options successfully.');
  console.log('Database Seeding Complete.');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
