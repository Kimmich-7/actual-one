import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)
    const username = String(body?.username ?? "").trim()
    const password = String(body?.password ?? "")

    if (!username || !password) {
      return NextResponse.json({ ok: false, message: "Missing credentials." }, { status: 400 })
    }

    const USER = process.env.SCHOOL_DASH_USER
    const PASS = process.env.SCHOOL_DASH_PASSWORD

    if (!USER || !PASS) {
      return NextResponse.json(
        { ok: false, message: "School dashboard credentials not configured on server." },
        { status: 500 }
      )
    }

    if (username !== USER || password !== PASS) {
      return NextResponse.json({ ok: false, message: "Invalid username/password." }, { status: 401 })
    }

    // Cookie used only for school dashboard route protection
    const res = NextResponse.json({ ok: true })
    res.cookies.set("schoolDashAuth", "1", {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
    })
    return res
  } catch (err) {
    console.error("school-dashboard login error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}