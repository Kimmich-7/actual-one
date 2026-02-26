import { mutation } from "./_generated/server";
import { v } from "convex/values";

// Create dummy accounts for testing
export const createDummyAccounts = mutation({
  args: {},
  handler: async (ctx) => {
    // Create dummy teachers
    const teacher1Id = await ctx.db.insert("users", {
      name: "John Smith",
      email: "john.teacher@jsps.ac.ke",
      username: "teacher1",
      password: "teacher123",
      grade: "Teacher",
      role: "teacher",
      teacherSubjects: ["Mathematics", "Computer Science"],
      assignedClasses: [],
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    const teacher2Id = await ctx.db.insert("users", {
      name: "Mary Johnson",
      email: "mary.teacher@jsps.ac.ke",
      username: "teacher2",
      password: "teacher123",
      grade: "Teacher",
      role: "teacher",
      teacherSubjects: ["English", "Science"],
      assignedClasses: [],
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    // Create dummy students
    const student1Id = await ctx.db.insert("users", {
      name: "Alice Brown",
      email: "alice.student@jsps.ac.ke",
      username: "student1",
      password: "student123",
      grade: "Grade 5",
      class: "Grade 5A",
      role: "student",
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    const student2Id = await ctx.db.insert("users", {
      name: "Bob Wilson",
      email: "bob.student@jsps.ac.ke",
      username: "student2",
      password: "student123",
      grade: "Grade 6",
      class: "Grade 6B",
      role: "student",
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    const student3Id = await ctx.db.insert("users", {
      name: "Carol Davis",
      email: "carol.student@jsps.ac.ke",
      username: "student3",
      password: "student123",
      grade: "Grade 5",
      class: "Grade 5A",
      role: "student",
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    // Create dummy parents
    const parent1Id = await ctx.db.insert("users", {
      name: "Robert Brown",
      email: "robert.parent@jsps.ac.ke",
      username: "parent1",
      password: "parent123",
      grade: "Parent",
      role: "parent",
      parentOf: student1Id,
      childrenIds: [student1Id],
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    const parent2Id = await ctx.db.insert("users", {
      name: "Susan Wilson",
      email: "susan.parent@jsps.ac.ke",
      username: "parent2",
      password: "parent123",
      grade: "Parent",
      role: "parent",
      parentOf: student2Id,
      childrenIds: [student2Id],
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    // Create dummy classes
    const class5AId = await ctx.db.insert("classes", {
      name: "Grade 5A",
      grade: "Grade 5",
      students: [student1Id, student3Id],
      teacherId: teacher1Id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const class6BId = await ctx.db.insert("classes", {
      name: "Grade 6B",
      grade: "Grade 6",
      students: [student2Id],
      teacherId: teacher2Id,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    // Update teachers with assigned classes
    await ctx.db.patch(teacher1Id, {
      assignedClasses: [class5AId],
    });

    await ctx.db.patch(teacher2Id, {
      assignedClasses: [class6BId],
    });

    // Create admin account
    const adminId = await ctx.db.insert("users", {
      name: "Admin User",
      email: "admin@jsps.ac.ke",
      username: "admin",
      password: "admin123",
      grade: "Admin",
      role: "admin",
      isApproved: true,
      registrationDate: Date.now(),
      approvalDate: Date.now(),
    });

    return {
      success: true,
      message: "Dummy accounts created successfully",
      accounts: {
        admin: { username: "admin", password: "admin123" },
        teachers: [
          { username: "teacher1", password: "teacher123", name: "John Smith" },
          { username: "teacher2", password: "teacher123", name: "Mary Johnson" }
        ],
        parents: [
          { username: "parent1", password: "parent123", name: "Robert Brown" },
          { username: "parent2", password: "parent123", name: "Susan Wilson" }
        ],
        students: [
          { username: "student1", password: "student123", name: "Alice Brown" },
          { username: "student2", password: "student123", name: "Bob Wilson" },
          { username: "student3", password: "student123", name: "Carol Davis" }
        ]
      }
    };
  },
});