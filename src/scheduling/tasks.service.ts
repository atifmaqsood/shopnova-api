import { Injectable } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

@Injectable()
export class TasksService {
  constructor(
    private prisma: PrismaService,
    @InjectQueue('email') private emailQueue: Queue,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT)
  async clearExpiredCarts() {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    await this.prisma.cart.deleteMany({});
  }

  @Cron('0 9 * * *')
  async sendDailyNewsletter() {
    const users = await this.prisma.user.findMany({
      where: { isVerified: true },
    });
    
    for (const user of users) {
      await this.emailQueue.add('newsletter', {
        email: user.email,
        name: user.name,
      });
    }
  }
}