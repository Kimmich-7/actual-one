import type { Metadata } from 'next';
import AdminPortalContent from '@/components/admin-portal-content';

export const metadata: Metadata = {
  title: "Admin Portal - Juja St. Peters School",
  description: "Administrative dashboard for managing students, projects, and approvals at Juja St. Peters School",
};

export default function AdminPortalPage() {
  return <AdminPortalContent />;
}



