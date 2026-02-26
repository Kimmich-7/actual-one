import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

function makeId(prefix = "jx") {
  return `${prefix}${crypto.randomBytes(16).toString("hex")}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const fullName = String(body?.fullName ?? "").trim()
    const email = String(body?.email ?? "").trim()
    const username = String(body?.username ?? "").trim()
    const password = String(body?.password ?? "")

    if (!fullName || !email || !username || !password) {
      return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 })
    }

    // unique username
    const [existing] = await db.query(`SELECT _id FROM users WHERE username = ? LIMIT 1`, [username])
    if (Array.isArray(existing) && existing.length) {
      return NextResponse.json({ ok: false, message: "Username already exists." }, { status: 409 })
    }

    const now = Date.now().toString()
    const _id = makeId("jx")

    // Insert into your existing users table as a teacher
    await db.query(
      `INSERT INTO users
        (_creationTime, _id, approvalDate, class, grade, isApproved, lastLoginTime,
         uName, uPassword, registrationDate, uRole, school, username, email,
         assignedClasses, teacherSubjects, tempPassword)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        now,
        _id,
        "",          // approvalDate
        "Teacher",   // class (NOT NULL)
        "Teacher",   // grade (NOT NULL)
        "false",     // isApproved (set true later if you want auto access)
        "",
        fullName,
        password,    // plain text currently (can hash later)
        now,
        "teacher",
        "Juja St. Peters School",
        username,
        email,
        null,
        null,
        null,
      ]
    )

    return NextResponse.json({ ok: true, userId: _id })
  } catch (err) {
    console.error("Teacher register error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}