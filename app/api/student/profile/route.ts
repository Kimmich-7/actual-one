import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const username = (searchParams.get("username") || "").trim()

    if (!username) {
      return NextResponse.json({ ok: false, message: "username is required" }, { status: 400 })
    }

    // Adjust table/columns if your users table uses different names.
    // From your earlier notes you have uName / uPassword. Grade column might be grade or studentGrade.
    const [rows] = await db.query(
      `SELECT _id, username, uName, grade
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    )

    const list = Array.isArray(rows) ? rows : []
    const u = list[0]

    if (!u) {
      return NextResponse.json({ ok: false, message: "Student not found" }, { status: 404 })
    }

    return NextResponse.json({
      ok: true,
      student: {
        _id: String(u._id),
        username: String(u.username),
        name: String(u.uName ?? "Student"),
        grade: String(u.grade ?? "Grade 1"),
      },
    })
  } catch (err: any) {
    console.error("GET /api/student/profile failed:", err)
    return NextResponse.json(
      { ok: false, message: "Failed to load student profile", details: err?.message || String(err) },
      { status: 500 }
    )
  }
}