import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Req,
  HttpException,
} from '@nestjs/common';

import { OrdersService } from './orders.service';
import { CreateOrderDto, AddItemsToOrderDto } from './dto/order.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { Role } from '@prisma/client';

@Controller('orders')
@UseGuards(JwtAuthGuard, RolesGuard)
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get('cfd')
  async getCfdOrders(@Req() req: any) {
    return this.ordersService.getCfdOrders(req.tenantId);
  }

  /** POST /orders — Create a new order */
  @Post()
  async createOrder(@Req() req: any, @Body() dto: CreateOrderDto) {
    try {
      return await this.ordersService.createOrder(
        req.tenantId,
        req.user.sub,
        dto,
        req.trainingSessionId,
      );
    } catch (e: any) {
      throw new HttpException(e.message || String(e), 400);
    }
  }

  /** GET /orders/active — Get all non-settled orders, or single by table_id */
  @Get('active')
  getActiveOrders(@Req() req: any, @Query('table_id') tableId?: string) {
    if (tableId) {
      return this.ordersService.getActiveOrderByTable(
        req.tenantId,
        tableId,
        req.trainingSessionId,
      );
    }
    return this.ordersService.getActiveOrders(
      req.tenantId,
      req.trainingSessionId,
    );
  }

  /** GET /orders/tabs — Get all open bar tabs */
  @Get('tabs')
  getOpenTabs(@Req() req: any) {
    return this.ordersService.getOpenTabs(req.tenantId);
  }

  /** GET /orders/:id — Get a specific order with full details */
  @Get(':id')
  getOrder(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getOrder(req.tenantId, id);
  }

  /** GET /orders/:id/last-round — Get items from the most recent KOT */
  @Get(':id/last-round')
  getLastRound(@Req() req: any, @Param('id') id: string) {
    return this.ordersService.getLastRound(req.tenantId, id);
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
  async fireKot(
    @Req() req: any,
    @Param('id') id: string,
    @Body() body: { item_ids: string[] },
  ) {
    try {
      return await this.ordersService.fireKot(
        req.tenantId,
        id,
        req.user.sub,
        body.item_ids,
      );
    } catch (e: any) {
      throw new HttpException(e.message || String(e), 400);
    }
  }

  /** PATCH /orders/:id/void — Void an order (immediate) */
  @Patch(':id/void')
  voidOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body('reason') reason: string,
  ) {
    return this.ordersService.voidOrder(req.tenantId, id, reason, req.user.sub);
  }

  /** PATCH /orders/:id/items/hold — Mark items as HELD */
  @Patch(':id/items/hold')
  holdItems(
    @Req() req: any,
    @Param('id') id: string,
    @Body('item_ids') itemIds: string[],
  ) {
    return this.ordersService.holdItems(req.tenantId, id, itemIds);
  }

  /** PATCH /orders/:id/items/fire-held — Fire HELD items */
  @Patch(':id/items/fire-held')
  fireHeldItems(
    @Req() req: any,
    @Param('id') id: string,
    @Body('course_number') courseNumber?: number,
  ) {
    return this.ordersService.fireHeldItems(
      req.tenantId,
      id,
      req.user.sub,
      courseNumber,
    );
  }

  /** POST /orders/:id/open-tab — Mark an order as an open bar tab */
  @Post(':id/open-tab')
  openTab(
    @Req() req: any,
    @Param('id') id: string,
    @Body('tab_name') tabName: string,
  ) {
    return this.ordersService.openTab(req.tenantId, id, tabName);
  }

  /** PATCH /orders/:id/customer — Attach a customer to an order */
  @Patch(':id/customer')
  attachCustomer(
    @Req() req: any,
    @Param('id') id: string,
    @Body('customer_id') customerId: string,
  ) {
    return this.ordersService.attachCustomer(req.tenantId, id, customerId);
  }

  /** PATCH /orders/:id/transfer — Transfer an order to a new table */
  @Patch(':id/transfer')
  transferOrder(
    @Req() req: any,
    @Param('id') id: string,
    @Body('new_table_id') newTableId: string,
  ) {
    return this.ordersService.transferOrder(req.tenantId, id, newTableId);
  }
  /** POST /orders/:id/void-item — Void a specific item */
  @Post(':id/void-item')
  voidItem(
    @Req() req: any,
    @Param('id') id: string,
    @Body('item_id') itemId: string,
  ) {
    return this.ordersService.voidItem(req.tenantId, id, itemId, req.user.sub);
  }

  /** POST /orders/load-template — Load a previous order snapshot into a new cart */
  @Post('load-template')
  async loadTemplate(@Req() req: any, @Body() body: { history_id: string }) {
    return this.ordersService.loadTemplate(req.tenantId, body.history_id);
  }
}

@Controller('void-job')
@UseGuards(JwtAuthGuard)
export class VoidJobController {
  @Delete(':id')
  cancelVoidJob(@Param('id') id: string) {
    // No-op for now since voiding is synchronous
    return { cancelled: true };
  }
}
