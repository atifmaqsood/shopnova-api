import { Controller, Get, Post, Body, Patch, Param, Delete, Query, UseGuards, ParseIntPipe, UseInterceptors, UploadedFiles, Request, Inject } from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import { ProductsService } from './products.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { diskStorage } from 'multer';
import { extname } from 'path';
import { CacheService } from '../cache/cache.service';

@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly cacheService: CacheService,
  ) {}

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Post()
  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({
      destination: './uploads/products',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `product-${uniqueSuffix}${extname(file.originalname)}`);
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
  async create(@Body() createProductDto: CreateProductDto, @UploadedFiles() files: Express.Multer.File[]) {
    const result = await this.productsService.create(createProductDto, files);
    // Invalidate products list cache
    await this.cacheService.delByPattern('products:');
    return result;
  }

  @Get()
  async findAll(
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('search') search?: string,
    @Query('categoryId') categoryId?: string,
  ) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    const categoryIdNum = categoryId ? parseInt(categoryId) : undefined;
    
    const cacheKey = `products:list:${pageNum}:${limitNum}:${search || 'all'}:${categoryIdNum || 'all'}`;
    
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.productsService.findAll(pageNum, limitNum, search, categoryIdNum),
      300, // 5 minutes TTL
    );
  }

  // Debug endpoint to check authentication
  @UseGuards(JwtAuthGuard)
  @Get('auth-test')
  authTest(@Request() req) {
    return {
      message: 'Authentication successful',
      user: req.user,
    };
  }

  // Debug endpoint to check product images
  @Get('debug/images')
  async debugImages() {
    const products = await this.productsService.findAll(1, 100);
    return {
      products: products.products.map(p => ({
        id: p.id,
        name: p.name,
        images: p.images,
        imageType: typeof p.images,
        isArray: Array.isArray(p.images),
      }))
    };
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const cacheKey = `products:${id}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.productsService.findOne(id),
      600, // 10 minutes TTL
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('test/auth')
  testAuth(@Request() req) {
    return { message: 'JWT Auth works', user: req.user };
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id')
  @UseInterceptors(FilesInterceptor('images', 5, {
    storage: diskStorage({
      destination: './uploads/products',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, `product-${uniqueSuffix}${extname(file.originalname)}`);
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
  async update(@Param('id', ParseIntPipe) id: number, @Body() updateProductDto: UpdateProductDto, @UploadedFiles() files?: Express.Multer.File[]) {
    const result = await this.productsService.update(id, updateProductDto, files);
    // Invalidate product cache
    await this.cacheService.del(`products:${id}`);
    await this.cacheService.delByPattern('products:list:');
    return result;
  }

  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(Role.ADMIN)
  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    const result = await this.productsService.remove(id);
    // Invalidate product cache
    await this.cacheService.del(`products:${id}`);
    await this.cacheService.delByPattern('products:list:');
    return result;
  }
}