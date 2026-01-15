import { NextRequest, NextResponse } from 'next/server';
import { validateStudentLogin, createSession } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { matricNumber, email } = body;
    
    if (!matricNumber || !email) {
      return NextResponse.json(
        { error: 'Matric number and email are required' },
        { status: 400 }
      );
    }
    
    const result = await validateStudentLogin(matricNumber, email);
    
    if (!result.success) {
      return NextResponse.json(
        { error: result.error },
        { status: 401 }
      );
    }
    
    // Create session
    const token = await createSession(result.student!.id);
    
    // Create response with cookie
    const response = NextResponse.json({ 
      success: true, 
      student: result.student 
    });
    
    response.cookies.set('session_token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/',
    });
    
    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}