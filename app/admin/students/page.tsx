import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminStudentsContent from '@/components/admin-students-content';

export const metadata: Metadata = {
  title: "Manage Students - Admin Portal",
  description: "Create and manage student accounts",
};

export default function AdminStudentsPage() {
  return (
    <AdminLayout>
      <AdminStudentsContent />
    </AdminLayout>
  );
}
