import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie, clearAdminCookie } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionToken = cookieStore.get('session_token')?.value;
    const adminToken = cookieStore.get('admin_token')?.value;
    
    if (sessionToken) {
      await clearSessionCookie();
    }
    
    if (adminToken) {
      await clearAdminCookie();
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}