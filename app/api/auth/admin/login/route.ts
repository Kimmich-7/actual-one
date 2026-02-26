import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const email = String(body?.email ?? "").trim()
    const password = String(body?.password ?? "")

    if (!email || !password) {
      return NextResponse.json({ ok: false, message: "Missing credentials." }, { status: 400 })
    }

    // You set these in .env.local
    const ADMIN_EMAIL = process.env.ADMIN_EMAIL
    const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD

    if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
      return NextResponse.json(
        { ok: false, message: "Admin credentials not configured on server." },
        { status: 500 }
      )
    }

    if (email !== ADMIN_EMAIL || password !== ADMIN_PASSWORD) {
      return NextResponse.json({ ok: false, message: "Invalid email/password." }, { status: 401 })
    }

    // Cookie used for "are you authenticated?"
    const res = NextResponse.json({ ok: true })
    res.cookies.set("adminAuth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
    return res
  } catch (err) {
    console.error("admin login error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}