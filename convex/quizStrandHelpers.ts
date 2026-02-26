import { query } from "./_generated/server";
import { v } from "convex/values";

// Get unique strands for a course's quizzes
export const getQuizStrandsByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get unique strands (filter out undefined/null)
    const strandsSet = new Set(
      quizzes
        .map(quiz => quiz.strand)
        .filter((strand): strand is string => !!strand)
    );
    
    return Array.from(strandsSet).sort();
  },
});

// Get unique sub-strands for a course and strand
export const getQuizSubStrandsByStrand = query({
  args: {
    courseId: v.id("courses"),
    strand: v.string(),
  },
  handler: async (ctx, args) => {
    const quizzes = await ctx.db
      .query("quizzes")
      .withIndex("by_course_strand", (q) => 
        q.eq("courseId", args.courseId).eq("strand", args.strand)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get unique sub-strands (filter out undefined/null)
    const subStrandsSet = new Set(
      quizzes
        .map(quiz => quiz.subStrand)
        .filter((subStrand): subStrand is string => !!subStrand)
    );
    
    return Array.from(subStrandsSet).sort();
  },
});

// Get quizzes by strand and sub-strand
export const getQuizzesByStrand = query({
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
