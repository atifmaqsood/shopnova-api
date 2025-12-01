import { Controller, Get, Put, Body, UseGuards, Request, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { UsersService } from './users.service';
import { UpdateProfileDto, ChangePasswordDto } from './user.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheService } from '../cache/cache.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(
    private usersService: UsersService,
    private cacheService: CacheService,
  ) {}

  @Get('profile')
  async getProfile(@Request() req) {
    const cacheKey = `user:profile:${req.user.userId}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.usersService.findById(req.user.userId),
      300, // 5 minutes TTL
    );
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('profileImage', {
    storage: diskStorage({
      destination: (req, file, cb) => {
        const fs = require('fs');
        const dir = './uploads/profiles';
        if (!fs.existsSync(dir)) {
          fs.mkdirSync(dir, { recursive: true });
        }
        cb(null, dir);
      },
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `profile-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    fileFilter: (req, file, cb) => {
      if (file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        cb(null, true);
      } else {
        cb(new Error('Only image files are allowed!'), false);
      }
    },
    limits: {
      fileSize: 5 * 1024 * 1024, // 5MB
    },
  }))
  async updateProfile(@Request() req, @Body() updateProfileDto: UpdateProfileDto, @UploadedFile() file?: Express.Multer.File) {
    try {
      console.log('Request body:', req.body);
      console.log('Update DTO:', updateProfileDto);
      console.log('File:', file);
      console.log('User ID:', req.user.userId);
      
      const result = await this.usersService.updateProfile(req.user.userId, updateProfileDto, file);
      
      // Invalidate user profile cache
      await this.cacheService.del(`user:profile:${req.user.userId}`);
      
      return {
        success: true,
        message: 'Profile updated successfully',
        data: result,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Profile update error:', error);
      throw error;
    }
  }

  @Put('change-password')
  async changePassword(@Request() req, @Body() changePasswordDto: ChangePasswordDto) {
    const result = await this.usersService.changePassword(req.user.userId, changePasswordDto);
    // Invalidate user profile cache after password change
    await this.cacheService.del(`user:profile:${req.user.userId}`);
    return result;
  }
}