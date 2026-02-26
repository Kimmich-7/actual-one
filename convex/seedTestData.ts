import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const seedTestData = mutation({
  args: {},
  handler: async (ctx) => {
    // Create a test teacher
    const teacherId = await ctx.db.insert("users", {
      name: "John Teacher",
      username: "teacher1",
      password: "password123",
      email: "teacher@school.com",
      role: "teacher",
      grade: "Teacher",
      teacherSubjects: ["Mathematics", "Science"],
      assignedClasses: [],
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    // Create a test student
    const studentId = await ctx.db.insert("users", {
      name: "Jane Student",
      username: "student1",
      password: "password123",
      email: "student@school.com",
      role: "student",
      grade: "Grade 5",
      class: "5A",
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    // Create a test parent
    const parentId = await ctx.db.insert("users", {
      name: "Mary Parent",
      username: "parent1",
      password: "password123",
      email: "parent@school.com",
      role: "parent",
      grade: "Parent",
      parentOf: studentId,
      childrenIds: [studentId],
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    // Create a test class
    const classId = await ctx.db.insert("classes", {
      name: "Grade 5A",
      grade: "Grade 5",
      students: [studentId],
      teacherId: teacherId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update teacher with assigned class
    await ctx.db.patch(teacherId, {
      assignedClasses: [classId],
    });

    // Create a test course
    const courseId = await ctx.db.insert("courses", {
      title: "Scratch Programming",
      description: "Learn programming basics with visual blocks using Scratch. Perfect for young learners!",
      category: "Visual Programming",
      difficulty: "Beginner",
      isActive: true,
      availableForGrades: ["Grade 4", "Grade 5", "Grade 6"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create a test quiz
    const quizId = await ctx.db.insert("quizzes", {
      courseId: courseId,
      title: "Scratch Basics Quiz",
      description: "Test your knowledge of Scratch programming basics",
      questions: [],
      timeLimit: 30,
      passingScore: 70,
      isActive: true,
      createdBy: teacherId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Create test questions
    const question1Id = await ctx.db.insert("questions", {
      courseId: courseId,
      quizId: quizId,
      question: "What is Scratch?",
      options: [
        "A visual programming language",
        "A text editor",
        "A web browser",
        "A game console"
      ],
      correctAnswer: 0,
      explanation: "Scratch is a visual programming language designed for children",
      difficulty: "easy",
      points: 10,
      createdBy: teacherId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const question2Id = await ctx.db.insert("questions", {
      courseId: courseId,
      quizId: quizId,
      question: "Which block is used to make a sprite move?",
      options: [
        "Say block",
        "Move block",
        "Sound block",
        "Looks block"
      ],
      correctAnswer: 1,
      explanation: "The move block is used to make sprites move around the stage",
      difficulty: "easy",
      points: 10,
      createdBy: teacherId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update quiz with questions
    await ctx.db.patch(quizId, {
      questions: [question1Id, question2Id],
    });

    // Create a test quiz session (student completed the quiz)
    await ctx.db.insert("quizSessions", {
      studentId: studentId,
      courseId: courseId,
      quizId: quizId,
      totalQuestions: 2,
      correctAnswers: 2,
      totalPoints: 20,
      earnedPoints: 20,
      score: 100,
      performance: "exceeding",
      completedAt: Date.now(),
      timeSpent: 300, // 5 minutes
      startedAt: Date.now() - 300000,
    });

    // Create a test project
    await ctx.db.insert("projects", {
      studentId: studentId,
      courseId: courseId,
      title: "My First Scratch Game",
      description: "A simple game where the cat catches the ball",
      projectUrl: "https://scratch.mit.edu/projects/123456789/",
      language: "Scratch",
      submissionDate: Date.now(),
      status: "approved",
      grade: "A",
      feedback: "Great work! Very creative game design.",
      studentGrade: "Grade 5",
      studentName: "Jane Student",
      studentEmail: "student@school.com",
    });

    return {
      success: true,
      message: "Test data created successfully",
      data: {
        teacherId,
        studentId,
        parentId,
        classId,
        courseId,
        quizId,
      }
    };
  },
});