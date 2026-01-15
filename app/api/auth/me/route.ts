import { NextRequest, NextResponse } from 'next/server';
import { getCurrentStudent } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const student = await getCurrentStudent();
    
    if (!student) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      );
    }
    
    return NextResponse.json({
      student: {
        id: student.id,
        matricNumber: student.matricNumber,
        email: student.email,
        name: student.name,
        imageUrl: student.imageUrl,
      },
    });
  } catch (error) {
    console.error('Get current student error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}