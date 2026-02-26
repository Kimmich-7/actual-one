import { query, mutation, internalAction, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { Doc } from "./_generated/dataModel";
import { internal } from "./_generated/api";

// Submit a project with custom authentication (username-based)
export const submitProjectWithCustomAuth = mutation({
  args: {
    username: v.string(), // Username for custom auth
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    title: v.string(),
    description: v.optional(v.string()),
    projectUrl: v.string(),
    codeContent: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("submitProjectWithCustomAuth called with args:", args);
    
    // Find user by username instead of using Convex auth
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    
    console.log("User found by username:", user);
    
    if (!user) {
      console.log("User not found for username:", args.username);
      throw new Error("User not found");
    }
    
    if (user.role !== "student") {
      console.log("User role is not student:", user.role);
      throw new Error("Only students can submit projects");
    }

    console.log("Creating project document...");
    const projectId = await ctx.db.insert("projects", {
      studentId: user._id,
      courseId: args.courseId,
      lessonId: args.lessonId,
      title: args.title,
      description: args.description,
      projectUrl: args.projectUrl,
      codeContent: args.codeContent,
      language: args.language,
      submissionDate: Date.now(),
      status: "submitted",
      studentGrade: user.grade || "Unknown",
      studentName: user.name || "Unknown",
      studentEmail: user.email || "Unknown",
    });

    console.log("Project created with ID:", projectId);

    // Schedule Google Sheets integration and email notification
    try {
      await ctx.scheduler.runAfter(0, internal.projects.saveToGoogleSheets, {
        projectId: projectId,
      });
      console.log("Scheduled Google Sheets save");
    } catch (error) {
      console.error("Failed to schedule Google Sheets save:", error);
      // Don't fail the whole operation if this fails
    }

    return projectId;
  },
});

// Submit a project
export const submitProject = mutation({
  args: {
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    title: v.string(),
    description: v.optional(v.string()),
    projectUrl: v.string(),
    codeContent: v.optional(v.string()),
    language: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    console.log("submitProject called with args:", args);
    
    const userId = await getAuthUserId(ctx);
    console.log("User ID from auth:", userId);
    
    if (!userId) {
      console.log("No authenticated user found");
      throw new Error("Not authenticated");
    }

    const user = await ctx.db.get(userId);
    console.log("User document:", user);
    
    if (!user) {
      console.log("User document not found for ID:", userId);
      throw new Error("User not found");
    }
    
    if (user.role !== "student") {
      console.log("User role is not student:", user.role);
      throw new Error("Only students can submit projects");
    }

    console.log("Creating project document...");
    const projectId = await ctx.db.insert("projects", {
      studentId: userId,
      courseId: args.courseId,
      lessonId: args.lessonId,
      title: args.title,
      description: args.description,
      projectUrl: args.projectUrl,
      codeContent: args.codeContent,
      language: args.language,
      submissionDate: Date.now(),
      status: "submitted",
      studentGrade: user.grade ? `Grade ${user.grade}` : "Unknown",
      studentName: user.name || "Unknown",
      studentEmail: user.email || "Unknown",
    });

    console.log("Project created with ID:", projectId);

    // Schedule Google Sheets integration and email notification
    try {
      await ctx.scheduler.runAfter(0, internal.projects.saveToGoogleSheets, {
        projectId: projectId,
      });
      console.log("Scheduled Google Sheets save");
    } catch (error) {
      console.error("Failed to schedule Google Sheets save:", error);
      // Don't fail the whole operation if this fails
    }

    return projectId;
  },
});

// Get student's own projects
export const getMyProjects = query({
  args: {},
  handler: async (ctx) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_student", (q) => q.eq("studentId", userId))
      .order("desc")
      .collect();

    return projects;
  },
});

// Get all projects (for admin with filtering) - Simple version without auth
export const getAllProjectsSimple = query({
  args: {
    gradeFilter: v.optional(v.string()),
    courseFilter: v.optional(v.id("courses")),
    classFilter: v.optional(v.string()),
    studentFilter: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    let projects = await ctx.db.query("projects").collect();

    // Get additional data for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const student = await ctx.db.get(project.studentId);
        const course = await ctx.db.get(project.courseId);
        
        return {
          ...project,
          studentName: student?.name || "Unknown Student",
          studentGrade: student?.grade || "Unknown Grade",
          studentClass: student?.class || student?.grade || "Unknown Class",
          courseName: course?.title || "Unknown Course",
        };
      })
    );

    // Apply filters
    let filteredProjects = projectsWithDetails;

    if (args.gradeFilter) {
      filteredProjects = filteredProjects.filter(p => p.studentGrade === args.gradeFilter);
    }

    if (args.courseFilter) {
      filteredProjects = filteredProjects.filter(p => p.courseId === args.courseFilter);
    }

    if (args.classFilter) {
      filteredProjects = filteredProjects.filter(p => p.studentClass === args.classFilter);
    }

    if (args.studentFilter) {
      filteredProjects = filteredProjects.filter(p => p.studentId === args.studentFilter);
    }

    return filteredProjects.sort((a, b) => b.submissionDate - a.submissionDate);
  },
});

// Get all projects (for admin with filtering)
export const getAllProjects = query({
  args: {
    gradeFilter: v.optional(v.string()),
    courseFilter: v.optional(v.id("courses")),
    classFilter: v.optional(v.string()),
    studentFilter: v.optional(v.id("users")),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) return [];

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") return [];

    let projects = await ctx.db.query("projects").collect();

    // Get additional data for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const student = await ctx.db.get(project.studentId);
        const course = await ctx.db.get(project.courseId);
        
        return {
          ...project,
          studentName: student?.name || "Unknown Student",
          studentGrade: student?.grade || "Unknown Grade",
          studentClass: student?.class || student?.grade || "Unknown Class",
          courseName: course?.title || "Unknown Course",
        };
      })
    );

    // Apply filters
    let filteredProjects = projectsWithDetails;

    if (args.gradeFilter) {
      filteredProjects = filteredProjects.filter(p => p.studentGrade === args.gradeFilter);
    }

    if (args.courseFilter) {
      filteredProjects = filteredProjects.filter(p => p.courseId === args.courseFilter);
    }

    if (args.classFilter) {
      filteredProjects = filteredProjects.filter(p => p.studentClass === args.classFilter);
    }

    if (args.studentFilter) {
      filteredProjects = filteredProjects.filter(p => p.studentId === args.studentFilter);
    }

    return filteredProjects.sort((a, b) => b.submissionDate - a.submissionDate);
  },
});

// Get projects by grade (for admin filtering)
export const getProjectsByGrade = query({
  args: { grade: v.string() },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) {
      return { ok: false, code: "FORBIDDEN", message: "You must be an admin to view projects by grade." };
    }

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      return { ok: false, code: "FORBIDDEN", message: "You must be an admin to view projects by grade." };
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_grade", (q) => q.eq("studentGrade", args.grade))
      .order("desc")
      .collect();

    return { ok: true, projects };
  },
});

// Update project status (for admin)
export const updateProjectStatus = mutation({
  args: {
    projectId: v.id("projects"),
    status: v.string(),
    grade: v.optional(v.string()),
    feedback: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can update project status");
    }

    await ctx.db.patch(args.projectId, {
      status: args.status,
      grade: args.grade,
      feedback: args.feedback,
    });

    return { success: true };
  },
});

// Delete project (for admin)
export const deleteProject = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Not authenticated");

    const user = await ctx.db.get(userId);
    if (!user || user.role !== "admin") {
      throw new Error("Only admins can delete projects");
    }

    await ctx.db.delete(args.projectId);
    return { success: true };
  },
});

// Simple version for admin portal (no auth required)
export const deleteProjectSimple = mutation({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.projectId);
    return { success: true };
  },
});

// Get student projects by username (for student editing)
export const getStudentProjects = query({
  args: { username: v.string() },
  handler: async (ctx, args) => {
    // Find user by username
    const user = await ctx.db
      .query("users")
      .withIndex("username", (q) => q.eq("username", args.username))
      .first();
    
    if (!user || user.role !== "student") {
      return [];
    }

    const projects = await ctx.db
      .query("projects")
      .withIndex("by_student", (q) => q.eq("studentId", user._id))
      .order("desc")
      .collect();

    // Get course details for each project
    const projectsWithDetails = await Promise.all(
      projects.map(async (project) => {
        const course = await ctx.db.get(project.courseId);
        return {
          ...project,
          courseName: course?.title || "Unknown Course",
        };
      })
    );

    return projectsWithDetails;
  },
});

// Get a single project by ID (for editing)
export const getProjectById = query({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) return null;
    
    // Get course details
    const course = await ctx.db.get(project.courseId);
    
    return {
      ...project,
      courseName: course?.title || "Unknown Course",
    };
  },
});

// Update project (for student editing)
export const updateProject = mutation({
  args: {
    projectId: v.id("projects"),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    projectUrl: v.optional(v.string()),
    codeContent: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    const { projectId, ...updates } = args;
    const filteredUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await ctx.db.patch(projectId, {
      ...filteredUpdates,
      submissionDate: Date.now(), // Update submission date when edited
    });

    return { success: true };
  },
});

// Internal action to save project to Google Sheets and send email notification
export const saveToGoogleSheets = internalAction({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    "use node";

    // Get the project details
    const project = await ctx.runQuery(internal.projects.getProjectDetails, {
      projectId: args.projectId,
    });

    if (!project) {
      console.error("Project not found:", args.projectId);
      return;
    }

    try {
      // Create Google Sheets entry
      const sheetsData = {
        timestamp: new Date().toISOString(),
        studentName: project.studentName,
        studentEmail: project.studentEmail,
        studentGrade: project.studentGrade,
        projectTitle: project.title,
        courseId: project.courseId,
        language: project.language || "Unknown",
        projectUrl: project.projectUrl,
        submissionDate: new Date(project.submissionDate).toISOString(),
        status: project.status,
      };

      // Save to Google Sheets (if webhook URL is configured)
      if (process.env.GOOGLE_SHEETS_WEBHOOK_URL) {
        const sheetsResponse = await fetch(process.env.GOOGLE_SHEETS_WEBHOOK_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(sheetsData),
        });

        if (sheetsResponse.ok) {
          console.log("Project saved to Google Sheets successfully");
        } else {
          console.error("Failed to save to Google Sheets:", sheetsResponse.status);
        }
      }

      // Send email notification (if configured)
      if (process.env.EMAIL_NOTIFICATION_ENDPOINT && process.env.PROJECT_NOTIFICATION_EMAIL) {
        const emailResponse = await fetch(process.env.EMAIL_NOTIFICATION_ENDPOINT, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            toEmail: process.env.PROJECT_NOTIFICATION_EMAIL,
            subject: `New Project Submission: ${project.title}`,
            message: `New project submitted by ${project.studentName} (${project.studentEmail}):\n\nProject: ${project.title}\nGrade: ${project.studentGrade}\nLanguage: ${project.language}\nSubmission Date: ${new Date(project.submissionDate).toLocaleString()}\n\nProject URL: ${project.projectUrl}`,
            chatId: process.env.CHAT_ID!,
            appName: process.env.APP_NAME!,
            secretKey: process.env.SECRET_KEY!,
          }),
        });

        if (emailResponse.ok) {
          console.log("Email notification sent successfully");
        } else {
          console.error("Failed to send email notification:", emailResponse.status);
        }
      }

    } catch (error) {
      console.error("Error in saveToGoogleSheets:", error);
    }
  },
});

// Internal query to get project details
export const getProjectDetails = internalQuery({
  args: {
    projectId: v.id("projects"),
  },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});



