import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

// ============ ADMIN FUNCTIONS ============

// Create a new assessment
export const createAssessment = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    grade: v.string(),
    term: v.string(),
    classId: v.optional(v.id("classes")),
    className: v.optional(v.string()),
    timeLimit: v.number(), // in minutes
  },
  handler: async (ctx, args) => {
    // Get admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    const createdById = adminUser?._id || ("system" as any);

    const assessmentId = await ctx.db.insert("assessments", {
      title: args.title,
      description: args.description,
      grade: args.grade,
      term: args.term,
      classId: args.classId,
      className: args.className,
      timeLimit: args.timeLimit,
      totalQuestions: 0,
      totalPoints: 0,
      createdBy: createdById,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: false, // Not active until questions are added
    });

    return assessmentId;
  },
});

// Add question to assessment
export const addQuestionToAssessment = mutation({
  args: {
    assessmentId: v.id("assessments"),
    question: v.string(),
    options: v.array(v.string()),
    correctAnswer: v.number(),
    points: v.number(),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    // Get current question count for ordering
    const existingQuestions = await ctx.db
      .query("assessmentQuestions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    const questionId = await ctx.db.insert("assessmentQuestions", {
      assessmentId: args.assessmentId,
      question: args.question,
      options: args.options,
      correctAnswer: args.correctAnswer,
      points: args.points,
      order: existingQuestions.length + 1,
      createdAt: Date.now(),
    });

    // Update assessment totals
    await ctx.db.patch(args.assessmentId, {
      totalQuestions: assessment.totalQuestions + 1,
      totalPoints: assessment.totalPoints + args.points,
      updatedAt: Date.now(),
    });

    return questionId;
  },
});

// Add multiple questions at once
export const addMultipleQuestions = mutation({
  args: {
    assessmentId: v.id("assessments"),
    questions: v.array(
      v.object({
        question: v.string(),
        options: v.array(v.string()),
        correctAnswer: v.number(),
        points: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    const existingQuestions = await ctx.db
      .query("assessmentQuestions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    let order = existingQuestions.length;
    let totalNewPoints = 0;

    for (const q of args.questions) {
      order++;
      totalNewPoints += q.points;
      await ctx.db.insert("assessmentQuestions", {
        assessmentId: args.assessmentId,
        question: q.question,
        options: q.options,
        correctAnswer: q.correctAnswer,
        points: q.points,
        order,
        createdAt: Date.now(),
      });
    }

    // Update assessment totals
    await ctx.db.patch(args.assessmentId, {
      totalQuestions: assessment.totalQuestions + args.questions.length,
      totalPoints: assessment.totalPoints + totalNewPoints,
      updatedAt: Date.now(),
    });

    return { success: true, questionsAdded: args.questions.length };
  },
});

// Activate/deactivate assessment
export const toggleAssessmentActive = mutation({
  args: {
    assessmentId: v.id("assessments"),
    isActive: v.boolean(),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    // Ensure there are questions before activating
    if (args.isActive && assessment.totalQuestions === 0) {
      throw new Error("Cannot activate assessment with no questions");
    }

    await ctx.db.patch(args.assessmentId, {
      isActive: args.isActive,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Update assessment time limit
export const updateAssessmentTimeLimit = mutation({
  args: {
    assessmentId: v.id("assessments"),
    timeLimit: v.number(),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.assessmentId, {
      timeLimit: args.timeLimit,
      updatedAt: Date.now(),
    });
    return { success: true };
  },
});

// Delete assessment and all its questions
export const deleteAssessment = mutation({
  args: {
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    // Delete all questions
    const questions = await ctx.db
      .query("assessmentQuestions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    for (const question of questions) {
      await ctx.db.delete(question._id);
    }

    // Delete all sessions (results)
    const sessions = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    for (const session of sessions) {
      await ctx.db.delete(session._id);
    }

    // Delete assessment
    await ctx.db.delete(args.assessmentId);

    return { success: true };
  },
});

// Delete a single question
export const deleteQuestion = mutation({
  args: {
    questionId: v.id("assessmentQuestions"),
  },
  handler: async (ctx, args) => {
    const question = await ctx.db.get(args.questionId);
    if (!question) throw new Error("Question not found");

    const assessment = await ctx.db.get(question.assessmentId);
    if (assessment) {
      await ctx.db.patch(assessment._id, {
        totalQuestions: assessment.totalQuestions - 1,
        totalPoints: assessment.totalPoints - question.points,
        updatedAt: Date.now(),
      });
    }

    await ctx.db.delete(args.questionId);
    return { success: true };
  },
});

// ============ QUERY FUNCTIONS ============

// Get all assessments (for admin)
export const getAllAssessments = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("assessments").order("desc").collect();
  },
});

// Get assessments by grade/term
export const getAssessmentsByGradeTerm = query({
  args: {
    grade: v.string(),
    term: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let assessments = await ctx.db
      .query("assessments")
      .withIndex("by_grade", (q) => q.eq("grade", args.grade))
      .collect();

    if (args.term) {
      assessments = assessments.filter((a) => a.term === args.term);
    }

    return assessments;
  },
});

// Get questions for an assessment
export const getAssessmentQuestions = query({
  args: {
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assessmentQuestions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .order("asc")
      .collect();
  },
});

// Get assessment with questions (for viewing/editing)
export const getAssessmentWithQuestions = query({
  args: {
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) return null;

    const questions = await ctx.db
      .query("assessmentQuestions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .order("asc")
      .collect();

    return { ...assessment, questions };
  },
});

// ============ STUDENT FUNCTIONS ============

// Check if student has an active assessment available
export const getActiveAssessmentForStudent = query({
  args: {
    grade: v.string(),
    className: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find active assessment for this grade
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    // Filter by grade and optionally by class
    const matchingAssessment = assessments.find((a) => {
      if (a.grade !== args.grade) return false;
      // If assessment is for a specific class, check if student's class matches
      if (a.className && args.className && a.className !== args.className) return false;
      return true;
    });

    return matchingAssessment || null;
  },
});

// Check if student has completed an assessment
export const hasStudentCompletedAssessment = query({
  args: {
    studentId: v.id("users"),
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_student_assessment", (q) =>
        q.eq("studentId", args.studentId).eq("assessmentId", args.assessmentId)
      )
      .first();

    return session?.isCompleted || false;
  },
});

// Get student's assessment status (for button color)
export const getStudentAssessmentStatus = query({
  args: {
    studentId: v.id("users"),
    grade: v.string(),
    className: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Find active assessment for this grade
    const assessments = await ctx.db
      .query("assessments")
      .withIndex("by_active", (q) => q.eq("isActive", true))
      .collect();

    const matchingAssessment = assessments.find((a) => {
      if (a.grade !== args.grade) return false;
      if (a.className && args.className && a.className !== args.className) return false;
      return true;
    });

    if (!matchingAssessment) {
      return { hasActiveAssessment: false, hasCompleted: false, assessment: null };
    }

    // Check if student has completed this assessment
    const session = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_student_assessment", (q) =>
        q.eq("studentId", args.studentId).eq("assessmentId", matchingAssessment._id)
      )
      .first();

    return {
      hasActiveAssessment: true,
      hasCompleted: session?.isCompleted || false,
      assessment: matchingAssessment,
      session: session || null,
    };
  },
});

// Start assessment session
export const startAssessmentSession = mutation({
  args: {
    studentId: v.id("users"),
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    // Check if student already has a session
    const existingSession = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_student_assessment", (q) =>
        q.eq("studentId", args.studentId).eq("assessmentId", args.assessmentId)
      )
      .first();

    if (existingSession?.isCompleted) {
      throw new Error("You have already completed this assessment");
    }

    if (existingSession) {
      // Return existing session (resume)
      return existingSession._id;
    }

    // Get student info
    const student = await ctx.db.get(args.studentId);
    if (!student) throw new Error("Student not found");

    // Get assessment
    const assessment = await ctx.db.get(args.assessmentId);
    if (!assessment) throw new Error("Assessment not found");

    // Create new session
    const sessionId = await ctx.db.insert("assessmentSessions", {
      studentId: args.studentId,
      assessmentId: args.assessmentId,
      studentName: student.name || "Unknown",
      studentGrade: student.grade,
      studentClass: student.class,
      startedAt: Date.now(),
      answers: [],
      totalCorrect: 0,
      totalPoints: 0,
      maxPoints: assessment.totalPoints,
      score: 0,
      isCompleted: false,
    });

    return sessionId;
  },
});

// Get assessment questions for student (without correct answers shown)
export const getStudentAssessmentQuestions = query({
  args: {
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    const questions = await ctx.db
      .query("assessmentQuestions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .order("asc")
      .collect();

    // Return questions without revealing correct answers
    return questions.map((q) => ({
      _id: q._id,
      question: q.question,
      options: q.options,
      points: q.points,
      order: q.order,
    }));
  },
});

// Submit assessment answers
export const submitAssessment = mutation({
  args: {
    sessionId: v.id("assessmentSessions"),
    answers: v.array(
      v.object({
        questionId: v.id("assessmentQuestions"),
        selectedAnswer: v.number(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const session = await ctx.db.get(args.sessionId);
    if (!session) throw new Error("Session not found");
    if (session.isCompleted) throw new Error("Assessment already submitted");

    // Calculate results
    let totalCorrect = 0;
    let totalPoints = 0;
    const processedAnswers: Array<{
      questionId: Id<"assessmentQuestions">;
      selectedAnswer: number;
      isCorrect: boolean;
      points: number;
    }> = [];

    for (const answer of args.answers) {
      const question = await ctx.db.get(answer.questionId);
      if (!question) continue;

      const isCorrect = question.correctAnswer === answer.selectedAnswer;
      const pointsEarned = isCorrect ? question.points : 0;

      if (isCorrect) totalCorrect++;
      totalPoints += pointsEarned;

      processedAnswers.push({
        questionId: answer.questionId,
        selectedAnswer: answer.selectedAnswer,
        isCorrect,
        points: pointsEarned,
      });
    }

    const completedAt = Date.now();
    const timeSpent = Math.round((completedAt - session.startedAt) / 1000); // in seconds
    const score = session.maxPoints > 0 ? Math.round((totalPoints / session.maxPoints) * 100) : 0;

    // Update session
    await ctx.db.patch(args.sessionId, {
      answers: processedAnswers,
      totalCorrect,
      totalPoints,
      score,
      completedAt,
      timeSpent,
      isCompleted: true,
    });

    return { success: true, score, totalCorrect, totalPoints };
  },
});

// Get student's active session
export const getStudentActiveSession = query({
  args: {
    studentId: v.id("users"),
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("assessmentSessions")
      .withIndex("by_student_assessment", (q) =>
        q.eq("studentId", args.studentId).eq("assessmentId", args.assessmentId)
      )
      .first();
  },
});

// ============ RESULTS/EXPORT FUNCTIONS ============

// Get all results for an assessment
export const getAssessmentResults = query({
  args: {
    assessmentId: v.id("assessments"),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId))
      .collect();

    return sessions.filter((s) => s.isCompleted);
  },
});

// Get results by grade (for export)
export const getResultsByGrade = query({
  args: {
    grade: v.string(),
    term: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_grade", (q) => q.eq("studentGrade", args.grade))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    // If term specified, filter by term (need to check assessment)
    if (args.term) {
      const filteredSessions: Array<typeof sessions[0] & { assessmentTitle: string }> = [];
      for (const session of sessions) {
        const assessment = await ctx.db.get(session.assessmentId);
        if (assessment?.term === args.term) {
          filteredSessions.push({ ...session, assessmentTitle: assessment.title });
        }
      }
      return filteredSessions;
    }

    // Add assessment info
    const sessionsWithInfo: Array<typeof sessions[0] & { assessmentTitle: string; term: string }> = [];
    for (const session of sessions) {
      const assessment = await ctx.db.get(session.assessmentId);
      sessionsWithInfo.push({
        ...session,
        assessmentTitle: assessment?.title || "Unknown",
        term: assessment?.term || "Unknown",
      });
    }

    return sessionsWithInfo;
  },
});

// Get results by class (for export)
export const getResultsByClass = query({
  args: {
    className: v.string(),
  },
  handler: async (ctx, args) => {
    const sessions = await ctx.db
      .query("assessmentSessions")
      .withIndex("by_class", (q) => q.eq("studentClass", args.className))
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    const sessionsWithInfo: Array<typeof sessions[0] & { assessmentTitle: string; term: string }> = [];
    for (const session of sessions) {
      const assessment = await ctx.db.get(session.assessmentId);
      sessionsWithInfo.push({
        ...session,
        assessmentTitle: assessment?.title || "Unknown",
        term: assessment?.term || "Unknown",
      });
    }

    return sessionsWithInfo;
  },
});

// Get results for teacher's classes
export const getResultsForTeacherClasses = query({
  args: {
    classIds: v.array(v.id("classes")),
  },
  handler: async (ctx, args) => {
    // Get class names
    const classNames: string[] = [];
    for (const classId of args.classIds) {
      const classDoc = await ctx.db.get(classId);
      if (classDoc) classNames.push(classDoc.name);
    }

    // Get all completed sessions
    const allSessions = await ctx.db
      .query("assessmentSessions")
      .filter((q) => q.eq(q.field("isCompleted"), true))
      .collect();

    // Filter by class names
    const relevantSessions = allSessions.filter(
      (s) => s.studentClass && classNames.includes(s.studentClass)
    );

    // Add assessment info
    const sessionsWithInfo: Array<typeof relevantSessions[0] & { assessmentTitle: string; term: string }> = [];
    for (const session of relevantSessions) {
      const assessment = await ctx.db.get(session.assessmentId);
      sessionsWithInfo.push({
        ...session,
        assessmentTitle: assessment?.title || "Unknown",
        term: assessment?.term || "Unknown",
      });
    }

    return sessionsWithInfo;
  },
});

// Export assessment data as CSV-ready format
export const exportAssessmentResults = query({
  args: {
    assessmentId: v.optional(v.id("assessments")),
    grade: v.optional(v.string()),
    className: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let sessions;

    if (args.assessmentId) {
      sessions = await ctx.db
        .query("assessmentSessions")
        .withIndex("by_assessment", (q) => q.eq("assessmentId", args.assessmentId!))
        .filter((q) => q.eq(q.field("isCompleted"), true))
        .collect();
    } else if (args.className) {
      sessions = await ctx.db
        .query("assessmentSessions")
        .withIndex("by_class", (q) => q.eq("studentClass", args.className!))
        .filter((q) => q.eq(q.field("isCompleted"), true))
        .collect();
    } else if (args.grade) {
      sessions = await ctx.db
        .query("assessmentSessions")
        .withIndex("by_grade", (q) => q.eq("studentGrade", args.grade!))
        .filter((q) => q.eq(q.field("isCompleted"), true))
        .collect();
    } else {
      sessions = await ctx.db
        .query("assessmentSessions")
        .filter((q) => q.eq(q.field("isCompleted"), true))
        .collect();
    }

    // Format for CSV export
    const exportData: Array<{
      studentName: string;
      studentGrade: string;
      studentClass: string;
      assessmentTitle: string;
      term: string;
      totalCorrect: number;
      totalQuestions: number;
      pointsEarned: number;
      maxPoints: number;
      score: number;
      timeSpentMinutes: number | string;
      completedAt: string;
    }> = [];
    for (const session of sessions) {
      const assessment = await ctx.db.get(session.assessmentId);
      exportData.push({
        studentName: session.studentName,
        studentGrade: session.studentGrade,
        studentClass: session.studentClass || "N/A",
        assessmentTitle: assessment?.title || "Unknown",
        term: assessment?.term || "Unknown",
        totalCorrect: session.totalCorrect,
        totalQuestions: session.answers.length,
        pointsEarned: session.totalPoints,
        maxPoints: session.maxPoints,
        score: session.score,
        timeSpentMinutes: session.timeSpent ? Math.round(session.timeSpent / 60) : "N/A",
        completedAt: session.completedAt
          ? new Date(session.completedAt).toLocaleDateString()
          : "N/A",
      });
    }

    return exportData;
  },
});

// Get all classes (for dropdown)
export const getAllClasses = query({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("classes").collect();
  },
});
