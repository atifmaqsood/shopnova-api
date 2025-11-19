import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { EmailService } from '../notifications/email.service';

@Injectable()
export class OtpService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private config: ConfigService,
  ) {}

  generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  async sendEmailOtp(email: string, otp: string, name: string) {
    await this.emailService.sendOtpEmail(email, name, otp);
  }

  async generateAndSendOtp(userId: number, type: 'email' | 'phone') {
    const otp = this.generateOtp();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new Error('User not found');

    if (type === 'email') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { emailOtp: otp, emailOtpExpiresAt: expiresAt },
      });

      await this.emailService.sendOtpEmail(user.email, user.name, otp);
    } else if (type === 'phone') {
      await this.prisma.user.update({
        where: { id: userId },
        data: { phoneOtp: otp, phoneOtpExpiresAt: expiresAt },
      });
      
      console.log(`SMS OTP for ${user.phone}: ${otp}`);
    }
  }

  async verifyOtp(userId: number, otp: string, type: 'email' | 'phone'): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;

    const now = new Date();
    
    if (type === 'email') {
      return !!(user.emailOtp === otp && user.emailOtpExpiresAt && user.emailOtpExpiresAt > now);
    } else {
      return !!(user.phoneOtp === otp && user.phoneOtpExpiresAt && user.phoneOtpExpiresAt > now);
    }
  }
}