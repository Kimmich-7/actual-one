import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { ConvexError } from "convex/values";

// Register a new student with name-based authentication
export const registerStudent = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    password: v.string(),
    grade: v.string(),
    school: v.string(),
    class: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser) {
      throw new ConvexError("Username already exists. Please choose a different username.");
    }

    // If class is specified, validate it exists
    if (args.class) {
      const classExists = await ctx.db
        .query("classes")
        .filter((q: any) => q.eq(q.field("name"), args.class))
        .first();
      
      if (!classExists) {
        throw new ConvexError(`Class "${args.class}" does not exist. Please contact your administrator or select a different class.`);
      }
    }

    // Create new user
    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: args.username,
      password: args.password, // Store password (in production, this should be hashed)
      grade: args.grade,
      class: args.class || args.grade, // Use provided class or default to grade
      school: args.school,
      role: "student",
      isApproved: false, // Require admin approval before login
      registrationDate: Date.now(),
    });

    // If specific class was provided, add student to that class
    if (args.class) {
      const classRecord = await ctx.db
        .query("classes")
        .filter((q: any) => q.eq(q.field("name"), args.class))
        .first();
      
      if (classRecord && !classRecord.students.includes(userId)) {
        await ctx.db.patch(classRecord._id, {
          students: [...classRecord.students, userId],
          updatedAt: Date.now(),
        });
      }
    }

    return { success: true, userId };
  },
});

// Login with username and password
export const loginStudent = mutation({
  args: {
    username: v.string(),
    password: v.optional(v.string()), // Optional for backward compatibility
  },
  handler: async (ctx, args) => {
    // Find user by username
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      throw new ConvexError("Username not found. Please check your username or create an account.");
    }

    // Check if user is approved
    if (user.isApproved === false) {
      throw new ConvexError("Your account is pending admin approval. Please wait for approval before logging in.");
    }

    // Check password if provided (for new users with passwords)
    if (args.password && user.password && user.password !== args.password) {
      throw new ConvexError("Incorrect password. Please try again.");
    }

    // Update last login time
    await ctx.db.patch(user._id, {
      lastLoginTime: Date.now()
    });

    return { success: true, user };
  },
});

// Get user by username (for verification)
export const getUserByUsername = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    return user;
  },
});

// Check if username is available
export const checkUsernameAvailability = query({
  args: {
    username: v.string(),
  },
  handler: async (ctx, args) => {
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    return { available: !existingUser };
  },
});

// Login school admin
export const loginSchoolAdmin = mutation({
  args: {
    username: v.string(),
    password: v.string(),
  },
  handler: async (ctx, args) => {
    // Find user by username
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    if (!user) {
      throw new ConvexError("Invalid credentials. Please check your username and password.");
    }

    // Check if user is a school admin
    if (user.role !== "school_admin") {
      throw new ConvexError("Access denied. This login is for school administrators only.");
    }

    // Verify password
    if (user.password !== args.password) {
      throw new ConvexError("Invalid credentials. Please check your username and password.");
    }

    // Update last login time
    await ctx.db.patch(user._id, {
      lastLoginTime: Date.now()
    });

    return { success: true, user };
  },
});

// Create school admin (for system admin use)
export const createSchoolAdmin = mutation({
  args: {
    name: v.string(),
    username: v.string(),
    password: v.string(),
    email: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if username already exists
    const existingUser = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();

    if (existingUser) {
      throw new ConvexError("Username already exists.");
    }

    const userId = await ctx.db.insert("users", {
      name: args.name,
      username: args.username,
      password: args.password,
      email: args.email,
      grade: "school_admin", // Special grade marker
      role: "school_admin",
      isApproved: true,
      registrationDate: Date.now(),
    });

    return { success: true, userId };
  },
});

// Seed default school admin account
export const seedSchoolAdmin = mutation({
  args: {},
  handler: async (ctx) => {
    // Check if school admin already exists
    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", "schooladmin"))
      .first();

    if (existingAdmin) {
      return { success: true, message: "School admin already exists", userId: existingAdmin._id };
    }

    // Create default school admin
    const userId = await ctx.db.insert("users", {
      name: "School Administrator",
      username: "schooladmin",
      password: "school2024",
      email: "schooladmin@jsps.ac.ke",
      grade: "school_admin",
      role: "school_admin",
      isApproved: true,
      registrationDate: Date.now(),
    });

    return { success: true, message: "School admin created successfully", userId };
  },
});

// Get teacher performance data for school dashboard
export const getTeacherPerformanceData = query({
  args: {},
  handler: async (ctx) => {
    // Get all teachers
    const teachers = await ctx.db
      .query("users")
      .filter((q) => q.eq(q.field("role"), "teacher"))
      .collect();

    const teacherPerformance = await Promise.all(
      teachers.map(async (teacher) => {
        // Get classes assigned to this teacher
        const teacherClasses = await ctx.db
          .query("classes")
          .filter((q) => q.eq(q.field("teacherId"), teacher._id))
          .collect();

        // Get all students from teacher's classes
        const studentIds = new Set<string>();
        teacherClasses.forEach(cls => {
          cls.students.forEach(sid => studentIds.add(sid as string));
        });

        // Get quiz sessions for all students
        const allSessions: any[] = [];
        const studentIdArray = Array.from(studentIds);
        for (const studentId of studentIdArray) {
          const sessions = await ctx.db
            .query("quizSessions")
            .withIndex("by_student", (q) => q.eq("studentId", studentId as any))
            .collect();
          allSessions.push(...sessions);
        }

        // Calculate class-level performance
        const classPerformance = await Promise.all(
          teacherClasses.map(async (cls) => {
            const classStudentIds = cls.students.map(s => s as string);
            const classSessions = allSessions.filter(s => classStudentIds.includes(s.studentId as string));
            
            if (classSessions.length === 0) {
              return { className: cls.name, grade: cls.grade, avgScore: 0, hasData: false, studentCount: classStudentIds.length, quizCount: 0 };
            }
            
            const avgScore = Math.round(classSessions.reduce((sum, s) => sum + s.score, 0) / classSessions.length);
            return { 
              className: cls.name, 
              grade: cls.grade, 
              avgScore, 
              hasData: true, 
              studentCount: classStudentIds.length, 
              quizCount: classSessions.length,
              performanceLevel: avgScore >= 85 ? "exceeding" : avgScore >= 70 ? "meeting" : avgScore >= 50 ? "approaching" : "below"
            };
          })
        );

        // Calculate overall teacher performance
        const classesWithData = classPerformance.filter(c => c.hasData);
        const overallAvgScore = classesWithData.length > 0
          ? Math.round(classesWithData.reduce((sum, c) => sum + c.avgScore, 0) / classesWithData.length)
          : 0;
        
        const overallLevel = overallAvgScore >= 85 ? "exceeding" : overallAvgScore >= 70 ? "meeting" : overallAvgScore >= 50 ? "approaching" : "below";

        return {
          teacherId: teacher._id,
          teacherName: teacher.name,
          email: teacher.email,
          subjects: teacher.teacherSubjects || [],
          classCount: teacherClasses.length,
          studentCount: studentIds.size,
          totalQuizzes: allSessions.length,
          overallAvgScore,
          overallPerformanceLevel: overallLevel,
          classPerformance,
          performanceBreakdown: {
            exceeding: classPerformance.filter(c => c.performanceLevel === "exceeding").length,
            meeting: classPerformance.filter(c => c.performanceLevel === "meeting").length,
            approaching: classPerformance.filter(c => c.performanceLevel === "approaching").length,
            below: classPerformance.filter(c => c.performanceLevel === "below").length,
            noData: classPerformance.filter(c => !c.hasData).length,
          }
        };
      })
    );

    return teacherPerformance;
  },
});

