import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Get teacher by username
    const teacher = await convex.query(api.users.getUserByUsernameForAuth, { username })
    
    if (teacher && teacher.role === 'teacher' && teacher.password === password) {
      return NextResponse.json({ teacher })
    }
    
    return NextResponse.json({ teacher: null })
  } catch (error) {
    console.error('Teacher auth error:', error)
    return NextResponse.json({ teacher: null })
  }
}