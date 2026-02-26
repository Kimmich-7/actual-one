import type { Metadata } from 'next';
import AdminLayout from '@/components/admin-layout';
import AdminParentsContent from '@/components/admin-parents-content';

export const metadata: Metadata = {
  title: "Parents - Admin Portal",
  description: "Manage parent accounts and child associations",
};

export default function AdminParentsPage() {
  return (
    <AdminLayout>
      <AdminParentsContent />
    </AdminLayout>
  );
}
