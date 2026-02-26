import type { Metadata } from 'next'
import AuthPageContent from '@/components/auth-page-content'

export const metadata: Metadata = {
  title: 'Sign In - Juja St. Peters School',
  description: 'Sign in to your Juja St. Peters School coding platform account to access interactive coding courses and projects.',
}

export default function AuthPage() {
  return <AuthPageContent />
}
