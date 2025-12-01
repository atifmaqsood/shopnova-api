import { Controller, Get, Post, Body, Patch, Param, Delete, UseGuards, Request, ParseIntPipe } from '@nestjs/common';
import { AddressService } from './address.service';
import { CreateAddressDto, UpdateAddressDto } from './address.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CacheService } from '../cache/cache.service';

@Controller('addresses')
@UseGuards(JwtAuthGuard)
export class AddressController {
  constructor(
    private readonly addressService: AddressService,
    private readonly cacheService: CacheService,
  ) {}

  @Post()
  async create(@Request() req, @Body() createAddressDto: CreateAddressDto) {
    const result = await this.addressService.create(req.user.userId, createAddressDto);
    await this.cacheService.delByPattern(`addresses:${req.user.userId}:`);
    return result;
  }

  @Get()
  async findAll(@Request() req) {
    const cacheKey = `addresses:${req.user.userId}:list`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.addressService.findAll(req.user.userId),
      300, // 5 minutes TTL
    );
  }

  @Get(':id')
  async findOne(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const cacheKey = `addresses:${req.user.userId}:${id}`;
    return this.cacheService.getOrSet(
      cacheKey,
      () => this.addressService.findOne(req.user.userId, id),
      300, // 5 minutes TTL
    );
  }

  @Patch(':id')
  async update(@Request() req, @Param('id', ParseIntPipe) id: number, @Body() updateAddressDto: UpdateAddressDto) {
    const result = await this.addressService.update(req.user.userId, id, updateAddressDto);
    await this.cacheService.del(`addresses:${req.user.userId}:${id}`);
    await this.cacheService.del(`addresses:${req.user.userId}:list`);
    return result;
  }

  @Delete(':id')
  async remove(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const result = await this.addressService.remove(req.user.userId, id);
    await this.cacheService.del(`addresses:${req.user.userId}:${id}`);
    await this.cacheService.del(`addresses:${req.user.userId}:list`);
    return result;
  }

  @Patch(':id/set-default')
  async setDefault(@Request() req, @Param('id', ParseIntPipe) id: number) {
    const result = await this.addressService.setDefault(req.user.userId, id);
    await this.cacheService.delByPattern(`addresses:${req.user.userId}:`);
    return result;
  }
}