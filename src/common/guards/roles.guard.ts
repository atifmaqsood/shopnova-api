import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Role } from '@prisma/client';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<Role[]>('roles', [
      context.getHandler(),
      context.getClass(),
    ]);
    console.log('Required Roles:', requiredRoles);
    if (!requiredRoles) return true;

    const { user } = context.switchToHttp().getRequest();
    console.log('User from request:', user);
    const hasRole = requiredRoles.some((role) => user?.role === role);
    console.log('Has required role:', hasRole);
    return hasRole;
  }
}
