import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
  Header,
} from '@nestjs/common';
import { BillingService } from './billing.service';
import {
  GenerateInvoiceDto,
  SettleInvoiceDto,
  OpenShiftDto,
  CloseShiftDto,
} from './dto/billing.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('billing')
@UseGuards(JwtAuthGuard)
export class BillingController {
  constructor(private readonly billingService: BillingService) {}

  // ─── Invoice ────────────────────────────────────────────────────────────────

  /** POST /billing/invoice — Generate GST invoice for an order */
  @Post('invoice')
  async generate(@Req() req: any, @Body() dto: GenerateInvoiceDto) {
    return this.billingService.generateInvoice(req.tenantId, req.user.sub, dto);
  }

  @Post('invoice/split')
  async split(
    @Req() req: any,
    @Body() dto: { order_id: string; splits: { itemIds: string[] }[] },
  ) {
    return this.billingService.splitInvoices(
      req.tenantId,
      req.user.sub,
      dto.order_id,
      dto.splits,
    );
  }

  /** GET /billing/invoice/:id — Fetch invoice details (for reprint) */
  @Get('invoice/:id')
  getInvoice(@Req() req: any, @Param('id') id: string) {
    return this.billingService.getInvoice(req.tenantId, id);
  }

  /** POST /billing/invoice/:id/settle — Record split payments & settle */
  @Post('invoice/:id/settle')
  settleInvoice(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: SettleInvoiceDto,
  ) {
    return this.billingService.settleInvoice(
      req.tenantId,
      req.user.sub,
      id,
      dto,
    );
  }

  // ─── Shift ───────────────────────────────────────────────────────────────────

  /** POST /billing/shift/open — Open cashier shift */
  @Post('shift/open')
  openShift(@Req() req: any, @Body() dto: OpenShiftDto) {
    return this.billingService.openShift(req.tenantId, req.user.sub, dto);
  }

  /** POST /billing/shift/close — Close shift + generate Z-Report */
  @Post('shift/close')
  closeShift(@Req() req: any, @Body() dto: CloseShiftDto) {
    return this.billingService.closeShift(req.tenantId, dto);
  }

  /** GET /billing/shift/z-report — Get latest shift Z-Report */
  @Get('shift/z-report')
  @Header('Cache-Control', 'private, max-age=30, stale-while-revalidate=60')
  getZReport(@Req() req: any) {
    return this.billingService.getZReport(req.tenantId);
  }

  // ─── Floor Plan ──────────────────────────────────────────────────────────────

  /** GET /billing/tables — Get all zones with table statuses */
  @Get('tables')
  @Header('Cache-Control', 'private, max-age=10, stale-while-revalidate=30')
  getTables(@Req() req: any) {
    return this.billingService.getTables(req.tenantId);
  }
}
