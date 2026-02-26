import { NextResponse } from "next/server";
import { ConvexHttpClient } from "convex/browser";

export async function GET() {
  try {
    const url = process.env.NEXT_PUBLIC_CONVEX_URL;

    if (!url) {
      return NextResponse.json(
        { ok: false, error: "NEXT_PUBLIC_CONVEX_URL is missing" },
        { status: 500 }
      );
    }

    const client = new ConvexHttpClient(url);

    // 👇 THIS is the only line we changed
    const result = await client.query("courses:listCourses", {});

    return NextResponse.json({ ok: true, result });
  } catch (err: any) {
    return NextResponse.json(
      {
        ok: false,
        error: err?.message ?? String(err),
        stack: err?.stack ?? null,
      },
      { status: 500 }
    );
  }
}
