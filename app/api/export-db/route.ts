import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;
    if (!url) {
      return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_CONVEX_URL missing" }, { status: 500 });
    }

    const client = new ConvexHttpClient(url);

    // ✅ Only call functions that already exist in your deployed backend
    const [
      courses,
      approvedStudents,
      pendingStudents,
      leaderboardStudents,
      classesWithDetails,
    ] = await Promise.all([
      client.query("courses:listCourses", {}),
      client.query("users:getAllApprovedStudents", {}),
      client.query("users:getPendingStudents", {}),
      client.query("users:getAllStudentsWithQuizScores", {}),
      client.query("users:getAllClasses", {}),
    ]);

    return NextResponse.json({
      ok: true,
      exportedAt: Date.now(),
      counts: {
        courses: Array.isArray(courses) ? courses.length : null,
        approvedStudents: Array.isArray(approvedStudents) ? approvedStudents.length : null,
        pendingStudents: Array.isArray(pendingStudents) ? pendingStudents.length : null,
        leaderboardStudents: Array.isArray(leaderboardStudents) ? leaderboardStudents.length : null,
        classes: Array.isArray(classesWithDetails) ? classesWithDetails.length : null,
      },
      data: {
        courses,
        approvedStudents,
        pendingStudents,
        leaderboardStudents,
        classesWithDetails,
      },
    });
  } catch (err: any) {
    return NextResponse.json(
      { ok: false, error: err?.message ?? String(err), stack: err?.stack ?? null },
      { status: 500 }
    );
  }
}
