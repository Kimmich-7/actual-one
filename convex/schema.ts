
import { defineSchema, defineTable } from "convex/server"
import { v } from "convex/values"
import { authTables } from "@convex-dev/auth/server"

export default defineSchema({
  ...authTables,
  users: defineTable({
    name: v.string(), // Required - student's full name
    username: v.optional(v.string()), // Optional for existing users, required for new ones
    password: v.optional(v.string()), // Password for enhanced security
    image: v.optional(v.string()),
    email: v.optional(v.string()),
    emailVerificationTime: v.optional(v.number()),
    phone: v.optional(v.string()),
    phoneVerificationTime: v.optional(v.number()),
    isAnonymous: v.optional(v.boolean()),
    role: v.optional(v.string()), // "student", "admin", "teacher", "parent"
    // Student-specific fields
    grade: v.string(), // Required - "Grade 1", "Grade 2", etc.
    class: v.optional(v.string()), // Class name like "5A", "6B", etc.
    school: v.optional(v.string()),
    parentEmail: v.optional(v.string()),
    dateOfBirth: v.optional(v.string()),
    registrationDate: v.optional(v.number()),
    lastLoginTime: v.optional(v.number()), // Track when user last logged in
    // Admin approval system
    isApproved: v.optional(v.boolean()), // Default false, admin must approve
    approvedBy: v.optional(v.id("users")), // Admin who approved
    approvalDate: v.optional(v.number()),
    // Temporary password field for admin accounts
    tempPassword: v.optional(v.string()),
    // Teacher-specific fields
    teacherSubjects: v.optional(v.array(v.string())), // Subjects taught
    assignedClasses: v.optional(v.array(v.id("classes"))), // Classes assigned to teacher
    // Parent-specific fields
    childrenIds: v.optional(v.array(v.id("users"))), // For parents - their children's IDs
    parentOf: v.optional(v.id("users")), // For linking parent to specific student
  })
    .index("email", ["email"])
    .index("username", ["username"]), // Add index for username lookups

  classes: defineTable({
    name: v.string(), // e.g., "Grade 1", "Grade 2A", etc.
    grade: v.string(), // e.g., "Grade 1", "Grade 2"
    students: v.array(v.id("users")), // Array of student IDs
    teacherId: v.optional(v.id("users")), // Assigned teacher for this class
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  courses: defineTable({
    title: v.string(),
    description: v.string(),
    icon: v.optional(v.string()), // URL to course icon
    category: v.string(), // "programming", "design", "games", etc.
    difficulty: v.string(), // "beginner", "intermediate", "advanced"
    estimatedHours: v.optional(v.number()),
    isActive: v.boolean(), // true = available, false = coming soon (grey)
    // Grade-based availability
    availableForGrades: v.array(v.string()), // ["Grade 1", "Grade 2", "Grade 3"]
    prerequisites: v.optional(v.array(v.string())), // Course IDs that must be completed first
    editorUrl: v.optional(v.string()), // URL to external editor (like Scratch Jr)
    createdAt: v.number(),
    updatedAt: v.number(),
  }),

  lessons: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.string(),
    content: v.string(), // HTML or markdown content
    videoUrl: v.optional(v.string()),
    order: v.number(), // Lesson order within the course
    isActive: v.boolean(),
    createdAt: v.number(),
  }).index("by_course", ["courseId"]),

  projects: defineTable({
    studentId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    title: v.string(),
    description: v.optional(v.string()),
    projectUrl: v.string(), // Link to the student's project
    codeContent: v.optional(v.string()), // The actual code written by student
    language: v.optional(v.string()), // Programming language used
    submissionDate: v.number(),
    status: v.string(), // "submitted", "reviewed", "approved"
    grade: v.optional(v.string()), // Grade given by teacher
    feedback: v.optional(v.string()),
    // Metadata for filtering
    studentGrade: v.string(), // Student's grade level at time of submission
    studentName: v.string(),
    studentEmail: v.string(),
  })
    .index("by_student", ["studentId"])
    .index("by_course", ["courseId"])
    .index("by_grade", ["studentGrade"])
    .index("by_submission_date", ["submissionDate"]),

  studentProgress: defineTable({
    studentId: v.id("users"),
    courseId: v.id("courses"),
    lessonId: v.optional(v.id("lessons")),
    status: v.string(), // "not_started", "in_progress", "completed"
    completionDate: v.optional(v.number()),
    timeSpent: v.optional(v.number()), // in minutes
    lastAccessedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_course", ["courseId"])
    .index("by_student_course", ["studentId", "courseId"]),

  announcements: defineTable({
    title: v.string(),
    content: v.string(),
    targetGrades: v.optional(v.array(v.string())), // If empty, visible to all
    isActive: v.boolean(),
    createdBy: v.id("users"),
    createdAt: v.number(),
    expiresAt: v.optional(v.number()),
  }).index("by_created_at", ["createdAt"]),

  // Quiz and Question Management
  quizzes: defineTable({
    courseId: v.id("courses"),
    title: v.string(),
    description: v.optional(v.string()),
    strand: v.optional(v.string()), // Main topic/strand
    subStrand: v.optional(v.string()), // Sub-topic/sub-strand
    questions: v.array(v.id("questions")), // Array of question IDs
    timeLimit: v.optional(v.number()), // Time limit in minutes
    passingScore: v.optional(v.number()), // Minimum score to pass (percentage)
    isActive: v.boolean(),
    createdBy: v.id("users"), // Admin who created the quiz
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_course", ["courseId"])
    .index("by_course_strand", ["courseId", "strand"])
    .index("by_course_strand_substrand", ["courseId", "strand", "subStrand"]),

  questions: defineTable({
    courseId: v.id("courses"),
    quizId: v.optional(v.id("quizzes")), // Link to specific quiz
    question: v.string(),
    options: v.array(v.string()), // Multiple choice options
    correctAnswer: v.number(), // Index of correct option
    explanation: v.optional(v.string()),
    difficulty: v.string(), // "easy", "medium", "hard"
    points: v.optional(v.number()), // Points for this question
    createdBy: v.id("users"), // Admin who created the question
    createdAt: v.number(),
    updatedAt: v.number(),
  }).index("by_course", ["courseId"])
    .index("by_quiz", ["quizId"]),

  quizAttempts: defineTable({
    studentId: v.id("users"),
    courseId: v.id("courses"),
    quizId: v.id("quizzes"),
    questionId: v.id("questions"),
    selectedAnswer: v.number(),
    isCorrect: v.boolean(),
    points: v.optional(v.number()),
    attemptedAt: v.number(),
    timeSpent: v.optional(v.number()), // in seconds
  })
    .index("by_student", ["studentId"])
    .index("by_course", ["courseId"])
    .index("by_quiz", ["quizId"])
    .index("by_student_quiz", ["studentId", "quizId"]),

  quizSessions: defineTable({
    studentId: v.id("users"),
    courseId: v.id("courses"),
    quizId: v.id("quizzes"),
    totalQuestions: v.number(),
    correctAnswers: v.number(),
    totalPoints: v.optional(v.number()),
    earnedPoints: v.optional(v.number()),
    score: v.number(), // percentage
    performance: v.string(), // "below", "meeting", "exceeding"
    completedAt: v.number(),
    timeSpent: v.number(), // total time in seconds
    startedAt: v.number(),
  })
    .index("by_student", ["studentId"])
    .index("by_course", ["courseId"])
    .index("by_quiz", ["quizId"])
    .index("by_student_course", ["studentId", "courseId"])
    .index("by_performance", ["performance"]),

  // Course Notes with Strand/Sub-strand organization
  courseNotes: defineTable({
    courseId: v.id("courses"),
    strand: v.string(), // Main topic/strand
    subStrand: v.string(), // Sub-topic/sub-strand
    title: v.string(),
    content: v.string(), // Note content (markdown or HTML)
    images: v.optional(v.array(v.id("_storage"))), // Array of image storage IDs
    createdBy: v.id("users"), // Admin who created the note
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_course", ["courseId"])
    .index("by_course_strand", ["courseId", "strand"])
    .index("by_course_strand_substrand", ["courseId", "strand", "subStrand"]),

  // Teacher Curriculum
  curriculum: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    courseId: v.optional(v.id("courses")), // Link to specific course if needed
    fileStorageId: v.optional(v.id("_storage")), // File stored in Convex storage
    fileUrl: v.optional(v.string()), // Alternative: external URL
    fileName: v.string(),
    fileType: v.string(), // "pdf", "doc", "pptx", etc.
    uploadedBy: v.id("users"), // Teacher or admin who uploaded
    uploadedAt: v.number(),
    isActive: v.boolean(),
    targetGrades: v.optional(v.array(v.string())), // Which grades this applies to
    term: v.optional(v.string()), // "Term 1", "Term 2", "Term 3"
  })
    .index("by_course", ["courseId"])
    .index("by_uploaded_by", ["uploadedBy"]),

  // Archived Students
  archivedStudents: defineTable({
    originalUserId: v.id("users"), // Reference to original user record
    name: v.string(),
    username: v.optional(v.string()),
    email: v.optional(v.string()),
    grade: v.string(),
    class: v.optional(v.string()),
    school: v.optional(v.string()),
    registrationDate: v.optional(v.number()),
    archivedAt: v.number(),
    archivedBy: v.id("users"), // Admin who archived
    reason: v.optional(v.string()),
    // Preserve important data
    totalQuizzes: v.optional(v.number()),
    averageScore: v.optional(v.number()),
    totalProjects: v.optional(v.number()),
    completedCourses: v.optional(v.number()),
  })
    .index("by_archived_at", ["archivedAt"])
    .index("by_grade", ["grade"]),

  // Exams (Legacy - file-based)
  exams: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    grade: v.string(), // Target grade
    term: v.string(), // "Term 1", "Term 2", "Term 3"
    courseId: v.optional(v.id("courses")), // Optional course association
    fileStorageId: v.optional(v.id("_storage")), // Exam file
    fileUrl: v.optional(v.string()),
    fileName: v.string(),
    fileType: v.string(),
    startDate: v.optional(v.number()), // When exam becomes available
    endDate: v.optional(v.number()), // When exam closes
    uploadedBy: v.id("users"),
    uploadedAt: v.number(),
    isActive: v.boolean(),
  })
    .index("by_grade", ["grade"])
    .index("by_term", ["term"])
    .index("by_grade_term", ["grade", "term"]),

  // Assessments (Question-based exams)
  assessments: defineTable({
    title: v.string(),
    description: v.optional(v.string()),
    grade: v.string(), // Target grade (e.g., "Grade 5")
    term: v.string(), // "Term 1", "Term 2", "Term 3"
    classId: v.optional(v.id("classes")), // Optional: specific class
    className: v.optional(v.string()), // Class name for filtering
    timeLimit: v.number(), // Time limit in minutes (default 60)
    totalQuestions: v.number(), // Number of questions
    totalPoints: v.number(), // Total possible points
    createdBy: v.id("users"),
    createdAt: v.number(),
    updatedAt: v.number(),
    isActive: v.boolean(), // Whether assessment is currently available
  })
    .index("by_grade", ["grade"])
    .index("by_term", ["term"])
    .index("by_grade_term", ["grade", "term"])
    .index("by_grade_term_class", ["grade", "term", "className"])
    .index("by_active", ["isActive"]),

  // Assessment Questions
  assessmentQuestions: defineTable({
    assessmentId: v.id("assessments"),
    question: v.string(),
    options: v.array(v.string()), // Multiple choice options
    correctAnswer: v.number(), // Index of correct option (0-based)
    points: v.number(), // Points for this question
    order: v.number(), // Question order
    createdAt: v.number(),
  })
    .index("by_assessment", ["assessmentId"])
    .index("by_assessment_order", ["assessmentId", "order"]),

  // Assessment Sessions (Student attempts)
  assessmentSessions: defineTable({
    studentId: v.id("users"),
    assessmentId: v.id("assessments"),
    studentName: v.string(),
    studentGrade: v.string(),
    studentClass: v.optional(v.string()),
    startedAt: v.number(),
    completedAt: v.optional(v.number()),
    timeSpent: v.optional(v.number()), // Time spent in seconds
    answers: v.array(v.object({
      questionId: v.id("assessmentQuestions"),
      selectedAnswer: v.number(),
      isCorrect: v.boolean(),
      points: v.number(), // Points earned for this question
    })),
    totalCorrect: v.number(),
    totalPoints: v.number(), // Points earned
    maxPoints: v.number(), // Maximum possible points
    score: v.number(), // Percentage score
    isCompleted: v.boolean(),
  })
    .index("by_student", ["studentId"])
    .index("by_assessment", ["assessmentId"])
    .index("by_student_assessment", ["studentId", "assessmentId"])
    .index("by_completed", ["isCompleted"])
    .index("by_grade", ["studentGrade"])
    .index("by_class", ["studentClass"]),
})





