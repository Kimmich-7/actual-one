import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Admin: Upload exam
export const uploadExam = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    grade: v.string(),
    term: v.string(),
    courseId: v.optional(v.id("courses")),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    startDate: v.optional(v.number()),
    endDate: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    // Get admin user
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();

    const uploadedById = adminUser?._id || ("system" as any);

    // Get file URL
    const fileUrl = await ctx.storage.getUrl(args.fileStorageId);

    const examId = await ctx.db.insert("exams", {
      title: args.title,
      description: args.description,
      grade: args.grade,
      term: args.term,
      courseId: args.courseId,
      fileStorageId: args.fileStorageId,
      fileUrl: fileUrl || undefined,
      fileName: args.fileName,
      fileType: args.fileType,
      startDate: args.startDate,
      endDate: args.endDate,
      uploadedBy: uploadedById,
      uploadedAt: Date.now(),
      isActive: true,
    });

    return examId;
  },
});

// Get all exams
export const getAllExams = query({
  args: {},
  handler: async (ctx) => {
    const exams = await ctx.db.query("exams").collect();

    // Get file URLs for each exam
    const examsWithUrls = await Promise.all(
      exams.map(async (exam) => {
        const fileUrl = exam.fileStorageId
          ? await ctx.storage.getUrl(exam.fileStorageId)
          : exam.fileUrl;
        return { ...exam, fileUrl };
      })
    );

    return examsWithUrls;
  },
});

// Get exams by grade and term
export const getExamsByGradeAndTerm = query({
  args: {
    grade: v.string(),
    term: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let exams = await ctx.db
      .query("exams")
      .withIndex("by_grade", (q) => q.eq("grade", args.grade))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    if (args.term) {
      exams = exams.filter((exam) => exam.term === args.term);
    }

    // Get file URLs
    const examsWithUrls = await Promise.all(
      exams.map(async (exam) => {
        const fileUrl = exam.fileStorageId
          ? await ctx.storage.getUrl(exam.fileStorageId)
          : exam.fileUrl;
        return { ...exam, fileUrl };
      })
    );

    return examsWithUrls;
  },
});

// Delete exam
export const deleteExam = mutation({
  args: {
    examId: v.id("exams"),
  },
  handler: async (ctx, args) => {
    const exam = await ctx.db.get(args.examId);
    if (!exam) throw new Error("Exam not found");

    // Delete the file from storage if it exists
    if (exam.fileStorageId) {
      await ctx.storage.delete(exam.fileStorageId);
    }

    await ctx.db.delete(args.examId);
    return { success: true };
  },
});

// Generate upload URL
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Check if student has active exam
export const hasActiveExam = query({
  args: {
    grade: v.string(),
    term: v.string(),
  },
  handler: async (ctx, args) => {
    const exam = await ctx.db
      .query("exams")
      .withIndex("by_grade_term", (q) => 
        q.eq("grade", args.grade).eq("term", args.term)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();

    return exam !== null;
  },
});
