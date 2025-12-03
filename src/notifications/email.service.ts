import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor(private config: ConfigService) {
    this.transporter = nodemailer.createTransport({
      host: this.config.get('SMTP_HOST'),
      port: this.config.get('SMTP_PORT'),
      secure: false,
      auth: {
        user: this.config.get('SMTP_USER'),
        pass: this.config.get('SMTP_PASS'),
      },
    });
  }

  async sendOtpEmail(to: string, name: string, otp: string) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Your Verification Code',
      html: `
        <h2>Hello ${name}</h2>
        <p>Your verification code is: <strong>${otp}</strong></p>
        <p>This code will expire in 10 minutes.</p>
      `,
    });
  }

  async sendWelcomeEmail(to: string, name: string) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Welcome to ShopNova!',
      html: `
        <h2>Welcome ${name}!</h2>
        <p>Thank you for joining ShopNova. We're excited to have you!</p>
      `,
    });
  }

  async sendOrderConfirmationEmail(to: string, name: string, orderId: string) {
    await this.transporter.sendMail({
      from: this.config.get('SMTP_FROM'),
      to,
      subject: 'Order Confirmation',
      html: `
        <h2>Order Confirmed!</h2>
        <p>Hi ${name},</p>
        <p>Your order #${orderId} has been confirmed and is being processed.</p>
      `,
    });
  }
}