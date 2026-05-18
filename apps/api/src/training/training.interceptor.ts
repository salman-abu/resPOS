import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TrainingInterceptor implements NestInterceptor {
  constructor(private readonly prisma: PrismaService) {}

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const req = context.switchToHttp().getRequest();
    const user = req.user;
    const terminalId = req.headers['x-terminal-id'] as string | undefined;

    if (user && user.mode === 'TRAINING' && terminalId) {
      const session = await this.prisma.trainingSession.findFirst({
        where: {
          tenant_id: req.tenantId,
          terminal_id: terminalId,
          is_active: true,
        },
      });

      if (session) {
        req.trainingSessionId = session.id;
      }
    }

    return next.handle();
  }
}
