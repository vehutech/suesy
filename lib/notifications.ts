import { prisma } from './prisma';
import { NotificationType } from '@/types';

export async function createNotification(
  studentId: string,
  type: NotificationType,
  title: string,
  message: string,
  data?: any
) {
  return prisma.notification.create({
    data: {
      studentId,
      type,
      title,
      message,
      data: data || {},
    },
  });
}

export async function notifyExchangeRequest(
  receiverId: string,
  requesterName: string,
  productTitle: string,
  exchangeId: string
) {
  await createNotification(
    receiverId,
    'exchange_request',
    'New Exchange Request',
    `${requesterName} wants to exchange for your ${productTitle}`,
    { exchangeId }
  );
}

export async function notifyExchangeAccepted(
  requesterId: string,
  receiverName: string,
  productTitle: string,
  exchangeId: string
) {
  await createNotification(
    requesterId,
    'exchange_accepted',
    'Exchange Accepted',
    `${receiverName} accepted your exchange request for ${productTitle}`,
    { exchangeId }
  );
}

export async function notifyExchangeRejected(
  requesterId: string,
  receiverName: string,
  productTitle: string,
  exchangeId: string
) {
  await createNotification(
    requesterId,
    'exchange_rejected',
    'Exchange Rejected',
    `${receiverName} rejected your exchange request for ${productTitle}`,
    { exchangeId }
  );
}

export async function notifyNewMessage(
  recipientId: string,
  senderName: string,
  exchangeId: string
) {
  await createNotification(
    recipientId,
    'message',
    'New Message',
    `You have a new message from ${senderName}`,
    { exchangeId }
  );
}

export async function notifyProductDeleted(
  studentId: string,
  productTitle: string,
  reason: string = 'Moderation'
) {
  await createNotification(
    studentId,
    'product_deleted',
    'Product Removed',
    `Your product "${productTitle}" was deleted by admin. Reason: ${reason}`,
    { productTitle, reason }
  );
}

export async function getUnreadNotifications(studentId: string) {
  return prisma.notification.findMany({
    where: {
      studentId,
      read: false,
    },
    orderBy: {
      createdAt: 'desc',
    },
  });
}

export async function markNotificationAsRead(notificationId: string) {
  return prisma.notification.update({
    where: { id: notificationId },
    data: { read: true },
  });
}

export async function markAllNotificationsAsRead(studentId: string) {
  return prisma.notification.updateMany({
    where: {
      studentId,
      read: false,
    },
    data: { read: true },
  });
}