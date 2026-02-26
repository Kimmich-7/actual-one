import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(req: Request) {
  const body = await req.json();
  const students = Array.isArray(body.students) ? body.students : [];

  if (!students.length) {
    return NextResponse.json({ error: "No students provided" }, { status: 400 });
  }

  const now = String(Date.now());
  const placeholders: string[] = [];
  const values: any[] = [];

  for (const s of students) {
    const name = String(s.name ?? "").trim();
    const grade = String(s.grade ?? "").trim();
    const username = String(s.username ?? "").trim();
    const password = String(s.password ?? "").trim();
    const className = String(s.class ?? grade ?? "").trim();
    const school = String(s.school ?? "Juja St. Peters School").trim();

    if (!name || !grade || !username || !password) continue;

    const id = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random()}`;

    placeholders.push(`(?, ?, ?, 'student', ?, ?, ?, ?, ?, 'true', ?, ?, ?, '')`);
    values.push(id, now, name, username, password, grade, className, school, now, now, now);
  }

  if (!placeholders.length) {
    return NextResponse.json({ error: "No valid students" }, { status: 400 });
  }

  await db.query(
    `INSERT INTO users
      (_id, _creationTime, uName, uRole, username, uPassword, grade, \`class\`, school,
       isApproved, registrationDate, approvalDate, lastLoginTime, email)
     VALUES ${placeholders.join(",")}`,
    values
  );

  return NextResponse.json({ success: true, created: placeholders.length });
}
