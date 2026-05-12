import {
  Controller,
  Post,
  Body,
  Param,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { AggregatorsService } from './aggregators.service';
import { AggregatorSource } from '@prisma/client';

@Controller('aggregators')
export class AggregatorsController {
  constructor(private readonly aggregatorsService: AggregatorsService) {}

  /**
   * Public webhook endpoint for Swiggy/Zomato.
   * Authentication is usually done via a shared secret in headers.
   */
  @Post('webhook/:aggregator/:tenantId')
  async handleWebhook(
    @Param('aggregator') aggregatorStr: string,
    @Param('tenantId') tenantId: string,
    @Headers('x-aggregator-signature') signature: string, // Simple mock security
    @Body() payload: any,
  ) {
    // Basic security check (in production, verify HMAC signature)
    if (!signature) {
      throw new UnauthorizedException('Missing webhook signature');
    }

    const aggregator = aggregatorStr.toUpperCase() as AggregatorSource;
    if (!Object.values(AggregatorSource).includes(aggregator)) {
      throw new Error(`Unsupported aggregator: ${aggregator}`);
    }

    return this.aggregatorsService.handleWebhook(tenantId, aggregator, payload);
  }

  /**
   * Sync menu to aggregator
   */
  @Post('sync/:aggregator/:tenantId')
  async syncMenu(
    @Param('aggregator') aggregatorStr: string,
    @Param('tenantId') tenantId: string,
  ) {
    const aggregator = aggregatorStr.toUpperCase() as AggregatorSource;
    return this.aggregatorsService.syncMenu(tenantId, aggregator);
  }
}
