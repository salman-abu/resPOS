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

  async getTerminalInfo(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId, is_active: true }
    });
    if (!tenant) throw new UnauthorizedException('Invalid or suspended terminal');

    const staff = await this.prisma.user.findMany({
      where: { tenant_id: tenantId, is_active: true },
      select: { id: true, name: true, role: true }
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
