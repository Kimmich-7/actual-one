





import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// Admin: Create a question for a course
export const createQuestion = mutation({
  args: {
    courseId: v.id("courses"),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
    explanation: v.optional(v.string()),
    difficulty: v.string(),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can create questions");
    }

    const questionId = await ctx.db.insert("questions", {
      ...args,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return questionId;
  },
});

// Admin: Get all questions for a course
export const getQuestionsForCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    return questions;
  },
});

// Admin: Update a question
export const updateQuestion = mutation({
  args: {
    questionId: v.id("questions"),
    question: v.optional(v.string()),
    options: v.optional(v.array(v.string())),
    correctAnswer: v.optional(v.number()),
    explanation: v.optional(v.string()),
    difficulty: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update questions");
    }

    const { questionId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(questionId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin: Delete a question
export const deleteQuestion = mutation({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete questions");
    }

    // Delete all related quiz attempts
    const attempts = await ctx.db
      .query("quizAttempts")
      .filter((q) => q.eq(q.field("questionId"), args.questionId))
      .collect();

    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    // Delete the question
    await ctx.db.delete(args.questionId);
    return { success: true };
  },
});

// Student: Get quiz questions for a course
export const getQuizForCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "student") return [];

    const questions = await ctx.db
      .query("questions")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Return questions without correct answers for students
    return questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
    }));
  },
});

// Simple version for students using localStorage auth
export const getQuizForCourseSimple = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .collect();

    // Return questions without correct answers for students
    return questions.map(q => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      difficulty: q.difficulty,
    }));
  },
});

// Student: Submit quiz answer
export const submitQuizAnswer = mutation({
  args: {
    courseId: v.id("courses"),
    quizId: v.optional(v.id("quizzes")),
    questionId: v.id("questions"),
    selectedAnswer: v.number(),
    timeSpent: v.optional(v.number()),
    customUserId: v.optional(v.string()), // Add custom user ID support
  },
  handler: async (ctx, args) => {
    // Try Convex auth first, then fall back to custom auth
    let userId = await getAuthUserId(ctx);
    let user: any = null;
    
    if (!userId && args.customUserId) {
      // Custom authentication - find user by username (not customId)
      const users = await ctx.db.query("users").collect();
      const foundUser = users.find(u => u.username === args.customUserId || u._id === args.customUserId);
      if (foundUser) {
        userId = foundUser._id;
        user = foundUser;
      }
    } else if (userId) {
      user = await ctx.db.get(userId);
    }

    if (!userId || !user) {
      throw new Error("Not authenticated");
    }

    if (user.role !== "student") {
      throw new Error("Only students can submit quiz answers");
    }

    // Get the question to check correct answer
    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const isCorrect = question.correctAnswer === args.selectedAnswer;

    // Check if student already answered this question
    const existingAttempt = await ctx.db
      .query("quizAttempts")
      .filter((q) => 
        q.and(
          q.eq(q.field("studentId"), userId),
          q.eq(q.field("questionId"), args.questionId)
        )
      )
      .first();

    if (existingAttempt) {
      // Update existing attempt
      await ctx.db.patch(existingAttempt._id, {
        selectedAnswer: args.selectedAnswer,
        isCorrect,
        attemptedAt: Date.now(),
        timeSpent: args.timeSpent,
      });
    } else {
      // Create new attempt
      await ctx.db.insert("quizAttempts", {
        studentId: userId,
        courseId: args.courseId,
        quizId: args.quizId || question.quizId || ("placeholder" as any),
        questionId: args.questionId,
        selectedAnswer: args.selectedAnswer,
        isCorrect,
        points: question.points || 1,
        attemptedAt: Date.now(),
        timeSpent: args.timeSpent,
      });
    }

    return { success: true, isCorrect, correctAnswer: question.correctAnswer };
  },
});

// Student: Complete quiz session
export const completeQuizSession = mutation({
  args: {
    courseId: v.id("courses"),
    quizId: v.id("quizzes"),
    totalQuestions: v.number(),
    correctAnswers: v.number(),
    totalTimeSpent: v.number(),
    startedAt: v.number(),
    customUserId: v.optional(v.string()), // Add custom user ID support
  },
  handler: async (ctx, args) => {
    // Try Convex auth first, then fall back to custom auth
    let userId = await getAuthUserId(ctx);
    let user: any = null;
    
    if (!userId && args.customUserId) {
      // Custom authentication - find user by username (not customId)
      const users = await ctx.db.query("users").collect();
      const foundUser = users.find(u => u.username === args.customUserId || u._id === args.customUserId);
      if (foundUser) {
        userId = foundUser._id;
        user = foundUser;
      }
    } else if (userId) {
      user = await ctx.db.get(userId);
    }

    if (!userId || !user) {
      throw new Error("Not authenticated");
    }

    if (user.role !== "student") {
      throw new Error("Only students can complete quiz sessions");
    }

    const score = Math.round((args.correctAnswers / args.totalQuestions) * 100);
    
    // Determine performance rating
    let performance = "below";
    if (score >= 80) performance = "exceeding";
    else if (score >= 60) performance = "meeting";

    const sessionId = await ctx.db.insert("quizSessions", {
      studentId: userId,
      courseId: args.courseId,
      quizId: args.quizId,
      totalQuestions: args.totalQuestions,
      correctAnswers: args.correctAnswers,
      totalPoints: args.totalQuestions, // Assuming 1 point per question
      earnedPoints: args.correctAnswers,
      score,
      performance,
      completedAt: Date.now(),
      timeSpent: args.totalTimeSpent,
      startedAt: args.startedAt,
    });

    return { success: true, score, performance, sessionId };
  },
});

// Admin: Get student performance data
export const getStudentPerformance = query({
  args: {
    gradeFilter: v.optional(v.string()),
    classFilter: v.optional(v.string()),
    courseFilter: v.optional(v.id("courses")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    let sessions = await ctx.db.query("quizSessions").collect();

    // Get student details for each session
    const performanceData = await Promise.all(
      sessions.map(async (session) => {
        const student = await ctx.db.get(session.studentId);
        const course = await ctx.db.get(session.courseId);
        
        if (!student || !course) return null;

        // Apply filters
        if (args.gradeFilter && student.grade !== args.gradeFilter) return null;
        if (args.classFilter && student.class !== args.classFilter) return null;
        if (args.courseFilter && session.courseId !== args.courseFilter) return null;

        return {
          sessionId: session._id,
          studentName: student.name,
          studentGrade: student.grade,
          studentClass: student.class,
          courseName: course.title,
          score: session.score,
          correctAnswers: session.correctAnswers,
          totalQuestions: session.totalQuestions,
          timeSpent: session.timeSpent,
          completedAt: session.completedAt,
        };
      })
    );

    return performanceData.filter(Boolean);
  },
});

// Student: Get quiz completion status for courses
export const getStudentQuizProgress = query({
  args: { 
    studentUsername: v.string(),
    courseId: v.optional(v.id("courses"))
  },
  handler: async (ctx, args) => {
    // Find user by username
    const users = await ctx.db.query("users").collect();
    const student = users.find(u => u.username === args.studentUsername && u.role === "student");
    
    if (!student) return [];

    // Get quiz sessions for this student
    let sessions = await ctx.db
      .query("quizSessions")
      .withIndex("by_student", (q) => q.eq("studentId", student._id))
      .collect();

    // Filter by course if specified
    if (args.courseId) {
      sessions = sessions.filter(s => s.courseId === args.courseId);
    }

    // Get course and quiz details
    const progressData = await Promise.all(
      sessions.map(async (session) => {
        const course = await ctx.db.get(session.courseId);
        const quiz = await ctx.db.get(session.quizId);
        
        return {
          courseId: session.courseId,
          courseName: course?.title || "Unknown Course",
          quizId: session.quizId,
          quizTitle: quiz?.title || "Quiz",
          difficulty: "medium", // Default difficulty since it's not in quiz schema
          score: session.score,
          performance: session.performance,
          completedAt: session.completedAt,
          isCompleted: true
        };
      })
    );

    return progressData;
  },
});

// Get quiz statistics for admin dashboard
export const getQuizStatistics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return null;

    const sessions = await ctx.db.query("quizSessions").collect();
    const questions = await ctx.db.query("questions").collect();
    const attempts = await ctx.db.query("quizAttempts").collect();

    const totalSessions = sessions.length;
    const averageScore = sessions.length > 0 
      ? sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length 
      : 0;
    const totalQuestions = questions.length;
    const totalAttempts = attempts.length;

    return {
      totalSessions,
      averageScore: Math.round(averageScore),
      totalQuestions,
      totalAttempts,
    };
  },
});











