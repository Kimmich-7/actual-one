import { NextResponse } from "next/server"

export async function GET(req: Request) {
  const cookie = req.headers.get("cookie") || ""
  const authenticated = cookie.includes("adminAuth=1")
  return NextResponse.json({ authenticated })
}