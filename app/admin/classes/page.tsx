import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminClassesContent from '@/components/admin-classes-content';

export const metadata: Metadata = {
  title: "Class Management - Admin Portal",
  description: "Create and manage school classes",
};

export default function AdminClassesPage() {
  return (
    <AdminLayout>
      <AdminClassesContent />
    </AdminLayout>
  );
}
