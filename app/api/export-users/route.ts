import { NextResponse } from "next/server";

export async function GET() {
  try {
    const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
    const deployKey = process.env.CONVEX_DEPLOY_KEY;

    if (!convexUrl) {
      return NextResponse.json({ ok: false, error: "NEXT_PUBLIC_CONVEX_URL missing" }, { status: 500 });
    }
    if (!deployKey) {
      return NextResponse.json({ ok: false, error: "CONVEX_DEPLOY_KEY missing" }, { status: 500 });
    }

    // Call Convex admin endpoint to run a query that reads all users.
    // IMPORTANT: This uses the deploy key, so it bypasses auth.
    const res = await fetch(`${convexUrl}/api/query`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        // Convex uses the deploy key as admin auth
        Authorization: `Convex ${deployKey}`,
      },
      body: JSON.stringify({
        // This calls the database table directly via admin query endpoint
        // (no Convex function needed)
        // We'll use "tableScan" style query:
        path: "_system/queryTable",
        args: { table: "users" },
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      return NextResponse.json({ ok: false, status: res.status, data }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e), stack: e?.stack ?? null }, { status: 500 });
  }
}
