import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { CartService } from './cart.service';
import { AddToCartDto, UpdateCartItemDto } from './cart.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheService } from '../cache/cache.service';

@Controller('cart')
@UseGuards(JwtAuthGuard)
export class CartController {
  constructor(
    private readonly cartService: CartService,
    private readonly cacheService: CacheService,
  ) {}

  @Get()
  async getCart(@Request() req) {
    const cacheKey = `cart:${req.user.userId}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.cartService.getCart(req.user.userId),
      300, // 5 minutes TTL
    );
  }

  @Post('add')
  async addToCart(@Request() req, @Body() addToCartDto: AddToCartDto) {
    const result = await this.cartService.addToCart(req.user.userId, addToCartDto);
    await this.cacheService.del(`cart:${req.user.userId}`);
    return result;
  }

  @Patch('items/:itemId')
  async updateCartItem(
    @Request() req,
    @Param('itemId', ParseIntPipe) itemId: number,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ) {
    const result = await this.cartService.updateCartItem(req.user.userId, itemId, updateCartItemDto);
    await this.cacheService.del(`cart:${req.user.userId}`);
    return result;
  }

  @Delete('items/:itemId')
  async removeFromCart(@Request() req, @Param('itemId', ParseIntPipe) itemId: number) {
    const result = await this.cartService.removeFromCart(req.user.userId, itemId);
    await this.cacheService.del(`cart:${req.user.userId}`);
    return result;
  }

  @Delete('clear')
  async clearCart(@Request() req) {
    const result = await this.cartService.clearCart(req.user.userId);
    await this.cacheService.del(`cart:${req.user.userId}`);
    return result;
  }
}