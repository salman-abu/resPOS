import {
  Controller,
  Get,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  /**
   * GET /menu/categories
   * Returns all active categories for the current tenant.
   */
  @Get('categories')
  getCategories(@Req() req: any) {
    const tenantId: string = req.tenantId;
    return this.menuService.getCategories(tenantId);
  }

  /**
   * GET /menu/items?categoryId=<uuid>
   * Returns all available items. Optionally filtered by category.
   */
  @Get('items')
  getItems(@Req() req: any, @Query('categoryId') categoryId?: string) {
    const tenantId: string = req.tenantId;
    return this.menuService.getItems(tenantId, categoryId);
  }

  /**
   * PATCH /menu/items/:id/availability
   * Toggles "86" (mark unavailable) on an item.
   */
  @Patch('items/:id/availability')
  toggleAvailability(
    @Req() req: any,
    @Param('id') id: string,
    @Body('is_available') is_available: boolean,
  ) {
    const tenantId: string = req.tenantId;
    return this.menuService.toggleAvailability(tenantId, id, is_available);
  }
}
