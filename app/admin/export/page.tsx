"use client";

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ExportPage() {
  const pending = useQuery((api as any).users.getPendingStudents);

  return (
    <div style={{ padding: 24 }}>
      <h1>Users Module Health Check</h1>
      <pre style={{ whiteSpace: "pre-wrap" }}>
        {pending === undefined ? "Loading…" : JSON.stringify(pending, null, 2)}
      </pre>
    </div>
  );
}
