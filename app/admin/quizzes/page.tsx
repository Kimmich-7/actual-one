import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminQuizzesContent from '@/components/admin-quizzes-content';

export const metadata: Metadata = {
  title: "Quizzes - Admin Portal",
  description: "Manage quizzes and quiz performance",
};

export default function AdminQuizzesPage() {
  return (
    <AdminLayout>
      <AdminQuizzesContent />
    </AdminLayout>
  );
}