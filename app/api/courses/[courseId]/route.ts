import { NextResponse } from "next/server"
import { db } from "@/lib/db"

function normalizeAvailableForGrades(raw: any): string[] {
  try {
    if (Array.isArray(raw)) return raw.map(String)
    if (typeof raw === "string") return JSON.parse(raw).map(String)
  } catch {}
  return []
}

export async function GET(_req: Request, ctx: { params?: any }) {
  try {
    // ✅ works whether your folder param is [courseId] or [Id] or [id]
    const raw =
      ctx?.params?.courseId ??
      ctx?.params?.Id ??
      ctx?.params?.id ??
      ""

    const courseId = decodeURIComponent(String(raw)).trim()

    if (!courseId || courseId === "undefined" || courseId === "null") {
      return NextResponse.json({ ok: false, message: "Invalid course id" }, { status: 400 })
    }

    // ✅ Only select columns that exist (but SELECT * is fine if your table is stable)
    let [rows] = await db.query<any[]>(
      "SELECT * FROM courses WHERE _id = ? LIMIT 1",
      [courseId]
    )

    if (!rows || rows.length === 0) {
      ;[rows] = await db.query<any[]>(
        "SELECT * FROM courses WHERE id = ? LIMIT 1",
        [courseId]
      )
    }

    const course = rows?.[0]
    if (!course) {
      return NextResponse.json(
        { ok: false, message: "Course not found", requestedId: courseId },
        { status: 404 }
      )
    }

    return NextResponse.json({
      ok: true,
      course: {
        ...course,
        availableForGrades: normalizeAvailableForGrades(course.availableForGrades),
      },
    })
  } catch (err: any) {
    console.error("GET /api/courses/[id] failed:", err)
    return NextResponse.json(
      { ok: false, message: "Failed to load course", details: String(err?.message || err) },
      { status: 500 }
    )
  }
}