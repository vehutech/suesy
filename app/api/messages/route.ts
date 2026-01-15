import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentStudent } from '@/lib/auth';
import { notifyNewMessage } from '@/lib/notifications';

export async function GET(request: NextRequest) {
  try {
    const student = await getCurrentStudent();
    if (!student) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    
    const { searchParams } = new URL(request.url);
    const exchangeId = searchParams.get('exchangeId');
    
    if (!exchangeId) {
      return NextResponse.json(
        { error: 'Exchange ID is required' },
        { status: 400 }
      );
    }
    
    // Verify access to exchange
    const exchange = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeId },
    });
    
    if (!exchange) {
      return NextResponse.json(
        { error: 'Exchange not found' },
        { status: 404 }
      );
    }
    
    if (exchange.requesterId !== student.id && exchange.receiverId !== student.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    const messages = await prisma.message.findMany({
      where: { exchangeRequestId: exchangeId },
      orderBy: { createdAt: 'asc' },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            imageUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            imageUrl: true,
          },
        },
      },
    });
    
    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        exchangeRequestId: exchangeId,
        recipientId: student.id,
        read: false,
      },
      data: { read: true },
    });
    
    return NextResponse.json({ messages });
  } catch (error) {
    console.error('Fetch messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
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
    const { exchangeId, content } = body;
    
    if (!exchangeId || !content?.trim()) {
      return NextResponse.json(
        { error: 'Exchange ID and content are required' },
        { status: 400 }
      );
    }
    
    // Verify access to exchange
    const exchange = await prisma.exchangeRequest.findUnique({
      where: { id: exchangeId },
      include: {
        requester: true,
        receiver: true,
      },
    });
    
    if (!exchange) {
      return NextResponse.json(
        { error: 'Exchange not found' },
        { status: 404 }
      );
    }
    
    if (exchange.requesterId !== student.id && exchange.receiverId !== student.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 403 }
      );
    }
    
    // Determine recipient
    const recipientId = exchange.requesterId === student.id 
      ? exchange.receiverId 
      : exchange.requesterId;
    
    const recipient = exchange.requesterId === student.id
      ? exchange.receiver
      : exchange.requester;
    
    // Create message
    const message = await prisma.message.create({
      data: {
        exchangeRequestId: exchangeId,
        senderId: student.id,
        recipientId,
        content: content.trim(),
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            imageUrl: true,
          },
        },
        recipient: {
          select: {
            id: true,
            name: true,
            matricNumber: true,
            imageUrl: true,
          },
        },
      },
    });
    
    // Send notification
    await notifyNewMessage(recipientId, student.name, exchangeId);
    
    return NextResponse.json({ success: true, message });
  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}