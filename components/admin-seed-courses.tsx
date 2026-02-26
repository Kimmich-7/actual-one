"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function AdminSeedCourses() {
  const courses = useQuery(api.courses.listCourses);
  const seed = useMutation(api.courses.seedCourses);

  const countText =
    courses === undefined ? "Loading..." : Array.isArray(courses) ? `${courses.length} courses` : "0";

  return (
    <Card className="max-w-md mx-auto mt-8">
      <CardHeader>
        <CardTitle>Admin: Course Management</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p>Courses in database: <strong>{countText}</strong></p>
        <Button
          onClick={async () => {
            try {
              const result = await seed({});
              console.log("Seed result:", result);
              alert("seedCourses finished — check the courses table or refresh this page.");
            } catch (err) {
              console.error("seed error", err);
              alert("Seed failed, check console and run `npx convex logs`.");
            }
          }}
          className="w-full"
        >
          Run seedCourses
        </Button>
        {courses && courses.length > 0 && (
          <div className="mt-4">
            <h4 className="font-semibold mb-2">Existing Courses:</h4>
            <ul className="text-sm space-y-1">
              {courses.slice(0, 5).map((course) => (
                <li key={course._id} className="text-gray-600">
                  • {course.title} ({course.difficulty})
                </li>
              ))}
              {courses.length > 5 && (
                <li className="text-gray-500">... and {courses.length - 5} more</li>
              )}
            </ul>
          </div>
        )}
      </CardContent>
    </Card>
  );
}