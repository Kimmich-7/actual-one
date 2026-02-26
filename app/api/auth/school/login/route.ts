import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const username = String(body?.username ?? "").trim()
    const password = String(body?.password ?? "")

    if (!username || !password) {
      return NextResponse.json({ ok: false, message: "Missing credentials." }, { status: 400 })
    }

    // Simple env-based login (same pattern we can upgrade later to MySQL table if you want)
    const ADMIN_USER = process.env.SCHOOL_ADMIN_USER
    const ADMIN_PASS = process.env.SCHOOL_ADMIN_PASSWORD

    if (!ADMIN_USER || !ADMIN_PASS) {
      return NextResponse.json(
        { ok: false, message: "School admin credentials not configured on server." },
        { status: 500 }
      )
    }

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      return NextResponse.json({ ok: false, message: "Invalid username/password." }, { status: 401 })
    }

    const res = NextResponse.json({ ok: true })

    res.cookies.set("schoolAuth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })

    return res
  } catch (err) {
    console.error("school login error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}