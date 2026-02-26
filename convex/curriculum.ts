import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Generate upload URL for curriculum files
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Upload curriculum
export const uploadCurriculum = mutation({
  args: {
    title: v.string(),
    description: v.optional(v.string()),
    courseId: v.optional(v.id("courses")),
    fileStorageId: v.id("_storage"),
    fileName: v.string(),
    fileType: v.string(),
    targetGrades: v.optional(v.array(v.string())),
    term: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Get admin user - look for any admin user in the system
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    // If no admin exists, use a placeholder (for initial setup)
    const uploadedById = adminUser?._id || ("system" as any);
    
    const curriculumId = await ctx.db.insert("curriculum", {
      title: args.title,
      description: args.description,
      courseId: args.courseId,
      fileStorageId: args.fileStorageId,
      fileName: args.fileName,
      fileType: args.fileType,
      uploadedBy: uploadedById,
      uploadedAt: Date.now(),
      isActive: true,
      targetGrades: args.targetGrades,
      term: args.term,
    });

    return curriculumId;
  },
});

// Get all curriculum (for teachers)
export const getAllCurriculum = query({
  args: {},
  handler: async (ctx) => {
    const curriculum = await ctx.db
      .query("curriculum")
      .filter((q) => q.eq(q.field("isActive"), true))
      .order("desc")
      .collect();

    // Get file URLs
    const curriculumWithUrls = await Promise.all(
      curriculum.map(async (item) => {
        const fileUrl = item.fileStorageId 
          ? await ctx.storage.getUrl(item.fileStorageId)
          : item.fileUrl;
        
        return {
          ...item,
          fileUrl,
        };
      })
    );

    return curriculumWithUrls;
  },
});

// Get curriculum by course
export const getCurriculumByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const curriculum = await ctx.db
      .query("curriculum")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get file URLs
    const curriculumWithUrls = await Promise.all(
      curriculum.map(async (item) => {
        const fileUrl = item.fileStorageId 
          ? await ctx.storage.getUrl(item.fileStorageId)
          : item.fileUrl;
        
        return {
          ...item,
          fileUrl,
        };
      })
    );

    return curriculumWithUrls;
  },
});

// Delete curriculum
export const deleteCurriculum = mutation({
  args: {
    curriculumId: v.id("curriculum"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.curriculumId);
    return { success: true };
  },
});

// Get file URL from storage ID
export const getFileUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});



