import type { Metadata } from 'next';
import ParentDashboard from '@/components/parent-dashboard';

export const metadata: Metadata = {
  title: 'Parent Dashboard - Juja St. Peters School',
  description: 'Parent dashboard for monitoring child progress and performance',
};

export default function ParentPage() {
  return <ParentDashboard />;
}