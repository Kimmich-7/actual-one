import { NextRequest, NextResponse } from 'next/server'
import { ConvexHttpClient } from 'convex/browser'
import { api } from '@/convex/_generated/api'

const convex = new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

export async function POST(request: NextRequest) {
  try {
    const { username, password } = await request.json()
    
    // Get parent by username
    const parent = await convex.query(api.users.getUserByUsernameForAuth, { username })
    
    if (parent && parent.role === 'parent' && parent.password === password) {
      return NextResponse.json({ parent })
    }
    
    return NextResponse.json({ parent: null })
  } catch (error) {
    console.error('Parent auth error:', error)
    return NextResponse.json({ parent: null })
  }
}