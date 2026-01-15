import { NextRequest, NextResponse } from 'next/server';
import { validateStudentLogin, createSession, setSessionCookie } from '@/lib/auth';

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
    
    const token = await createSession(result.student!.id);
    await setSessionCookie(token);
    
    return NextResponse.json({
      success: true,
      student: {
        id: result.student!.id,
        matricNumber: result.student!.matricNumber,
        email: result.student!.email,
        name: result.student!.name,
        imageUrl: result.student!.imageUrl,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}