import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  Inject,
} from '@nestjs/common';
import { Observable, of } from 'rxjs';
import { tap } from 'rxjs/operators';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';
import { Request } from 'express';

@Injectable()
export class CacheInterceptor implements NestInterceptor {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, user } = request;

    // Only cache GET requests
    if (method !== 'GET') {
      return next.handle();
    }

    // Create cache key from URL and user ID (if authenticated)
    const userId = user ? (user as any).id : 'anonymous';
    const cacheKey = `${userId}:${url}`;

    try {
      // Try to get from cache
      const cachedData = await this.cacheManager.get(cacheKey);
      if (cachedData) {
        return of(cachedData);
      }
    } catch (error) {
      // If cache retrieval fails, continue without cache
      console.warn(`Cache retrieval failed for key: ${cacheKey}`, error);
    }

    // If not in cache, execute the handler and cache the result
    return next.handle().pipe(
      tap(async (data) => {
        try {
          await this.cacheManager.set(cacheKey, data);
        } catch (error) {
          console.warn(`Cache set failed for key: ${cacheKey}`, error);
        }
      }),
    );
  }
}
