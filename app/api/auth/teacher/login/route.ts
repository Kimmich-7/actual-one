import { NextResponse } from "next/server"
import { db } from "@/lib/db"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const username = String(body?.username ?? "").trim()
    const password = String(body?.password ?? "")

    if (!username || !password) {
      return NextResponse.json({ ok: false, message: "Missing credentials." }, { status: 400 })
    }

    const [rows] = await db.query(
      `SELECT _id, uPassword, uRole, isApproved
       FROM users
       WHERE username = ?
       LIMIT 1`,
      [username]
    )

    const user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null
    if (!user) return NextResponse.json({ ok: false, message: "Invalid username/password." }, { status: 401 })

    if (String(user.uRole).toLowerCase() !== "teacher") {
      return NextResponse.json({ ok: false, message: "This account is not a teacher account." }, { status: 403 })
    }

    if (String(user.uPassword) !== password) {
      return NextResponse.json({ ok: false, message: "Invalid username/password." }, { status: 401 })
    }

    // Optional: enforce approval
    // if (String(user.isApproved).toLowerCase() !== "true") {
    //   return NextResponse.json({ ok: false, message: "Account not approved yet." }, { status: 403 })
    // }

    const res = NextResponse.json({ ok: true })
    res.cookies.set("userId", String(user._id), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
    return res
  } catch (err) {
    console.error("Teacher login error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}