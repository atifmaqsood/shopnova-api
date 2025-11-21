import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateAddressDto, UpdateAddressDto } from './address.dto';
import { Address } from '@prisma/client';

@Injectable()
export class AddressService {
  constructor(private prisma: PrismaService) {}

  async create(userId: number, createAddressDto: CreateAddressDto): Promise<Address> {
    const { isDefault, ...addressData } = createAddressDto;

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true },
        data: { isDefault: false },
      });
    }

    return await this.prisma.address.create({
      data: {
        ...addressData,
        userId,
        isDefault: isDefault || false,
      },
    });
  }

  async findAll(userId: number): Promise<Address[]> {
    return await this.prisma.address.findMany({
      where: { userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  async findOne(userId: number, id: number): Promise<Address> {
    const address = await this.prisma.address.findFirst({
      where: { id, userId },
    });

    if (!address) {
      throw new NotFoundException('Address not found');
    }

    return address;
  }

  async update(userId: number, id: number, updateAddressDto: UpdateAddressDto): Promise<Address> {
    const address = await this.findOne(userId, id);
    const { isDefault, ...addressData } = updateAddressDto;

    // If this is set as default, unset other default addresses
    if (isDefault) {
      await this.prisma.address.updateMany({
        where: { userId, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      });
    }

    return await this.prisma.address.update({
      where: { id },
      data: {
        ...addressData,
        ...(isDefault !== undefined && { isDefault }),
      },
    });
  }

  async remove(userId: number, id: number) {
    const address = await this.findOne(userId, id);

    if (address.isDefault) {
      const otherAddresses = await this.prisma.address.findMany({
        where: { userId, id: { not: id } },
      });

      if (otherAddresses.length > 0) {
        await this.prisma.address.update({
          where: { id: otherAddresses[0].id },
          data: { isDefault: true },
        });
      }
    }

    await this.prisma.address.delete({
      where: { id },
    });

    return { message: 'Address deleted successfully' };
  }

  async setDefault(userId: number, id: number): Promise<Address> {
    await this.findOne(userId, id);

    await this.prisma.address.updateMany({
      where: { userId, isDefault: true },
      data: { isDefault: false },
    });

    return await this.prisma.address.update({
      where: { id },
      data: { isDefault: true },
    });
  }
}