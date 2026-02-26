





import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { api } from "./_generated/api";
import { Doc } from "./_generated/dataModel";

// Result types for secure data access
type GetQuizzesResult =
  | { ok: true; quizzes: any[] }
  | { ok: false; code: "FORBIDDEN"; message: string };

// Admin: Create a new quiz
export const createQuiz = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    timeLimit: v.optional(v.number()),
    strand: v.optional(v.string()),
    subStrand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can create quizzes");
    }

    const quizId = await ctx.db.insert("quizzes", {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      strand: args.strand,
      subStrand: args.subStrand,
      questions: [],
      timeLimit: args.timeLimit || 30,
      isActive: true,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, quizId };
  },
});

// Admin: Add question to quiz
export const addQuestionToQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    courseId: v.id("courses"),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
    explanation: v.optional(v.string()),
    difficulty: v.string(),
    points: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can add questions");
    }

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Create the question
    const questionId = await ctx.db.insert("questions", {
      courseId: args.courseId,
      quizId: args.quizId,
      question: args.question,
      options: args.options,
      correctAnswer: args.correctAnswer,
      explanation: args.explanation,
      difficulty: args.difficulty,
      points: args.points || 1,
      createdBy: userId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add question to quiz
    await ctx.db.patch(args.quizId, {
      questions: [...quiz.questions, questionId],
      updatedAt: Date.now(),
    });

    return { success: true, questionId };
  },
});

// Get quizzes for a course
export const getQuizzesForCourse = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args): Promise<GetQuizzesResult> => {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get questions for each quiz
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Promise.all(
          quiz.questions.map(async (questionId) => {
            const question = await ctx.db.get(questionId);
            return question;
          })
        );

        return {
          ...quiz,
          questionDetails: questions.filter(Boolean),
        };
      })
    );

    return { ok: true, quizzes: quizzesWithQuestions };
  },
});

// Simple version for course quizzes (no auth required)
export const getQuizzesForCourseSimple = query({
  args: { courseId: v.id("courses") },
  handler: async (ctx, args) => {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get questions for each quiz
    const quizzesWithQuestions = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await Promise.all(
          quiz.questions.map(async (questionId) => {
            const question = await ctx.db.get(questionId);
            return question;
          })
        );

        return {
          ...quiz,
          questionDetails: questions.filter(Boolean),
        };
      })
    );

    return quizzesWithQuestions;
  },
});

// Get all quizzes (admin only)
export const getAllQuizzes = query({
  args: {},
  handler: async (ctx): Promise<GetQuizzesResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { ok: false, code: "FORBIDDEN", message: "Not authenticated" };
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      return { ok: false, code: "FORBIDDEN", message: "Admin access required" };
    }

    const quizzes = await ctx.db.query("quizzes").collect();

    // Get course and question details for each quiz
    const quizzesWithDetails = await Promise.all(
      quizzes.map(async (quiz) => {
        const course = await ctx.db.get(quiz.courseId);
        const questions = await Promise.all(
          quiz.questions.map(async (questionId) => {
            const question = await ctx.db.get(questionId);
            return question;
          })
        );

        return {
          ...quiz,
          courseName: course?.title || "Unknown Course",
          questionDetails: questions.filter(Boolean),
        };
      })
    );

    return { ok: true, quizzes: quizzesWithDetails };
  },
});

// Update quiz
export const updateQuiz = mutation({
  args: {
    quizId: v.id("quizzes"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    timeLimit: v.optional(v.number()),
    isActive: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update quizzes");
    }

    const { quizId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(quizId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Delete quiz
export const deleteQuiz = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete quizzes");
    }

    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Delete all questions in the quiz
    for (const questionId of quiz.questions) {
      await ctx.db.delete(questionId);
    }

    // Delete all quiz attempts and sessions
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    const sessions = await ctx.db
      .query("quizSessions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete the quiz
    await ctx.db.delete(args.quizId);

    return { success: true };
  },
});

// Delete a question from a quiz
export const deleteQuestionFromQuiz = mutation({
  args: { 
    questionId: v.id("questions"),
    quizId: v.id("quizzes")
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Remove question from quiz's questions array
    const updatedQuestions = quiz.questions.filter(id => id !== args.questionId);
    await ctx.db.patch(args.quizId, {
      questions: updatedQuestions,
      updatedAt: Date.now(),
    });

    // Delete the question
    await ctx.db.delete(args.questionId);
    
    return { success: true };
  },
});

// Update a question
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

// Get question details
export const getQuestionDetails = query({
  args: { questionId: v.id("questions") },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    return question;
  },
});

// Get student performance data (admin and teachers)
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
    if (!user || (user.role !== "admin" && user.role !== "teacher")) {
      return [];
    }

    let studentIds: string[] = [];

    if (user.role === "teacher") {
      // Get students from teacher's assigned classes
      const assignedClasses = await ctx.db
        .query("classes")
        .filter((q) => q.eq(q.field("teacherId"), userId))
        .collect();

      studentIds = assignedClasses.flatMap(cls => cls.students.map(id => id.toString()));
    } else {
      // Admin can see all students
      const allStudents = await ctx.db
        .query("users")
        .filter((q) => q.eq(q.field("role"), "student"))
        .collect();

      studentIds = allStudents.map(s => s._id.toString());
    }

    // Apply filters
    let filteredStudents = await Promise.all(
      studentIds.map(async (id) => {
        const student = await ctx.db.get(id as any);
        return student;
      })
    );

    filteredStudents = filteredStudents.filter(Boolean) as Doc<"users">[];

    if (args.gradeFilter) {
      filteredStudents = filteredStudents.filter(s => s && (s as Doc<"users">).grade === args.gradeFilter);
    }

    if (args.classFilter) {
      filteredStudents = filteredStudents.filter(s => s && (s as Doc<"users">).class === args.classFilter);
    }

    // Get performance data for filtered students
    const performanceData = await Promise.all(
      filteredStudents.map(async (student) => {
        if (!student) return null;
        
        let sessions = await ctx.db
          .query("quizSessions")
          .withIndex("by_student", (q) => q.eq("studentId", student._id as any))
          .collect();

        if (args.courseFilter) {
          sessions = sessions.filter(s => s.courseId === args.courseFilter);
        }

        const coursesData = await Promise.all(
          sessions.map(async (session) => {
            const course = await ctx.db.get(session.courseId);
            const quiz = await ctx.db.get(session.quizId);
            return {
              ...session,
              courseName: course?.title || "Unknown Course",
              quizTitle: quiz?.title || "Unknown Quiz",
            };
          })
        );

        return {
          student,
          sessions: coursesData,
          averageScore: sessions.length > 0 
            ? Math.round(sessions.reduce((sum, s) => sum + s.score, 0) / sessions.length)
            : 0,
          totalQuizzes: sessions.length,
        };
      })
    );

    return performanceData;
  },
});

// Get quiz statistics (admin only)
export const getQuizStatistics = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return null;

    const totalQuizzes = await ctx.db.query("quizzes").collect();
    const totalSessions = await ctx.db.query("quizSessions").collect();
    
    // Calculate performance based on score ranges
    const performanceBreakdown = {
      exceeding: totalSessions.filter(s => s.score >= 90).length,
      meeting: totalSessions.filter(s => s.score >= 70 && s.score < 90).length,
      below: totalSessions.filter(s => s.score < 70).length,
    };

    const averageScore = totalSessions.length > 0
      ? Math.round(totalSessions.reduce((sum, s) => sum + s.score, 0) / totalSessions.length)
      : 0;

    return {
      totalQuizzes: totalQuizzes.length,
      totalAttempts: totalSessions.length,
      averageScore,
      performanceBreakdown,
    };
  },
});

// Simple versions that don't require Convex Auth (for admin portal)
export const createQuizSimple = mutation({
  args: {
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    timeLimit: v.optional(v.number()),
    strand: v.optional(v.string()),
    subStrand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get any admin user to use as createdBy
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    const quizId = await ctx.db.insert("quizzes", {
      courseId: args.courseId,
      title: args.title,
      description: args.description,
      strand: args.strand,
      subStrand: args.subStrand,
      questions: [],
      timeLimit: args.timeLimit || 30,
      isActive: true,
      createdBy: adminUser?._id || ("admin_placeholder" as any), // Use actual admin ID or placeholder
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { success: true, quizId };
  },
});

export const addQuestionToQuizSimple = mutation({
  args: {
    quizId: v.id("quizzes"),
    courseId: v.id("courses"),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
    explanation: v.optional(v.string()),
    difficulty: v.string(),
    points: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Get any admin user to use as createdBy
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    // Create the question
    const questionId = await ctx.db.insert("questions", {
      courseId: args.courseId,
      quizId: args.quizId,
      question: args.question,
      options: args.options,
      correctAnswer: args.correctAnswer,
      explanation: args.explanation,
      difficulty: args.difficulty,
      points: args.points || 1,
      createdBy: adminUser?._id || ("admin_placeholder" as any), // Use actual admin ID or placeholder
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Add question to quiz
    await ctx.db.patch(args.quizId, {
      questions: [...quiz.questions, questionId],
      updatedAt: Date.now(),
    });

    return { success: true, questionId };
  },
});

export const getAllQuizzesSimple = query({
  args: {},
  handler: async (ctx) => {
    const quizzes = await ctx.db.query("quizzes").collect();

    // Get course and question details for each quiz
    const quizzesWithDetails = await Promise.all(
      quizzes.map(async (quiz) => {
        const course = await ctx.db.get(quiz.courseId);
        const questions = await Promise.all(
          quiz.questions.map(async (questionId) => {
            const question = await ctx.db.get(questionId);
            return question;
          })
        );

        return {
          ...quiz,
          courseName: course?.title || "Unknown Course",
          questionDetails: questions.filter(Boolean),
        };
      })
    );

    return quizzesWithDetails;
  },
});

export const getQuizStatisticsSimple = query({
  args: {},
  handler: async (ctx) => {
    const totalQuizzes = await ctx.db.query("quizzes").collect();
    const totalSessions = await ctx.db.query("quizSessions").collect();
    
    // Calculate performance based on score ranges
    const performanceBreakdown = {
      exceeding: totalSessions.filter(s => s.score >= 90).length,
      meeting: totalSessions.filter(s => s.score >= 70 && s.score < 90).length,
      below: totalSessions.filter(s => s.score < 70).length,
    };

    const averageScore = totalSessions.length > 0
      ? Math.round(totalSessions.reduce((sum, s) => sum + s.score, 0) / totalSessions.length)
      : 0;

    return {
      totalQuizzes: totalQuizzes.length,
      totalAttempts: totalSessions.length,
      averageScore,
      performanceBreakdown,
    };
  },
});

// Delete a quiz - Simple version without auth
export const deleteQuizSimple = mutation({
  args: { quizId: v.id("quizzes") },
  handler: async (ctx, args) => {
    const quiz = await ctx.db.get(args.quizId);
    if (!quiz) throw new Error("Quiz not found");

    // Delete all questions for this quiz first
    const questions = await ctx.db
      .query("questions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();
    
    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Delete all quiz attempts and sessions
    const attempts = await ctx.db
      .query("quizAttempts")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const attempt of attempts) {
      await ctx.db.delete(attempt._id);
    }

    const sessions = await ctx.db
      .query("quizSessions")
      .withIndex("by_quiz", (q) => q.eq("quizId", args.quizId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }
    
    // Delete the quiz
    await ctx.db.delete(args.quizId);
    
    return { success: true };
  },
});

// Get all quizzes with course details - Simple version
export const getAllQuizzesWithDetailsSimple = query({
  args: {},
  handler: async (ctx) => {
    const quizzes = await ctx.db.query("quizzes").collect();
    
    const quizzesWithDetails = await Promise.all(
      quizzes.map(async (quiz) => {
        const course = await ctx.db.get(quiz.courseId);
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
          .collect();
        
        return {
          ...quiz,
          courseName: course?.title || "Unknown Course",
          questionCount: questions.length,
        };
      })
    );
    
    return quizzesWithDetails;
  },
});

// Get quizzes by strand and sub-strand for student quiz selection
export const getQuizzesByStrandSimple = query({
  args: {
    courseId: v.id("courses"),
    strand: v.string(),
    subStrand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course_strand", (q) => 
        q.eq("courseId", args.courseId).eq("strand", args.strand)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Further filter by sub-strand if provided
    if (args.subStrand) {
      quizzes = quizzes.filter(quiz => quiz.subStrand === args.subStrand);
    }

    // Get questions count for each quiz
    const quizzesWithDetails = await Promise.all(
      quizzes.map(async (quiz) => {
        const questions = await ctx.db
          .query("questions")
          .withIndex("by_quiz", (q) => q.eq("quizId", quiz._id))
          .collect();
        
        return {
          ...quiz,
          questionCount: questions.length,
        };
      })
    );

    return quizzesWithDetails;
  },
});

// Get quiz questions filtered by strand/sub-strand for students
export const getQuizQuestionsForStrand = query({
  args: {
    courseId: v.id("courses"),
    strand: v.string(),
    subStrand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get quizzes for this strand/sub-strand
    let quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course_strand", (q) => 
        q.eq("courseId", args.courseId).eq("strand", args.strand)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (args.subStrand) {
      quizzes = quizzes.filter(quiz => quiz.subStrand === args.subStrand);
    }

    // Get all questions from these quizzes
    const allQuestions = await Promise.all(
      quizzes.flatMap(async (quiz) => {
        const questions = await Promise.all(
          quiz.questions.map(async (questionId) => {
            const question = await ctx.db.get(questionId);
            return question;
          })
        );
        return questions.filter(Boolean);
      })
    );

    // Flatten the array and remove correct answers for students
    const questions = allQuestions.flat();
    return questions.map(q => {
      if (!q) return null;
      return {
        _id: q._id,
        question: q.question,
        options: q.options,
        difficulty: q.difficulty,
        quizId: q.quizId,
      };
    }).filter(Boolean);
  },
});












