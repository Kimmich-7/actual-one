"use client"

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import AdminProjectsDashboard from "./admin-projects-dashboard";

export default function AdminProjectsPageContent() {
  const user = useQuery(api.users.currentLoggedInUser);
  const router = useRouter();

  useEffect(() => {
    if (user === null) {
      // Not authenticated, redirect to auth
      router.push('/auth');
    } else if (user && user.role !== 'admin') {
      // Authenticated but not admin, redirect to dashboard
      router.push('/dashboard');
    }
  }, [user, router]);

  if (user === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-green-600 mx-auto mb-4"></div>
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h1>
        </div>
      </div>
    );
  }

  if (user === null || user.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Redirecting...</h1>
        </div>
      </div>
    );
  }

  return <AdminProjectsDashboard />;
}