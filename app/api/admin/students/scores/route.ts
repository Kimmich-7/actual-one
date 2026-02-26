import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  const [rows] = await db.query(
    `SELECT
       studentId AS _id,
       ROUND(AVG(score), 2) AS averageScore,
       COUNT(*) AS totalQuizzes
     FROM quizsessions
     GROUP BY studentId`
  );

  return NextResponse.json(rows);
}
