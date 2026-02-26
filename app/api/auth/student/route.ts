import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

/**
 * Assumption (common pattern):
 * You store the logged-in user id in a cookie.
 * We'll check a few likely cookie names.
 *
 * If your project uses a different cookie/session method,
 * we will adjust after we see admin-layout.tsx.
 */
const COOKIE_KEYS = ["userId", "userid", "uid", "user_id"];

export async function GET() {
  const jar = cookies();

  let userId: string | null = null;
  for (const k of COOKIE_KEYS) {
    const v = jar.get(k)?.value;
    if (v) {
      userId = v;
      break;
    }
  }

  if (!userId) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  const [rows] = await db.query(
    `SELECT _id, uName, uRole, username, email
     FROM users
     WHERE _id = ?
     LIMIT 1`,
    [userId]
  );

  const user = Array.isArray(rows) && rows.length ? (rows as any)[0] : null;

  if (!user) {
    return NextResponse.json({ authenticated: false }, { status: 200 });
  }

  return NextResponse.json({
    authenticated: true,
    user: {
      _id: user._id,
      name: user.uName,
      role: user.uRole,
      username: user.username,
      email: user.email,
    },
  });
}
