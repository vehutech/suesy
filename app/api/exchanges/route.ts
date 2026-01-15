import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStudent } from '@/lib/auth';
import { 
  notifyExchangeRequest, 
  notifyExchangeAccepted, 
  notifyExchangeRejected 
} from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    // Check if this is an admin request
    const adminToken = request.cookies.get('admin_token')?.value;
    
    if (adminToken) {
      // Admin can see all exchanges
      const exchanges = await prisma.exchangeRequest.findMany({
        include: {
          requester: {
            select: {
              id: true,
              name: true,
              matricNumber: true,
              imageUrl: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              matricNumber: true,
              imageUrl: true,
            },
          },
          requestedProduct: {
            select: {
              title: true,
            },
          },
          offeredProduct: {
            select: {
              title: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      });
      
      return NextResponse.json({ exchanges });
    }
    
    // Student request - need to be logged in
    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type') || 'all';
    
    let where: any = {
      OR: [
        { requesterId: student.id },
        { receiverId: student.id },
      ],
    };
    
    if (type === 'sent') {
      where = { requesterId: student.id };
    } else if (type === 'received') {
      where = { receiverId: student.id };
    }
    
    const exchanges = await prisma.exchangeRequest.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        requester: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            imageUrl: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            imageUrl: true,
          },
        },
        requestedProduct: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                matricNumber: true,
              },
            },
          },
        },
        offeredProduct: {
          include: {
            student: {
              select: {
                id: true,
                name: true,
                matricNumber: true,
              },
            },
          },
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
      },
    });
    
    return NextResponse.json({ exchanges });
  } catch (error) {
    console.error('Fetch exchanges error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch exchanges' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { requestedProductId, offeredProductId, message } = body;
    
    if (!requestedProductId || !offeredProductId) {
      return NextResponse.json(
        { error: 'Both products are required' },
        { status: 400 }
      );
    }
    
    // Validate products exist and are available
    const [requestedProduct, offeredProduct] = await Promise.all([
      prisma.product.findUnique({
        where: { id: requestedProductId },
        include: { student: true },
      }),
      prisma.product.findUnique({
        where: { id: offeredProductId },
        include: { student: true },
      }),
    ]);
    
    if (!requestedProduct || !offeredProduct) {
      return NextResponse.json(
        { error: 'One or both products not found' },
        { status: 404 }
      );
    }
    
    if (requestedProduct.status !== 'available' || offeredProduct.status !== 'available') {
      return NextResponse.json(
        { error: 'Products must be available for exchange' },
        { status: 400 }
      );
    }
    
    if (offeredProduct.studentId !== student.id) {
      return NextResponse.json(
        { error: 'You can only offer your own products' },
        { status: 403 }
      );
    }
    
    if (requestedProduct.studentId === student.id) {
      return NextResponse.json(
        { error: 'You cannot request your own product' },
        { status: 400 }
      );
    }
    
    // Check for existing pending request
    const existingRequest = await prisma.exchangeRequest.findFirst({
      where: {
        requesterId: student.id,
        requestedProductId,
        status: 'pending',
      },
    });
    
    if (existingRequest) {
      return NextResponse.json(
        { error: 'You already have a pending request for this product' },
        { status: 409 }
      );
    }
    
    // Create exchange request
    const exchange = await prisma.exchangeRequest.create({
      data: {
        requesterId: student.id,
        receiverId: requestedProduct.studentId,
        requestedProductId,
        offeredProductId,
        message,
      },
      include: {
        requester: true,
        receiver: true,
        requestedProduct: true,
        offeredProduct: true,
      },
    });
    
    // Send notification
    await notifyExchangeRequest(
      requestedProduct.studentId,
      student.name,
      requestedProduct.title,
      exchange.id
    );
    
    return NextResponse.json({ success: true, exchange });
  } catch (error) {
    console.error('Create exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to create exchange request' },
      { status: 500 }
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const body = await request.json();
    const { id, action } = body;
    
    if (!id || !action) {
      return NextResponse.json(
        { error: 'Exchange ID and action are required' },
        { status: 400 }
      );
    }
    
    const exchange = await prisma.exchangeRequest.findUnique({
      where: { id },
      include: {
        requester: true,
        receiver: true,
        requestedProduct: true,
        offeredProduct: true,
      },
    });
    
    if (!exchange) {
      return NextResponse.json(
        { error: 'Exchange request not found' },
        { status: 404 }
      );
    }
    
    // Only receiver can accept/reject
    if (action === 'accept' || action === 'reject') {
      if (exchange.receiverId !== student.id) {
        return NextResponse.json(
          { error: 'Only the receiver can accept or reject' },
          { status: 403 }
        );
      }
      
      if (exchange.status !== 'pending') {
        return NextResponse.json(
          { error: 'This request has already been processed' },
          { status: 400 }
        );
      }
      
      if (action === 'accept') {
        // Update exchange status
        const updated = await prisma.$transaction(async (tx) => {
          // Update exchange
          const updatedExchange = await tx.exchangeRequest.update({
            where: { id },
            data: { status: 'accepted' },
            include: {
              requester: true,
              receiver: true,
              requestedProduct: true,
              offeredProduct: true,
            },
          });
          
          // Mark products as exchanged
          await tx.product.updateMany({
            where: {
              id: {
                in: [exchange.requestedProductId, exchange.offeredProductId],
              },
            },
            data: { status: 'exchanged' },
          });
          
          return updatedExchange;
        });
        
        // Notify requester
        await notifyExchangeAccepted(
          exchange.requesterId,
          student.name,
          exchange.requestedProduct.title,
          exchange.id
        );
        
        return NextResponse.json({ success: true, exchange: updated });
      } else {
        // Reject
        const updated = await prisma.exchangeRequest.update({
          where: { id },
          data: { status: 'rejected' },
          include: {
            requester: true,
            receiver: true,
            requestedProduct: true,
            offeredProduct: true,
          },
        });
        
        // Notify requester
        await notifyExchangeRejected(
          exchange.requesterId,
          student.name,
          exchange.requestedProduct.title,
          exchange.id
        );
        
        return NextResponse.json({ success: true, exchange: updated });
      }
    }
    
    // Cancel (requester only)
    if (action === 'cancel') {
      if (exchange.requesterId !== student.id) {
        return NextResponse.json(
          { error: 'Only the requester can cancel' },
          { status: 403 }
        );
      }
      
      const updated = await prisma.exchangeRequest.update({
        where: { id },
        data: { status: 'cancelled' },
      });
      
      return NextResponse.json({ success: true, exchange: updated });
    }
    
    // Complete exchange (both parties must confirm)
    if (action === 'complete') {
      if (exchange.requesterId !== student.id && exchange.receiverId !== student.id) {
        return NextResponse.json(
          { error: 'Unauthorized' },
          { status: 403 }
        );
      }
      
      if (exchange.status !== 'accepted') {
        return NextResponse.json(
          { error: 'Exchange must be accepted first' },
          { status: 400 }
        );
      }
      
      const updated = await prisma.exchangeRequest.update({
        where: { id },
        data: { status: 'completed' },
      });
      
      return NextResponse.json({ success: true, exchange: updated });
    }
    
    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Update exchange error:', error);
    return NextResponse.json(
      { error: 'Failed to update exchange request' },
      { status: 500 }
    );
  }
}