import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [rows] = await db.query(
    `SELECT
        _id,
        _creationTime,
        uName,
        uRole,
        username,
        uPassword,
        email,
        grade,
        \`class\`,
        school,
        isApproved,
        registrationDate,
        approvalDate
     FROM users
     WHERE uRole='student'
     ORDER BY CAST(_creationTime AS DECIMAL(16,0)) DESC
     LIMIT 5000`
  );

  return NextResponse.json(rows);
}
