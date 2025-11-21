import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { EmailService } from './email.service';
import { EmailConsumer } from './email.consumer';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';

@Module({
  imports: [
    BullModule.registerQueue({
      name: 'email',
    }),
  ],
  controllers: [NotificationController],
  providers: [EmailService, EmailConsumer, NotificationService],
  exports: [EmailService, NotificationService],
})
export class NotificationsModule {}