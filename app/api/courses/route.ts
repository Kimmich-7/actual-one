import { NextResponse } from "next/server"
import { db } from "@/lib/db"

function parseGrades(value: unknown): string[] {
  // MySQL might return:
  // - JSON string like '["Grade 4","Grade 5"]'
  // - already-parsed array (rare)
  // - comma-separated string like "Grade 4, Grade 5"
  if (Array.isArray(value)) return value.map(String)

  if (typeof value === "string") {
    const trimmed = value.trim()
    if (!trimmed) return []

    // Try JSON first
    try {
      const parsed = JSON.parse(trimmed)
      if (Array.isArray(parsed)) return parsed.map(String)
    } catch {
      // fallback CSV
      return trimmed
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    }
  }

  return []
}

export async function GET() {
  try {
    // ✅ Only select columns we KNOW exist from your MySQL screenshot:
    // _id, title, availableForGrades
    const [rows] = await db.query(
      "SELECT _id, title, availableForGrades FROM courses ORDER BY title ASC"
    )

    const list = Array.isArray(rows) ? rows : []

    const courses = list.map((c: any) => ({
      _id: String(c._id),
      title: String(c.title ?? ""),
      description: "", // not in DB yet
      difficulty: "",  // not in DB yet
      category: "",    // not in DB yet
      isActive: true,  // assume active unless you add a column later
      availableForGrades: parseGrades(c.availableForGrades),
    }))

    return NextResponse.json({ ok: true, courses })
  } catch (err: any) {
    console.error("GET /api/courses failed:", err)
    return NextResponse.json(
      {
        ok: false,
        message: "Failed to load courses",
        details: err?.message || String(err),
      },
      { status: 500 }
    )
  }
}