import { Controller, Get, Post, Body, Patch, Param, Query, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto, UpdateOrderStatusDto } from './order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { Role } from '@prisma/client';
import { CacheService } from '../cache/cache.service';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly cacheService: CacheService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createOrderDto: CreateOrderDto) {
    const result = await this.ordersService.createOrder(req.user.userId, createOrderDto);
    // Invalidate user orders cache
    await this.cacheService.delByPattern(`orders:${req.user.userId}:`);
    return result;
  }

  @Get()
  async findAll(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    // Regular users see only their orders, admins see all orders
    const userId = req.user.role === Role.ADMIN ? undefined : req.user.userId;
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    
    const cacheKey = `orders:${userId || 'all'}:${pageNum}:${limitNum}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.ordersService.findAll(userId, pageNum, limitNum),
      300, // 5 minutes TTL
    );
  }

  @Get('my-orders')
  async getMyOrders(@Request() req, @Query('page') page?: string, @Query('limit') limit?: string) {
    const pageNum = page ? parseInt(page) : 1;
    const limitNum = limit ? parseInt(limit) : 10;
    
    const cacheKey = `orders:${req.user.userId}:my:${pageNum}:${limitNum}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.ordersService.getUserOrders(req.user.userId, pageNum, limitNum),
      300, // 5 minutes TTL
    );
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const cacheKey = `orders:${id}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.ordersService.findOne(id),
      600, // 10 minutes TTL
    );
  }

  @UseGuards(RolesGuard)
  @Roles(Role.ADMIN)
  @Patch(':id/status')
  async updateStatus(@Param('id', ParseIntPipe) id: number, @Body() updateOrderStatusDto: UpdateOrderStatusDto) {
    const result = await this.ordersService.updateStatus(id, updateOrderStatusDto);
    // Invalidate order cache
    await this.cacheService.del(`orders:${id}`);
    await this.cacheService.delByPattern('orders:');
    return result;
  }
}