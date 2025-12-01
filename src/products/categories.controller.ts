import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, ParseIntPipe, UseInterceptors, UploadedFile } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CategoriesService } from './categories.service';
import { CreateCategoryDto, UpdateCategoryDto } from './category.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

@Controller('categories')
export class CategoriesController {
  constructor(
    private readonly categoriesService: CategoriesService,
    private readonly cacheService: CacheService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/categories',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `category-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async create(@Body() createCategoryDto: CreateCategoryDto, @UploadedFile() file?: Express.Multer.File) {
    const result = await this.categoriesService.create(createCategoryDto, file);
    await this.cacheService.delByPattern('categories:');
    return result;
  }

  @Get()
  async findAll() {
    return this.cacheService.getOrSet(
      'categories:list',
      () => this.categoriesService.findAll(),
      600, // 10 minutes TTL
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.cacheService.getOrSet(
      `categories:${id}`,
      () => this.categoriesService.findOne(id),
      600, // 10 minutes TTL
    );
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(FileInterceptor('image', {
    storage: diskStorage({
      destination: './uploads/categories',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `category-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
  }))
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateCategoryDto: UpdateCategoryDto, @UploadedFile() file?: Express.Multer.File) {
    const result = await this.categoriesService.update(id, updateCategoryDto, file);
    await this.cacheService.del(`categories:${id}`);
    await this.cacheService.del('categories:list');
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.categoriesService.remove(id);
    await this.cacheService.del(`categories:${id}`);
    await this.cacheService.del('categories:list');
    return result;
  }
}