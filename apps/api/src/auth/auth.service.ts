import {
  Injectable,
  UnauthorizedException,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import * as bcrypt from 'bcrypt';
import Redis from 'ioredis';
import RedisMock from 'ioredis-mock';

@Injectable()
export class AuthService {
  private redis: Redis;

  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private auditService: AuditService,
  ) {
    if (process.env.MOCK_REDIS === 'true') {
      this.redis = new RedisMock() as unknown as Redis;
    } else {
      this.redis = new Redis(process.env.REDIS_URL || 'redis://localhost:6379');
    }
  }

  async getTerminalInfo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, is_active: true },
    });
    if (!tenant)
      throw new UnauthorizedException('Invalid or suspended terminal');

    const staff = await this.prisma.user.findMany({
      where: { tenant_id: tenantId, is_active: true },
      select: { id: true, name: true, role: true },
    });

    return {
      tenantName: tenant.name,
      staff,
    };
  }

  async loginWithPin(tenantId: string, userId: string, pin: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: userId, tenant_id: tenantId, is_active: true },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid user credentials');
    }

    const isPinValid = await bcrypt.compare(pin, user.pin_hash);

    if (!isPinValid) {
      throw new UnauthorizedException('Invalid PIN');
    }

    const payload = { sub: user.id, tenantId: user.tenant_id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    };
  }

  async loginOwner(email: string, pin: string) {
    const user = await this.prisma.user.findFirst({
      where: { email, is_active: true },
    });

    if (!user || user.role !== 'OWNER') {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = { sub: user.id, tenantId: user.tenant_id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        name: user.name,
        role: user.role,
        tenant_id: user.tenant_id,
      },
    };
  }

  async verifyManagerPin(tenantId: string, managerId: string, pin: string) {
    const user = await this.prisma.user.findFirst({
      where: { id: managerId, tenant_id: tenantId, is_active: true },
    });

    if (!user) {
      await this.auditService
        .log({
          tenantId,
          action: 'SCREEN_UNLOCKED',
          entityType: 'USER',
          entityId: managerId,
          performedBy: managerId,
          reason: 'Manager not found during PIN verification',
        })
        .catch(() => {}); // non-blocking
      throw new UnauthorizedException('Manager not found');
    }

    if (user.role !== 'MANAGER' && user.role !== 'OWNER') {
      await this.auditService
        .log({
          tenantId,
          action: 'SCREEN_UNLOCKED',
          entityType: 'USER',
          entityId: managerId,
          performedBy: managerId,
          reason: `Unauthorized role ${user.role} attempted PIN verification`,
        })
        .catch(() => {});
      throw new UnauthorizedException('Only MANAGER or OWNER can authorize');
    }

    const isPinValid = await bcrypt.compare(pin, user.pin_hash);
    if (!isPinValid) {
      await this.auditService
        .log({
          tenantId,
          action: 'SCREEN_UNLOCKED',
          entityType: 'USER',
          entityId: managerId,
          performedBy: managerId,
          reason: 'Invalid manager PIN',
        })
        .catch(() => {});
      throw new UnauthorizedException('Invalid manager PIN');
    }

    // Issue short-lived authorization token (2 minute expiry, one-time-use)
    const jti = crypto.randomUUID();
    const payload = {
      sub: user.id,
      tenantId: user.tenant_id,
      role: user.role,
      purpose: 'manager_pin_auth',
      jti,
    };

    const token = this.jwtService.sign(payload, { expiresIn: '2m' });
    await this.redis.setex(`manager_auth:${jti}`, 120, 'true');

    await this.auditService
      .log({
        tenantId,
        action: 'SCREEN_UNLOCKED',
        entityType: 'USER',
        entityId: managerId,
        performedBy: managerId,
        reason: 'Manager PIN verified successfully',
        newValue: { role: user.role, expires_in: 120 },
      })
      .catch(() => {});

    return {
      authorization_token: token,
      manager_name: user.name,
      expires_in: 120,
    };
  }

  async validateManagerAuthToken(token: string): Promise<boolean> {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.purpose !== 'manager_pin_auth') return false;

      // Check one-time-use validity
      const key = `manager_auth:${payload.jti}`;
      const exists = await this.redis.get(key);
      if (!exists) return false;

      // Consume the token
      await this.redis.del(key);
      return true;
    } catch {
      return false;
    }
  }
}
