import { NextResponse } from "next/server"
import { db } from "@/lib/db"
import crypto from "crypto"

function makeId(prefix = "jx") {
  // Similar “Convex-ish” ids, but generated locally
  return `${prefix}${crypto.randomBytes(16).toString("hex")}`
}

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null)

    const fullName = String(body?.fullName ?? "").trim()
    const username = String(body?.username ?? "").trim()
    const password = String(body?.password ?? "")
    const grade = String(body?.grade ?? "").trim()
    const studentClass = String(body?.class ?? "").trim()
    const school = String(body?.school ?? "Juja St. Peters School").trim()

    if (!fullName || !username || !password || !grade) {
      return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 })
    }

    // Check duplicate username
    const [existingRows] = await db.query(`SELECT _id FROM users WHERE username = ? LIMIT 1`, [username])
    const exists = Array.isArray(existingRows) && existingRows.length > 0
    if (exists) {
      return NextResponse.json({ ok: false, message: "Username already exists. Choose another one." }, { status: 409 })
    }

    const now = Date.now().toString()
    const _id = makeId("jx")

    // Your table has NOT NULL columns – we must populate them
    await db.query(
      `INSERT INTO users
        (_creationTime, _id, approvalDate, class, grade, isApproved, lastLoginTime,
         uName, uPassword, registrationDate, uRole, school, username, email,
         assignedClasses, teacherSubjects, tempPassword)
       VALUES
        (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        now, // _creationTime
        _id, // _id
        "", // approvalDate
        studentClass || grade, // class (NOT NULL)
        grade, // grade
        "false", // isApproved (admin can approve later)
        "", // lastLoginTime
        fullName, // uName
        password, // uPassword (plain text for now - we can hash later)
        now, // registrationDate
        "student", // uRole
        school, // school
        username, // username
        "", // email (NOT NULL in your schema; set empty if you don’t capture it yet)
        null, // assignedClasses
        null, // teacherSubjects
        null, // tempPassword
      ]
    )

    return NextResponse.json({ ok: true, userId: _id })
  } catch (err: any) {
    console.error("Student register error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}