import {
  Controller,
  Get,
  Patch,
  Param,
  Body,
  UseGuards,
  Req,
  Query,
} from '@nestjs/common';
import { KdsService } from './kds.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('kds')
@UseGuards(JwtAuthGuard)
export class KdsController {
  constructor(private readonly kdsService: KdsService) {}

  /** GET /kds/kots?station=HOT_KITCHEN — Initial load of active KOTs */
  @Get('kots')
  getActiveKots(@Req() req: any, @Query('station') station?: string) {
    return this.kdsService.getActiveKots(req.tenantId, station);
  }

  /** PATCH /kds/kot/:kotId/item/:itemId — Toggle item done/undone */
  @Patch('kot/:kotId/item/:itemId')
  markItemDone(
    @Req() req: any,
    @Param('kotId') kotId: string,
    @Param('itemId') itemId: string,
    @Body('done') done: boolean,
  ) {
    return this.kdsService.markItemDone(req.tenantId, kotId, itemId, done);
  }

  /** PATCH /kds/kot/:kotId/bump — Bump KOT off screen (served) */
  @Patch('kot/:kotId/bump')
  bumpKot(@Req() req: any, @Param('kotId') kotId: string) {
    return this.kdsService.bumpKot(req.tenantId, kotId);
  }

  /** PATCH /kds/kot/:kotId/recall — Recall a bumped KOT */
  @Patch('kot/:kotId/recall')
  recallKot(@Req() req: any, @Param('kotId') kotId: string) {
    return this.kdsService.recallKot(req.tenantId, req.user.sub, kotId);
  }
}
