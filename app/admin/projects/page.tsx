import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminProjectsContent from '@/components/admin-projects-content';

export const metadata: Metadata = {
  title: "Projects - Admin Portal",
  description: "View and manage student projects",
};

export default function AdminProjectsPage() {
  return (
    <AdminLayout>
      <AdminProjectsContent />
    </AdminLayout>
  );
}