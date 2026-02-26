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

    const studentGrade = String(body?.studentGrade ?? "").trim()
    const studentClass = String(body?.studentClass ?? "").trim()
    const studentUsername = String(body?.studentUsername ?? "").trim()

    if (!fullName || !email || !username || !password || !studentGrade || !studentUsername) {
      return NextResponse.json({ ok: false, message: "Missing required fields." }, { status: 400 })
    }

    // ensure parent username unique
    const [existing] = await db.query(`SELECT _id FROM users WHERE username = ? LIMIT 1`, [username])
    if (Array.isArray(existing) && existing.length) {
      return NextResponse.json({ ok: false, message: "Username already exists." }, { status: 409 })
    }

    // find student account by username
    const [studentRows] = await db.query(
      `SELECT _id, grade, class FROM users WHERE username = ? AND uRole = 'student' LIMIT 1`,
      [studentUsername]
    )
    const student = Array.isArray(studentRows) && studentRows.length ? (studentRows as any)[0] : null
    if (!student) {
      return NextResponse.json(
        { ok: false, message: "Student not found. Check the student's username." },
        { status: 404 }
      )
    }

    // (Optional) check grade/class match if provided
    // We only hard-check grade because your form makes it required.
    if (String(student.grade).trim() !== studentGrade) {
      return NextResponse.json(
        { ok: false, message: "Student grade does not match. Please confirm the student's grade." },
        { status: 400 }
      )
    }

    const now = Date.now().toString()
    const _id = makeId("jx")

    // store parent as a "parent" user in users table
    // we also store linking info into assignedClasses to avoid schema changes
    const linkPayload = JSON.stringify({
      linkedStudentId: student._id,
      linkedStudentUsername: studentUsername,
      studentGrade,
      studentClass: studentClass || student.class || null,
    })

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
        "",             // approvalDate
        "Parent",       // class (NOT NULL)
        "Parent",       // grade (NOT NULL)
        "true",         // parents can login immediately
        "",
        fullName,
        password,
        now,
        "parent",
        "Juja St. Peters School",
        username,
        email,
        linkPayload,    // <-- storing link data here (until we make a real parents table)
        null,
        null,
      ]
    )

    return NextResponse.json({ ok: true, userId: _id, linkedStudentId: student._id })
  } catch (err) {
    console.error("Parent register error:", err)
    return NextResponse.json({ ok: false, message: "Server error." }, { status: 500 })
  }
}