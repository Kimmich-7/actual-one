import { query, mutation } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";

// List all courses (for checking if courses exist)
export const listCourses = query({
  args: {},
  handler: async (ctx) => {
    const courses: Doc<"courses">[] = await ctx.db.query("courses").collect();
    return courses;
  },
});

// Get all courses with availability based on user's grade
export const getCoursesForStudent = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];
    
    const user = await ctx.db.get(userId);
    if (!user || !user.grade) return [];

    // user.grade is already in format "Grade X", don't add "Grade " prefix
    const userGradeString = user.grade;

    const courses = await ctx.db.query("courses").collect();
    
    return courses.map(course => ({
      ...course,
      isAvailableForUser: course.availableForGrades.includes(userGradeString),
    }));
  },
});

// Get all courses (for admin filtering and general use)
export const getAllCourses = query({
  args: {},
  handler: async (ctx) => {
    const courses = await ctx.db.query("courses").collect();
    return courses;
  },
});

// Get all courses (for admin)
type GetAllCoursesResult =
  | { ok: true; courses: Doc<"courses">[] }
  | { ok: false; code: "FORBIDDEN"; message: string };

export const getAllCoursesAdmin = query({
  args: {},
  handler: async (ctx): Promise<GetAllCoursesResult> => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { ok: false, code: "FORBIDDEN", message: "You must be an admin to view all courses." };
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      return { ok: false, code: "FORBIDDEN", message: "You must be an admin to view all courses." };
    }

    const courses = await ctx.db.query("courses").order("desc").collect();
    return { ok: true, courses };
  },
});

// Get single course details
export const getCourse = query({
  args: { 
    courseId: v.id("courses"),
    userId: v.optional(v.id("users"))
  },
  handler: async (ctx, args) => {
    const course = await ctx.db.get(args.courseId);
    if (!course) return null;

    // If no userId provided, return course without availability check
    if (!args.userId) {
      return { ...course, isAvailableForUser: false };
    }
    
    const user = await ctx.db.get(args.userId);
    if (!user || !user.grade) {
      return { ...course, isAvailableForUser: false };
    }

    // user.grade is already in format "Grade 8", no need to add "Grade " prefix
    const userGradeString = user.grade;

    // Check both grade availability AND that the course is active
    const isAvailableForUser = course.isActive && course.availableForGrades.includes(userGradeString);

    return {
      ...course,
      isAvailableForUser,
    };
  },
});

// Create initial courses (for seeding)
export const createCourse = mutation({
  args: {
    title: v.string(),
    description: v.string(),
    icon: v.optional(v.string()),
    category: v.string(),
    difficulty: v.string(),
    estimatedHours: v.optional(v.number()),
    isActive: v.boolean(),
    availableForGrades: v.array(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can create courses");
    }

    const courseId = await ctx.db.insert("courses", {
      ...args,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return courseId;
  },
});

// Seed initial courses - run this once to populate the database
export const seedCourses = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if courses already exist
    const existingCourses = await ctx.db.query("courses").collect();
    if (existingCourses.length > 0) {
      return { message: "Courses already exist, skipping seed" };
    }

    const coursesToCreate = [
      // Grades 1-3: Scratch Junior and Typing Skills
      {
        title: "Scratch Junior",
        description: "Perfect first programming experience for young learners! Create interactive stories and games with colorful blocks.",
        icon: "🎭",
        category: "Visual Programming",
        difficulty: "Beginner",
        estimatedHours: 15,
        isActive: true,
        availableForGrades: ["Grade 1", "Grade 2", "Grade 3"],
        editorUrl: "https://codejr.org/scratchjr/index.html",
      },
      {
        title: "Scratch Programming",
        description: "Learn programming basics with visual blocks using Scratch. Perfect for young learners!",
        icon: "🎮",
        category: "Visual Programming",
        difficulty: "Beginner",
        estimatedHours: 20,
        isActive: true,
        availableForGrades: ["Grade 3", "Grade 4", "Grade 5", "Grade 6"],
      },
      {
        title: "Typing Skills",
        description: "Master keyboard typing with fun games and exercises. Build your typing speed and accuracy!",
        icon: "⌨️",
        category: "Computer Skills",
        difficulty: "Beginner",
        estimatedHours: 15,
        isActive: true,
        availableForGrades: ["Grade 1", "Grade 2", "Grade 3", "Grade 4", "Grade 5", "Grade 6"],
      },
      
      // Grades 4-6: HTML, CSS, JS
      {
        title: "HTML Basics",
        description: "Learn to create web pages with HTML. Build your first website from scratch!",
        icon: "🌐",
        category: "Web Development",
        difficulty: "Beginner",
        estimatedHours: 25,
        isActive: true,
        availableForGrades: ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
      },
      {
        title: "CSS Styling",
        description: "Make your websites beautiful with CSS. Learn colors, layouts, and animations!",
        icon: "🎨",
        category: "Web Development",
        difficulty: "Beginner",
        estimatedHours: 30,
        isActive: true,
        availableForGrades: ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
      },
      {
        title: "JavaScript Fundamentals",
        description: "Add interactivity to your websites with JavaScript. Make your pages come alive!",
        icon: "⚡",
        category: "Web Development",
        difficulty: "Intermediate",
        estimatedHours: 35,
        isActive: true,
        availableForGrades: ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
      },
      
      // Programming courses
      {
        title: "Python Programming",
        description: "Learn one of the world's most popular programming languages. Perfect for beginners and beyond!",
        icon: "🐍",
        category: "Programming",
        difficulty: "Intermediate",
        estimatedHours: 40,
        isActive: true,
        availableForGrades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9"],
      },
      {
        title: "Robotics & Arduino",
        description: "Build and program robots! Learn electronics and coding with hands-on projects.",
        icon: "🤖",
        category: "Robotics",
        difficulty: "Intermediate",
        estimatedHours: 45,
        isActive: true,
        availableForGrades: ["Grade 7", "Grade 8", "Grade 9"],
      },
      {
        title: "Minecraft Programming",
        description: "Code in Minecraft! Learn programming concepts while building amazing worlds.",
        icon: "⛏️",
        category: "Game Programming",
        difficulty: "Beginner",
        estimatedHours: 30,
        isActive: true,
        availableForGrades: ["Grade 4", "Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
      },
      
      // New courses: App Lab and Spike Lego
      {
        title: "App Lab",
        description: "Create mobile apps using Code.org's App Lab. Design interfaces and build interactive applications!",
        icon: "📱",
        category: "App Development",
        difficulty: "Intermediate",
        estimatedHours: 35,
        isActive: true,
        availableForGrades: ["Grade 6", "Grade 7", "Grade 8", "Grade 9"],
        editorUrl: "https://studio.code.org/projects/applab",
      },
      {
        title: "Spike Lego",
        description: "Program LEGO Spike robots for creative projects. Combine building with coding!",
        icon: "🧱",
        category: "Robotics",
        difficulty: "Intermediate",
        estimatedHours: 30,
        isActive: true,
        availableForGrades: ["Grade 5", "Grade 6", "Grade 7", "Grade 8", "Grade 9"],
        editorUrl: "/courses/spike-lego",
      }
    ];

    const courseIds: string[] = [];
    for (const course of coursesToCreate) {
      const courseId = await ctx.db.insert("courses", {
        ...course,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      });
      courseIds.push(courseId);
    }

    return { message: `Successfully created ${courseIds.length} courses`, courseIds };
  },
});

// Get courses for a specific grade (no auth required)
export const getCoursesByGrade = query({
  args: { grade: v.string() },
  handler: async (ctx, args) => {
    const courses = await ctx.db.query("courses").collect();
    
    return courses.map(course => ({
      ...course,
      isAvailableForUser: course.isActive && course.availableForGrades.includes(args.grade),
    }));
  },
});

// Add missing Scratch Junior course (temporary function)
export const addScratchJunior = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if Scratch Junior already exists
    const courses = await ctx.db.query("courses").collect();
    const scratchJuniorExists = courses.some(course => course.title === "Scratch Junior");
    
    if (scratchJuniorExists) {
      return { message: "Scratch Junior already exists" };
    }

    const courseId = await ctx.db.insert("courses", {
      title: "Scratch Junior",
      description: "Perfect first programming experience for young learners! Create interactive stories and games with colorful blocks.",
      icon: "🎭",
      category: "Visual Programming",
      difficulty: "Beginner",
      estimatedHours: 15,
      isActive: true,
      availableForGrades: ["Grade 1", "Grade 2", "Grade 3"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    return { message: "Scratch Junior course created successfully", courseId };
  },
});


// Debug: proves Macaly is deploying changes to this existing module
export const ping = mutation({
  args: {},
  handler: async () => {
    return { ok: true, ts: Date.now() };
  },
});

// Admin-only export users (for migration)
// Uses the SAME auth system your file already uses: getAuthUserId(ctx)
export const exportUsers = mutation({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Not authorized");
    }

    const users = await ctx.db.query("users").collect();
    return { ok: true, count: users.length, users };
  },
});

// TEMP: Export any table (REMOVE AFTER MIGRATION)
export const exportTable = query({
  args: {
    table: v.string(),
    secret: v.string(),
  },
  handler: async (ctx, args) => {
    const EXPORT_SECRET = "jsps_export_2026_02_08_9f3c1a7e"; // must match Macaly secret
    if (args.secret !== EXPORT_SECRET) return [];

    // Allowlist tables to avoid abuse
    const allowed = new Set([
      "users",
      "classes",
      "courses",
      "lessons",
      "curriculum",
      "exams",
      "quizSessions",
      "quizAttempts",
      "quizzes",
      "questions",
      "studentProgress",
      "projects",
      "announcements",
      "archivedStudents",
      "courseNotes",
      "_storage",
    ]);

    if (!allowed.has(args.table)) return [];

    // @ts-ignore - Convex db.query expects literal table types; runtime string still works
    return await ctx.db.query(args.table).collect();
  },
});
