import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, UpdateProductDto } from './product.dto';

@Injectable()
export class ProductsService {
  constructor(private prisma: PrismaService) {}

  async create(createProductDto: CreateProductDto, files?: Express.Multer.File[]) {
    const { images, ...productData } = createProductDto;
    
    // Process uploaded files
    const imageUrls = files ? files.map(file => `/uploads/products/${file.filename}`) : [];
    
    console.log('Creating product with images:');
    console.log('Files received:', files?.length || 0);
    console.log('Image URLs:', imageUrls);
    console.log('Images from DTO:', images);
    
    const finalImages = imageUrls.length > 0 ? imageUrls : (images || []);
    console.log('Final images to save:', finalImages);
    
    return this.prisma.product.create({
      data: {
        ...productData,
        images: finalImages,
      },
      include: {
        category: true,
      },
    });
  }

  async findAll(page = 1, limit = 10, search?: string, categoryId?: number) {
    const skip = (page - 1) * limit;
    
    const where = {
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' as const } },
          { description: { contains: search, mode: 'insensitive' as const } },
        ],
      }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      this.prisma.product.findMany({
        where,
        skip,
        take: limit,
        include: {
          category: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.product.count({ where }),
    ]);

    return {
      products,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    };
  }

  async findOne(id: number) {
    const product = await this.prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
      },
    });

    if (!product) {
      throw new NotFoundException('Product not found');
    }

    return product;
  }

  async update(id: number, updateProductDto: UpdateProductDto, files?: Express.Multer.File[]) {
    const { images, ...productData } = updateProductDto;
    
    // Process uploaded files
    const imageUrls = files ? files.map(file => `/uploads/products/${file.filename}`) : [];
    
    const product = await this.prisma.product.update({
      where: { id },
      data: {
        ...productData,
        ...(imageUrls.length > 0 ? { images: imageUrls } : images && { images }),
      },
      include: {
        category: true,
      },
    });

    return product;
  }

  async remove(id: number) {
    await this.prisma.product.delete({
      where: { id },
    });

    return { message: 'Product deleted successfully' };
  }
}