import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminPendingContent from '@/components/admin-pending-content';

export const metadata: Metadata = {
  title: "Pending Students - Admin Portal",
  description: "Review and approve pending student registrations",
};

export default function AdminPendingPage() {
  return (
    <AdminLayout>
      <AdminPendingContent />
    </AdminLayout>
  );
}
