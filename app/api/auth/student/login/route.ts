import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const username = String(body?.username ?? "").trim()
    const password = String(body?.password ?? "")

    if (!username || !password) {
      return NextResponse.json({ ok: false, message: "Username and password are required." }, { status: 400 })
    }

    const [rows] = await db.query(
      `SELECT _id, uName, uRole, username, uPassword, isApproved
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username],
    )

    const user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null

    if (!user) {
      return NextResponse.json({ ok: false, message: "Invalid username or password." }, { status: 401 })
    }

    // student-only login
    if (String(user.uRole || "").toLowerCase() !== "student") {
      return NextResponse.json({ ok: false, message: "This login is for students only." }, { status: 403 })
    }

    // approval check (optional but recommended) – comment out if your school wants open access
    const approvedVal = String(user.isApproved ?? "").toLowerCase()
    const isApproved = approvedVal === "true" || approvedVal === "1" || approvedVal === "yes"
    if (!isApproved) {
      return NextResponse.json({ ok: false, message: "Account not approved yet. Please contact the administrator." }, { status: 403 })
    }

    // Password check (plain text because your DB currently stores uPassword plainly)
    // Later we can migrate to hashing.
    if (String(user.uPassword) !== password) {
      return NextResponse.json({ ok: false, message: "Invalid username or password." }, { status: 401 })
    }

    const res = NextResponse.json({
      ok: true,
      user: {
        _id: user._id,
        name: user.uName,
        role: user.uRole,
        username: user.username,
      },
    })

    // Minimal session: store userId in httpOnly cookie
    res.cookies.set("userId", String(user._id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      // set secure true only on https
      secure: false,
      maxAge: 60 * 60 * 24 * 7, // 7 days
    })

    return res
  } catch (err: any) {
    console.error("Student login error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}