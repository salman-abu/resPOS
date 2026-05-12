import {
  Injectable,
  NestMiddleware,
  BadRequestException,
} from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private prisma: PrismaService) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // If the route is already authenticated, the tenant is resolved from JWT
    // This middleware can be used for public routes that require a tenant context
    const tenantId = req.headers['x-tenant-id'] as string;

    if (tenantId) {
      const tenant = await this.prisma.tenant.findUnique({
        where: { id: tenantId, is_active: true },
      });

      if (!tenant) {
        throw new BadRequestException('Invalid or inactive tenant');
      }

      // Attach tenant context
      (req as any).tenant = tenant;
    }

    next();
  }
}
