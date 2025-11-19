import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Job } from 'bullmq';
import { Injectable } from '@nestjs/common';
import { EmailService } from './email.service';

@Injectable()
@Processor('email')
export class EmailConsumer extends WorkerHost {
  constructor(private emailService: EmailService) {
    super();
  }

  async process(job: Job): Promise<void> {
    switch (job.name) {
      case 'welcome':
        await this.sendWelcome(job);
        break;
      case 'order-confirmation':
        await this.sendOrderConfirmation(job);
        break;
    }
  }

  private async sendWelcome(job: Job) {
    const { email, name } = job.data;
    await this.emailService.sendWelcomeEmail(email, name);
  }

  private async sendOrderConfirmation(job: Job) {
    const { email, name, orderId } = job.data;
    await this.emailService.sendOrderConfirmationEmail(email, name, orderId);
  }
}