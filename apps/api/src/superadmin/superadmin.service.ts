import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
  ) {}

  async login(email: string, passwordString: string) {
    const admin = await this.prisma.superAdmin.findUnique({
      where: { email },
    });

    if (!admin || !admin.is_active) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isMatch = await bcrypt.compare(passwordString, admin.password);
    if (!isMatch) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const payload = {
      sub: admin.id,
      email: admin.email,
      is_super_admin: true,
      level: admin.level,
    };
    return {
      access_token: this.jwtService.sign(payload),
      admin: { name: admin.name, email: admin.email, level: admin.level },
    };
  }

  async getDashboardStats() {
    const totalTenants = await this.prisma.tenant.count();
    const activeTenants = await this.prisma.tenant.count({
      where: { is_active: true },
    });
    const totalOrders = await this.prisma.order.count();

    // Calculate total GMV (Gross Merchandise Value)
    const invoices = await this.prisma.invoice.findMany({
      select: { total: true },
    });
    const totalGmv = invoices.reduce((acc, curr) => acc + curr.total, 0);

    return {
      totalTenants,
      activeTenants,
      totalOrders,
      totalGmv,
    };
  }

  async getAllTenants() {
    return this.prisma.tenant.findMany({
      include: {
        _count: {
          select: { outlets: true, users: true, orders: true },
        },
      },
      orderBy: { created_at: 'desc' },
    });
  }

  async toggleTenantStatus(id: string, is_active: boolean) {
    return this.prisma.tenant.update({
      where: { id },
      data: { is_active },
    });
  }

  async updateTenantSubscription(id: string, data: any) {
    return this.prisma.tenant.update({
      where: { id },
      data,
    });
  }

  async impersonateTenant(tenantId: string) {
    const tenant = await this.prisma.tenant.findUnique({
      where: { id: tenantId },
    });

    if (!tenant) {
      throw new NotFoundException('Tenant not found');
    }

    // Generate a temporary JWT acting as an OWNER of this tenant
    const payload = {
      sub: `impersonate_${tenantId}`,
      tenant_id: tenantId,
      role: 'OWNER',
      is_impersonated: true,
    };

    return {
      access_token: this.jwtService.sign(payload),
      tenant_name: tenant.name,
    };
  }
}
