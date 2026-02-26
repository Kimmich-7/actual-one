import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminCurriculumContent from '@/components/admin-curriculum-content';

export const metadata: Metadata = {
  title: "Curriculum Management - Admin Portal",
  description: "Manage curriculum documents for teachers",
};

export default function AdminCurriculumPage() {
  return (
    <AdminLayout>
      <AdminCurriculumContent />
    </AdminLayout>
  );
}
