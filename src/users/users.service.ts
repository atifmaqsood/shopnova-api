import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto, ChangePasswordDto } from './user.dto';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UsersService {
  constructor(private prisma: PrismaService) {}

  async findById(id: number) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        profileImage: true,
        role: true,
        isVerified: true,
        createdAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return user;
  }

  async updateProfile(userId: number, updateProfileDto: UpdateProfileDto, file?: Express.Multer.File) {
    try {
      // Get current user data
      const currentUser = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { phone: true }
      });
      
      // Filter out undefined/null values
      const updateData: any = {};
      if (updateProfileDto.name !== undefined && updateProfileDto.name !== null && updateProfileDto.name.trim() !== '') {
        updateData.name = updateProfileDto.name.trim();
      }
      if (updateProfileDto.phone !== undefined && updateProfileDto.phone !== null && updateProfileDto.phone.trim() !== '') {
        const newPhone = updateProfileDto.phone.trim();
        // Only check for duplicates if phone is actually changing
        if (newPhone !== currentUser?.phone) {
          const existingUser = await this.prisma.user.findFirst({
            where: {
              phone: newPhone,
              NOT: { id: userId }
            }
          });
          if (existingUser) {
            throw new BadRequestException('Phone number is already in use');
          }
        }
        updateData.phone = newPhone;
      }
      if (file) {
        updateData.profileImage = `/uploads/profiles/${file.filename}`;
      }
      
      const user = await this.prisma.user.update({
        where: { id: userId },
        data: updateData,
        select: {
          id: true,
          email: true,
          name: true,
          phone: true,
          profileImage: true,
          role: true,
          isVerified: true,
          createdAt: true,
        },
      });

      return user;
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException('User not found');
      }
      if (error.code === 'P2002') {
        throw new BadRequestException('Phone number is already in use');
      }
      throw error;
    }
  }

  async changePassword(userId: number, changePasswordDto: ChangePasswordDto) {
    const { currentPassword, newPassword } = changePasswordDto;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedNewPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedNewPassword },
    });

    return { message: 'Password changed successfully' };
  }
}