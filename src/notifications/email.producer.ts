import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common/decorators";
import { User } from "@prisma/client";
import { Queue } from "bullmq/dist/esm/classes/queue";

@Injectable()
export class EmailProducer {
  constructor(@InjectQueue('email') private emailQueue: Queue) {}

  async addWelcomeEmail(user: User) {
    await this.emailQueue.add('welcome', user, { attempts: 3 });
  }

  async addOrderConfirmation(orderId: number) {
    await this.emailQueue.add('order-confirmation', { orderId });
  }
}