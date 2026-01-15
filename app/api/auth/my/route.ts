import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStudent } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const student = await getCurrentStudent();
    
    if (!student) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
    
    const products = await prisma.product.findMany({
      where: {
        studentId: student.id,
        status: { not: 'deleted' },
      },
      orderBy: { createdAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            imageUrl: true,
          },
        },
      },
    });
    
    return NextResponse.json({ products });
  } catch (error) {
    console.error('Fetch my products error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}