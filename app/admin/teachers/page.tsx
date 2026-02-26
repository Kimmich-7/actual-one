import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminTeachersContent from '@/components/admin-teachers-content';

export const metadata: Metadata = {
  title: "Teachers - Admin Portal",
  description: "Manage teacher accounts and assignments",
};

export default function AdminTeachersPage() {
  return (
    <AdminLayout>
      <AdminTeachersContent />
    </AdminLayout>
  );
}
