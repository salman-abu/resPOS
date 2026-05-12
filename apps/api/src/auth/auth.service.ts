import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { PrismaService } from '../prisma/prisma.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async validatePin(tenantId: string, pin: string) {
    // Basic pin auth for staff (assuming we match by tenant ID and find matching pin)
    // In a real scenario, you might pass username/userId + pin
    // For this example, let's say they provide userId and pin
    return null;
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

  // Example method for owner login (email/password), we can add password_hash to User later if needed,
  // or use pin_hash if owner also uses PIN.
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
}
