import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { PaymentService } from './payment.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('payment')
export class PaymentController {
    constructor(private readonly paymentService: PaymentService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create-payment-intent')
    async createPaymentIntent(@Body() body: { amount: number }) {
        const { amount } = body;
        const paymentIntent = await this.paymentService.createPaymentIntent(amount);
        return {
            clientSecret: paymentIntent.client_secret,
        };
    }
}
