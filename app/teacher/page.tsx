import type { Metadata } from 'next';
import TeacherDashboard from '@/components/teacher-dashboard';

export const metadata: Metadata = {
  title: 'Teacher Dashboard - Juja St. Peters School',
  description: 'Teacher dashboard for managing classes and student performance',
};

export default function TeacherPage() {
  return <TeacherDashboard />;
}