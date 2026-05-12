import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import {
  CreateOrderDto,
  AddItemsToOrderDto,
  FireKotDto,
} from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('orders')
@UseGuards(JwtAuthGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  /** POST /orders — Create a new order */
  @Post()
  createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    return this.ordersService.createOrder(req.tenantId, req.user.sub, dto);
  }

  /** GET /orders/active — Get all non-settled orders */
  @Get('active')
  getActiveOrders(@Req() req: any) {
    return this.ordersService.getActiveOrders(req.tenantId);
  }

  /** GET /orders/:id — Get a specific order with full details */
  @Get(':id')
  getOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getOrder(req.tenantId, id);
  }

  /** POST /orders/:id/items — Add items to an existing order */
  @Post(':id/items')
  addItems(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: AddItemsToOrderDto,
  ) {
    return this.ordersService.addItems(req.tenantId, id, dto);
  }

  /** POST /orders/:id/kot — Fire KOT for selected pending items */
  @Post(':id/kot')
  fireKot(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { item_ids: string[] },
  ) {
    return this.ordersService.fireKot(
      req.tenantId,
      id,
      req.user.sub,
      body.item_ids,
    );
  }

  /** PATCH /orders/:id/void — Void an order */
  @Patch(':id/void')
  voidOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.voidOrder(req.tenantId, id, reason);
  }
}
