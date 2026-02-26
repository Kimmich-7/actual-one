import { query } from "./_generated/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

// Get comprehensive student report data for PDF generation
export const getStudentReportData = query({
  args: { studentId: v.id("users") },
  handler: async (ctx, args) => {
    // Get student details
    const student = await ctx.db.get(args.studentId);
    if (!student) return null;

    // Get student's class details
    const studentClass = await ctx.db
      .query("classes")
      .filter((q) => q.eq(q.field("name"), student.class || ""))
      .first();

    // Get teacher details if class has a teacher
    let teacher: Doc<"users"> | null = null;
    if (studentClass?.teacherId) {
      teacher = await ctx.db.get(studentClass.teacherId);
    }

    // Get all quiz sessions for this student
    const quizSessions = await ctx.db
      .query("quizSessions")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Get course details for each quiz session
    const quizPerformance = await Promise.all(
      quizSessions.map(async (session) => {
        const course = await ctx.db.get(session.courseId);
        const quiz = await ctx.db.get(session.quizId);
        return {
          courseName: course?.title || "Unknown Course",
          quizTitle: quiz?.title || "Quiz",
          score: session.score,
          correctAnswers: session.correctAnswers,
          totalQuestions: session.totalQuestions,
          performance: session.performance,
          completedAt: session.completedAt,
          timeSpent: session.timeSpent,
        };
      })
    );

    // Calculate average quiz score
    const averageQuizScore =
      quizSessions.length > 0
        ? Math.round(
            quizSessions.reduce((sum, s) => sum + s.score, 0) /
              quizSessions.length
          )
        : 0;

    // Get all projects for this student
    const projects = await ctx.db
      .query("projects")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Get course details for each project
    const projectsDetails = await Promise.all(
      projects.map(async (project) => {
        const course = await ctx.db.get(project.courseId);
        return {
          title: project.title,
          courseName: course?.title || "Unknown Course",
          status: project.status,
          submissionDate: project.submissionDate,
          grade: project.grade,
          feedback: project.feedback,
        };
      })
    );

    // Get student progress data
    const progressRecords = await ctx.db
      .query("studentProgress")
      .withIndex("by_student", (q) => q.eq("studentId", args.studentId))
      .collect();

    // Get course completion details
    const courseProgress = await Promise.all(
      progressRecords.map(async (progress) => {
        const course = await ctx.db.get(progress.courseId);
        return {
          courseName: course?.title || "Unknown Course",
          status: progress.status,
          completionDate: progress.completionDate,
          timeSpent: progress.timeSpent,
        };
      })
    );

    // Calculate overall statistics
    const completedCourses = courseProgress.filter(
      (c) => c.status === "completed"
    ).length;
    const inProgressCourses = courseProgress.filter(
      (c) => c.status === "in_progress"
    ).length;
    const approvedProjects = projects.filter(
      (p) => p.status === "approved"
    ).length;

    return {
      student: {
        name: student.name,
        username: student.username,
        grade: student.grade,
        class: student.class,
        registrationDate: student.registrationDate,
      },
      teacher: teacher
        ? {
            name: teacher.name,
            subjects: teacher.teacherSubjects ?? [],
          }
        : null,
      statistics: {
        totalQuizzes: quizSessions.length,
        averageQuizScore,
        totalProjects: projects.length,
        approvedProjects,
        completedCourses,
        inProgressCourses,
      },
      quizPerformance: quizPerformance.sort(
        (a, b) => b.completedAt - a.completedAt
      ),
      projects: projectsDetails.sort(
        (a, b) => b.submissionDate - a.submissionDate
      ),
      courseProgress,
    };
  },
});

// Get report data for all students (for bulk generation)
export const getAllStudentsReportData = query({
  args: {},
  handler: async (ctx) => {
    // Get all approved students
    const students = await ctx.db
      .query("users")
      .filter((q) =>
        q.and(
          q.eq(q.field("role"), "student"),
          q.eq(q.field("isApproved"), true)
        )
      )
      .collect();

    return students.map((student) => ({
      _id: student._id,
      name: student.name,
      grade: student.grade,
      class: student.class,
    }));
  },
});
