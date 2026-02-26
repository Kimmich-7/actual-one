import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface StudentReportData {
  student: {
    name: string;
    username?: string;
    grade: string;
    class?: string;
    registrationDate?: number;
  };
  teacher: {
    name: string;
    subjects?: string[];
  } | null;
  statistics: {
    totalQuizzes: number;
    averageQuizScore: number;
    totalProjects: number;
    approvedProjects: number;
    completedCourses: number;
    inProgressCourses: number;
  };
  quizPerformance: Array<{
    courseName: string;
    quizTitle: string;
    score: number;
    correctAnswers: number;
    totalQuestions: number;
    performance: string;
    completedAt: number;
    timeSpent: number;
  }>;
  projects: Array<{
    title: string;
    courseName: string;
    status: string;
    submissionDate: number;
    grade?: string;
    feedback?: string;
  }>;
  courseProgress: Array<{
    courseName: string;
    status: string;
    completionDate?: number;
    timeSpent?: number;
  }>;
}

export function generateStudentReportCard(data: StudentReportData): jsPDF {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  let yPosition = 20;

  // Header - School Logo and Title
  doc.setFillColor(59, 130, 246); // Blue color
  doc.rect(0, 0, pageWidth, 35, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("Juja St. Peters School", pageWidth / 2, 15, { align: "center" });

  doc.setFontSize(14);
  doc.setFont("helvetica", "normal");
  doc.text("Student Progress Report Card", pageWidth / 2, 25, {
    align: "center",
  });

  yPosition = 45;

  // Student Information Section
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Student Information", 15, yPosition);
  yPosition += 10;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Name: ${data.student.name}`, 15, yPosition);
  yPosition += 6;
  doc.text(`Grade: ${data.student.grade}`, 15, yPosition);
  yPosition += 6;
  if (data.student.class) {
    doc.text(`Class: ${data.student.class}`, 15, yPosition);
    yPosition += 6;
  }
  if (data.student.username) {
    doc.text(`Username: ${data.student.username}`, 15, yPosition);
    yPosition += 6;
  }

  // Teacher Information (right side)
  let teacherY = 55;
  if (data.teacher) {
    doc.setFontSize(11);
    doc.setFont("helvetica", "bold");
    doc.text(`Class Teacher: ${data.teacher.name}`, pageWidth - 15, teacherY, {
      align: "right",
    });
    teacherY += 6;
    if (data.teacher.subjects && data.teacher.subjects.length > 0) {
      doc.setFont("helvetica", "normal");
      doc.text(
        `Subjects: ${data.teacher.subjects.join(", ")}`,
        pageWidth - 15,
        teacherY,
        { align: "right" }
      );
    }
  }

  // Report Date
  doc.setFont("helvetica", "normal");
  doc.text(
    `Report Generated: ${new Date().toLocaleDateString()}`,
    pageWidth - 15,
    teacherY + 6,
    { align: "right" }
  );

  yPosition += 10;

  // Performance Summary Section
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Performance Summary", 15, yPosition);
  yPosition += 8;

  // Statistics Grid
  const stats = [
    ["Total Quizzes Completed", data.statistics.totalQuizzes.toString()],
    ["Average Quiz Score", `${data.statistics.averageQuizScore}%`],
    ["Total Projects Submitted", data.statistics.totalProjects.toString()],
    ["Approved Projects", data.statistics.approvedProjects.toString()],
    ["Completed Courses", data.statistics.completedCourses.toString()],
    ["In Progress Courses", data.statistics.inProgressCourses.toString()],
  ];

  autoTable(doc, {
    startY: yPosition,
    head: [["Metric", "Value"]],
    body: stats,
    theme: "grid",
    headStyles: {
      fillColor: [59, 130, 246],
      textColor: [255, 255, 255],
      fontStyle: "bold",
    },
    styles: {
      fontSize: 10,
      cellPadding: 3,
    },
    columnStyles: {
      0: { cellWidth: 120 },
      1: { cellWidth: 60, halign: "center" },
    },
  });

  yPosition = (doc as any).lastAutoTable.finalY + 15;

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // Quiz Performance Section
  if (data.quizPerformance.length > 0) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Quiz Performance", 15, yPosition);
    yPosition += 8;

    const quizData = data.quizPerformance.slice(0, 10).map((quiz) => [
      quiz.courseName,
      quiz.quizTitle,
      `${quiz.score}%`,
      `${quiz.correctAnswers}/${quiz.totalQuestions}`,
      quiz.performance.toUpperCase(),
      new Date(quiz.completedAt).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Course", "Quiz", "Score", "Correct", "Rating", "Date"]],
      body: quizData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "center" },
        4: { halign: "center" },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // Projects Section
  if (data.projects.length > 0) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Project Submissions", 15, yPosition);
    yPosition += 8;

    const projectData = data.projects.slice(0, 10).map((project) => [
      project.title,
      project.courseName,
      project.status.toUpperCase(),
      project.grade || "N/A",
      new Date(project.submissionDate).toLocaleDateString(),
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Project Title", "Course", "Status", "Grade", "Submitted"]],
      body: projectData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        2: { halign: "center" },
        3: { halign: "center" },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Check if we need a new page
  if (yPosition > pageHeight - 60) {
    doc.addPage();
    yPosition = 20;
  }

  // Course Progress Section
  if (data.courseProgress.length > 0) {
    doc.setFontSize(16);
    doc.setFont("helvetica", "bold");
    doc.text("Course Progress", 15, yPosition);
    yPosition += 8;

    const progressData = data.courseProgress.map((progress) => [
      progress.courseName,
      progress.status.toUpperCase().replace("_", " "),
      progress.timeSpent ? `${Math.round(progress.timeSpent)} min` : "N/A",
      progress.completionDate
        ? new Date(progress.completionDate).toLocaleDateString()
        : "In Progress",
    ]);

    autoTable(doc, {
      startY: yPosition,
      head: [["Course", "Status", "Time Spent", "Completion Date"]],
      body: progressData,
      theme: "striped",
      headStyles: {
        fillColor: [59, 130, 246],
        textColor: [255, 255, 255],
        fontStyle: "bold",
      },
      styles: {
        fontSize: 9,
        cellPadding: 2,
      },
      columnStyles: {
        1: { halign: "center" },
        2: { halign: "center" },
      },
    });

    yPosition = (doc as any).lastAutoTable.finalY + 15;
  }

  // Footer on last page
  const finalY = yPosition > pageHeight - 60 ? 20 : yPosition;
  if (finalY === 20) {
    doc.addPage();
  }

  doc.setFontSize(10);
  doc.setFont("helvetica", "italic");
  doc.setTextColor(100, 100, 100);
  doc.text(
    "This is an official report generated by Juja St. Peters School Coding Platform",
    pageWidth / 2,
    pageHeight - 20,
    { align: "center" }
  );

  // Page numbers on all pages
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `Page ${i} of ${pageCount}`,
      pageWidth - 15,
      pageHeight - 10,
      { align: "right" }
    );
  }

  return doc;
}

export function downloadReportCard(doc: jsPDF, studentName: string) {
  const fileName = `${studentName.replace(/\s+/g, "_")}_Report_Card_${
    new Date().toISOString().split("T")[0]
  }.pdf`;
  doc.save(fileName);
}
