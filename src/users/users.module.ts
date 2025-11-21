import { Module } from '@nestjs/common';
import { UsersService } from './users.service';
import { UsersController } from './users.controller';
import { AddressService } from './address.service';
import { AddressController } from './address.controller';

@Module({
  controllers: [UsersController, AddressController],
  providers: [UsersService, AddressService],
  exports: [UsersService, AddressService],
})
export class UsersModule {}