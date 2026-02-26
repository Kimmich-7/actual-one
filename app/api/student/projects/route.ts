import { NextResponse } from "next/server"
import { db } from "@/lib/db"

async function safeJsonErr(err: any) {
  return {
    ok: false,
    message: "Failed to load projects",
    details: err?.message || String(err),
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)

    const studentId = (searchParams.get("studentId") || "").trim()
    const studentEmail = (searchParams.get("studentEmail") || "").trim()
    const studentName = (searchParams.get("studentName") || "").trim()

    // Require at least one identifier
    if (!studentId && !studentEmail && !studentName) {
      return NextResponse.json(
        { ok: false, message: "studentId OR studentEmail OR studentName is required" },
        { status: 400 }
      )
    }

    // Build WHERE dynamically
    const where: string[] = []
    const params: any[] = []

    if (studentId) {
      where.push(`studentId = ?`)
      params.push(studentId)
    }
    if (studentEmail) {
      where.push(`studentEmail = ?`)
      params.push(studentEmail)
    }
    if (studentName) {
      where.push(`studentName = ?`)
      params.push(studentName)
    }

    // Note: OR is intentional so we catch older data keyed differently
    const whereSql = where.length ? `(${where.join(" OR ")})` : "1=0"

    const [rows] = await db.query(
      `
      SELECT
        _id,
        title,
        courseId,
        cStatus,
        submissionDate,
        projectUrl,
        _creationTime,
        studentId,
        studentEmail,
        studentName,
        studentGrade,
        pLanguage
      FROM projects
      WHERE ${whereSql}
      ORDER BY
        -- prefer real submissionDate, otherwise creationTime
        COALESCE(NULLIF(submissionDate, ''), NULLIF(_creationTime, '')) DESC
      LIMIT 5000
      `,
      params
    )

    const projects = (rows as any[]).map((p) => ({
      _id: String(p._id),
      title: String(p.title || "Untitled"),
      courseId: String(p.courseId || ""),
      status: String(p.cStatus || "saved"),
      submissionDate: p.submissionDate || p._creationTime || "",
      projectUrl: String(p.projectUrl || ""),
      // extras (optional, helpful for debugging/UI)
      studentId: String(p.studentId || ""),
      studentEmail: String(p.studentEmail || ""),
      studentName: String(p.studentName || ""),
      studentGrade: String(p.studentGrade || ""),
      pLanguage: String(p.pLanguage || ""),
    }))

    return NextResponse.json({ ok: true, projects })
  } catch (err: any) {
    console.error("GET /api/student/projects failed:", err)
    return NextResponse.json(await safeJsonErr(err), { status: 500 })
  }
}