import type { Metadata } from 'next'
import DashboardPageContent from '@/components/dashboard-page-content'

export const metadata: Metadata = {
  title: 'Student Dashboard - Juja St. Peters School',
  description: 'Access your coding courses, track progress, and manage your projects at Juja St. Peters School.',
}

export default function DashboardPage() {
  return <DashboardPageContent />
}
