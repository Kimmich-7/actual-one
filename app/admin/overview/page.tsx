import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminOverviewContent from '@/components/admin-overview-content';

export const metadata: Metadata = {
  title: "Overview - Admin Portal",
  description: "School overview and statistics dashboard",
};

export default function AdminOverviewPage() {
  return (
    <AdminLayout>
      <AdminOverviewContent />
    </AdminLayout>
  );
}
