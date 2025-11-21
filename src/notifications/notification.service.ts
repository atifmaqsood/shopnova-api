import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationType } from '@prisma/client';

@Injectable()
export class NotificationService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, title: string, message: string, type: NotificationType = NotificationType.INFO) {
    return this.prisma.notification.create({
      data: {
        userId,
        title,
        message,
        type,
      },
    });
  }

  async findAll(userId: number, page = 1, limit = 20) {
    const skip = (page - 1) * limit;

    const [notifications, total, unreadCount] = await Promise.all([
      this.prisma.notification.findMany({
        where: { userId },
        skip,
        take: limit,
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.notification.count({ where: { userId } }),
      this.prisma.notification.count({ where: { userId, isRead: false } }),
    ]);

    return {
      notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  async markAsRead(userId: number, id: number) {
    return this.prisma.notification.updateMany({
      where: { id, userId },
      data: { isRead: true },
    });
  }

  async markAllAsRead(userId: number) {
    return this.prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true },
    });
  }

  async getUnreadCount(userId: number) {
    const count = await this.prisma.notification.count({
      where: { userId, isRead: false },
    });
    return { unreadCount: count };
  }

  // Helper methods for creating specific notification types
  async createOrderNotification(userId: number, orderId: number, status: string) {
    const title = 'Order Update';
    const message = `Your order #${orderId} status has been updated to ${status}`;
    return this.create(userId, title, message, NotificationType.ORDER_UPDATE);
  }

  async createWelcomeNotification(userId: number, name: string) {
    const title = 'Welcome to ShopNova!';
    const message = `Hi ${name}, welcome to ShopNova! Start exploring our amazing products.`;
    return this.create(userId, title, message, NotificationType.SUCCESS);
  }
}