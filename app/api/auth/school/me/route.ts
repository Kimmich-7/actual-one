import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const authed = cookie.includes("schoolAuth=1")
  return NextResponse.json({ authenticated: authed })
}