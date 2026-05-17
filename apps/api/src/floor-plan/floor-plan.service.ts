import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { FloorPlanGateway } from './floor-plan.gateway';

@Injectable()
export class FloorPlanService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: FloorPlanGateway,
  ) {}

  // ─── Zones ─────────────────────────────────────────────────────────────

  async getZones(tenantId: string) {
    return this.prisma.zone.findMany({
      where: { tenant_id: tenantId },
      include: {
        tables: {
          orderBy: { table_number: 'asc' },
        },
      },
      orderBy: { name: 'asc' },
    });
  }

  async createZone(tenantId: string, name: string) {
    if (!name) throw new BadRequestException('Zone name is required');
    return this.prisma.zone.create({
      data: { tenant_id: tenantId, name },
      include: { tables: true },
    });
  }

  async updateZone(tenantId: string, zoneId: string, name: string) {
    if (!name) throw new BadRequestException('Zone name is required');
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, tenant_id: tenantId },
    });
    if (!zone) throw new NotFoundException('Zone not found');

    return this.prisma.zone.update({
      where: { id: zoneId },
      data: { name },
      include: { tables: true },
    });
  }

  async deleteZone(tenantId: string, zoneId: string) {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, tenant_id: tenantId },
      include: { tables: true },
    });
    if (!zone) throw new NotFoundException('Zone not found');
    if (zone.tables.length > 0) {
      throw new BadRequestException(
        'Cannot delete a zone that contains tables. Please delete or move the tables first.',
      );
    }

    await this.prisma.zone.delete({ where: { id: zoneId } });
    return { success: true };
  }

  // ─── Tables ────────────────────────────────────────────────────────────

  async addTable(
    tenantId: string,
    zoneId: string,
    data: { table_number: string; capacity: number },
  ) {
    const zone = await this.prisma.zone.findFirst({
      where: { id: zoneId, tenant_id: tenantId },
    });
    if (!zone) throw new NotFoundException('Zone not found');

    return this.prisma.table.create({
      data: {
        tenant_id: tenantId,
        zone_id: zoneId,
        table_number: data.table_number,
        capacity: data.capacity || 4,
        status: 'AVAILABLE',
      },
    });
  }

  async updateTable(
    tenantId: string,
    tableId: string,
    data: { table_number?: string; capacity?: number },
  ) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, tenant_id: tenantId },
    });
    if (!table) throw new NotFoundException('Table not found');

    return this.prisma.table.update({
      where: { id: tableId },
      data: {
        ...(data.table_number && { table_number: data.table_number }),
        ...(data.capacity && { capacity: data.capacity }),
      },
    });
  }

  async deleteTable(tenantId: string, tableId: string) {
    const table = await this.prisma.table.findFirst({
      where: { id: tableId, tenant_id: tenantId },
    });
    if (!table) throw new NotFoundException('Table not found');

    if (table.status !== 'AVAILABLE' && table.status !== 'DIRTY') {
      throw new BadRequestException('Cannot delete an active table.');
    }

    await this.prisma.table.delete({ where: { id: tableId } });
    return { success: true };
  }

  // ─── Table Status Update (Phase 1.4) ───────────────────────────────────

  async updateTableStatus(tenantId: string, tableId: string, status: string) {
    const validStatuses = [
      'AVAILABLE',
      'OCCUPIED',
      'BILLED',
      'RESERVED',
      'DIRTY',
    ];
    if (!validStatuses.includes(status)) {
      throw new BadRequestException(
        `Invalid status "${status}". Must be one of: ${validStatuses.join(', ')}`,
      );
    }

    const table = await this.prisma.table.findFirst({
      where: { id: tableId, tenant_id: tenantId },
    });
    if (!table) throw new NotFoundException('Table not found');

    // BUSINESS RULE: clear current_order_id when marking AVAILABLE or RESERVED
    const updateData: any = { status: status as any };
    if (status === 'AVAILABLE' || status === 'RESERVED') {
      updateData.current_order_id = null;
    }

    const updated = await this.prisma.table.update({
      where: { id: tableId },
      data: updateData,
    });

    this.gateway.emitTableStatusChanged(tenantId, {
      id: updated.id,
      status: updated.status,
      table_number: updated.table_number,
    });
    return updated;
  }
}
