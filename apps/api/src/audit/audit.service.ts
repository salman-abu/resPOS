import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditAction, Prisma } from '@prisma/client';

export interface AuditQueryFilters {
  action?: AuditAction;
  performedBy?: string;
  entityType?: string;
  entityId?: string;
  from?: Date;
  to?: Date;
}

@Injectable()
export class AuditService {
  constructor(private prisma: PrismaService) {}

  async log(params: {
    tenantId: string;
    action: AuditAction;
    entityType: string;
    entityId: string;
    performedBy: string;
    authorizedBy?: string;
    reason?: string;
    oldValue?: any;
    newValue?: any;
    ipAddress?: string;
  }) {
    return this.prisma.auditLog.create({
      data: {
        tenant_id: params.tenantId,
        action: params.action,
        entity_type: params.entityType,
        entity_id: params.entityId,
        performed_by: params.performedBy,
        authorized_by: params.authorizedBy,
        reason: params.reason,
        old_value: params.oldValue,
        new_value: params.newValue,
        ip_address: params.ipAddress,
      },
    });
  }

  async getLogs(
    tenantId: string,
    filters: AuditQueryFilters = {},
    page = 1,
    limit = 50,
  ) {
    const where: Prisma.AuditLogWhereInput = {
      tenant_id: tenantId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.performedBy ? { performed_by: filters.performedBy } : {}),
      ...(filters.entityType ? { entity_type: filters.entityType } : {}),
      ...(filters.entityId ? { entity_id: filters.entityId } : {}),
      ...(filters.from || filters.to
        ? {
            created_at: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.auditLog.findMany({
        where,
        orderBy: { created_at: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.auditLog.count({ where }),
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async exportToCsv(tenantId: string, filters: AuditQueryFilters = {}) {
    const where: Prisma.AuditLogWhereInput = {
      tenant_id: tenantId,
      ...(filters.action ? { action: filters.action } : {}),
      ...(filters.performedBy ? { performed_by: filters.performedBy } : {}),
      ...(filters.entityType ? { entity_type: filters.entityType } : {}),
      ...(filters.entityId ? { entity_id: filters.entityId } : {}),
      ...(filters.from || filters.to
        ? {
            created_at: {
              ...(filters.from ? { gte: filters.from } : {}),
              ...(filters.to ? { lte: filters.to } : {}),
            },
          }
        : {}),
    };

    const logs = await this.prisma.auditLog.findMany({
      where,
      orderBy: { created_at: 'desc' },
    });

    const headers = [
      'ID',
      'Action',
      'Entity Type',
      'Entity ID',
      'Performed By',
      'Authorized By',
      'Reason',
      'Old Value',
      'New Value',
      'IP Address',
      'Created At',
    ];

    const rows = logs.map((log) => [
      log.id,
      log.action,
      log.entity_type,
      log.entity_id,
      log.performed_by,
      log.authorized_by || '',
      log.reason || '',
      log.old_value ? JSON.stringify(log.old_value) : '',
      log.new_value ? JSON.stringify(log.new_value) : '',
      log.ip_address || '',
      log.created_at.toISOString(),
    ]);

    // RFC 4180 CSV escaping
    const escapeCsv = (val: string) => {
      if (/[",\n\r]/.test(val)) {
        return `"${val.replace(/"/g, '""')}"`;
      }
      return val;
    };

    const csv =
      headers.map(escapeCsv).join(',') +
      '\n' +
      rows.map((row) => row.map(String).map(escapeCsv).join(',')).join('\n');

    return csv;
  }
}
