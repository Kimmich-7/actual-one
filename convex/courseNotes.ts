import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

// Admin: Create a course note
export const createNote = mutation({
  args: {
    courseId: v.id("courses"),
    strand: v.string(),
    subStrand: v.string(),
    title: v.string(),
    content: v.string(),
    images: v.optional(v.array(v.id("_storage"))),
  },
  handler: async (ctx, args) => {
    // Get admin user - look for any admin user in the system
    const adminUser = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "admin"))
      .first();
    
    // If no admin exists, use a placeholder (for initial setup)
    const createdById = adminUser?._id || ("system" as any);
    
    const noteId = await ctx.db.insert("courseNotes", {
      courseId: args.courseId,
      strand: args.strand,
      subStrand: args.subStrand,
      title: args.title,
      content: args.content,
      images: args.images || [],
      createdBy: createdById,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isActive: true,
    });

    return noteId;
  },
});

// Admin: Update a course note
export const updateNote = mutation({
  args: {
    noteId: v.id("courseNotes"),
    title: v.optional(v.string()),
    content: v.optional(v.string()),
    images: v.optional(v.array(v.id("_storage"))),
    strand: v.optional(v.string()),
    subStrand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const { noteId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(noteId, {
      ...filteredUpdates,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

// Admin: Delete a course note
export const deleteNote = mutation({
  args: {
    noteId: v.id("courseNotes"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.noteId);
    return { success: true };
  },
});

// Get all notes for a course
export const getNotesByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("courseNotes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return notes;
  },
});

// Get notes by strand and sub-strand
export const getNotesByStrand = query({
  args: {
    courseId: v.id("courses"),
    strand: v.string(),
    subStrand: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    let notes = await ctx.db
      .query("courseNotes")
      .withIndex("by_course_strand", (q) => 
        q.eq("courseId", args.courseId).eq("strand", args.strand)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Further filter by sub-strand if provided
    if (args.subStrand) {
      notes = notes.filter(note => note.subStrand === args.subStrand);
    }

    return notes;
  },
});

// Get unique strands for a course
export const getStrandsByCourse = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("courseNotes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get unique strands
    const strandsSet = new Set(notes.map(note => note.strand));
    return Array.from(strandsSet).sort();
  },
});

// Get unique sub-strands for a course and strand
export const getSubStrandsByStrand = query({
  args: {
    courseId: v.id("courses"),
    strand: v.string(),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("courseNotes")
      .withIndex("by_course_strand", (q) => 
        q.eq("courseId", args.courseId).eq("strand", args.strand)
      )
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    // Get unique sub-strands
    const subStrandsSet = new Set(notes.map(note => note.subStrand));
    return Array.from(subStrandsSet).sort();
  },
});

// Generate upload URL for note images
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    return await ctx.storage.generateUploadUrl();
  },
});

// Get image URL from storage ID
export const getImageUrl = query({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    return await ctx.storage.getUrl(args.storageId);
  },
});

// Check if a course has any notes
export const courseHasNotes = query({
  args: {
    courseId: v.id("courses"),
  },
  handler: async (ctx, args) => {
    const notes = await ctx.db
      .query("courseNotes")
      .withIndex("by_course", (q) => q.eq("courseId", args.courseId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .first();
    
    return notes !== null;
  },
});

// Get all course IDs that have notes (for efficient checking)
export const getCoursesWithNotes = query({
  args: {},
  handler: async (ctx) => {
    const notes = await ctx.db
      .query("courseNotes")
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();
    
    // Get unique course IDs
    const courseIdsSet = new Set(notes.map(note => note.courseId));
    return Array.from(courseIdsSet);
  },
});





