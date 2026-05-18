import {
  Injectable,
  BadRequestException,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingService {
  constructor(private readonly prisma: PrismaService) {}

  async startTraining(tenantId: string, terminalId: string, startedBy: string) {
    // End any existing active session for this terminal
    await this.prisma.trainingSession.updateMany({
      where: { tenant_id: tenantId, terminal_id: terminalId, is_active: true },
      data: { is_active: false, ended_at: new Date() },
    });

    const session = await this.prisma.trainingSession.create({
      data: {
        tenant_id: tenantId,
        terminal_id: terminalId,
        started_by: startedBy,
        is_active: true,
      },
    });

    return { sessionId: session.id, startedAt: session.started_at };
  }

  async endTraining(tenantId: string, terminalId: string) {
    const session = await this.prisma.trainingSession.findFirst({
      where: { tenant_id: tenantId, terminal_id: terminalId, is_active: true },
    });

    if (!session) {
      throw new NotFoundException(
        'No active training session found for this terminal',
      );
    }

    // Wipe all training data for this session
    await this.prisma.$transaction([
      this.prisma.orderItemAddon.deleteMany({
        where: {
          order_item: {
            order: { training_session_id: session.id },
          },
        },
      }),
      this.prisma.orderItem.deleteMany({
        where: { order: { training_session_id: session.id } },
      }),
      this.prisma.payment.deleteMany({
        where: { invoice: { training_session_id: session.id } },
      }),
      this.prisma.invoice.deleteMany({
        where: { training_session_id: session.id },
      }),
      this.prisma.kOT.deleteMany({
        where: { training_session_id: session.id },
      }),
      this.prisma.order.deleteMany({
        where: { training_session_id: session.id },
      }),
    ]);

    await this.prisma.trainingSession.update({
      where: { id: session.id },
      data: { is_active: false, ended_at: new Date() },
    });

    return { success: true, message: 'Training mode ended and data wiped' };
  }

  async getStatus(tenantId: string, terminalId: string) {
    const session = await this.prisma.trainingSession.findFirst({
      where: { tenant_id: tenantId, terminal_id: terminalId, is_active: true },
    });

    return {
      isTraining: !!session,
      sessionId: session?.id ?? null,
      startedAt: session?.started_at ?? null,
    };
  }

  async purgeOldTrainingData() {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    const oldSessions = await this.prisma.trainingSession.findMany({
      where: {
        is_active: false,
        ended_at: { lt: cutoff },
      },
    });

    let purgedCount = 0;
    for (const session of oldSessions) {
      await this.prisma.$transaction([
        this.prisma.orderItemAddon.deleteMany({
          where: {
            order_item: {
              order: { training_session_id: session.id },
            },
          },
        }),
        this.prisma.orderItem.deleteMany({
          where: { order: { training_session_id: session.id } },
        }),
        this.prisma.payment.deleteMany({
          where: { invoice: { training_session_id: session.id } },
        }),
        this.prisma.invoice.deleteMany({
          where: { training_session_id: session.id },
        }),
        this.prisma.kOT.deleteMany({
          where: { training_session_id: session.id },
        }),
        this.prisma.order.deleteMany({
          where: { training_session_id: session.id },
        }),
        this.prisma.trainingSession.delete({
          where: { id: session.id },
        }),
      ]);
      purgedCount++;
    }

    return { purgedCount };
  }
}
