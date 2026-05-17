import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Query,
  Body,
  UseGuards,
  Req,
  Header,
} from '@nestjs/common';
import { MenuService } from './menu.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('menu')
@UseGuards(JwtAuthGuard)
export class MenuController {
  constructor(private readonly menuService: MenuService) {}

  // ── Categories ─────────────────────────────────────────────────────────────

  @Get('categories')
  @Header('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
  getCategories(@Req() req: any) {
    return this.menuService.getCategories(req.tenantId);
  }

  @Post('categories')
  createCategory(@Req() req: any, @Body('name') name: string) {
    return this.menuService.createCategory(req.tenantId, name);
  }

  @Patch('categories/:id')
  updateCategory(
    @Req() req: any,
    @Param('id') id: string,
    @Body('name') name: string,
  ) {
    return this.menuService.updateCategory(req.tenantId, id, name);
  }

  @Delete('categories/:id')
  deleteCategory(@Req() req: any, @Param('id') id: string) {
    return this.menuService.deleteCategory(req.tenantId, id);
  }

  // ── Items ──────────────────────────────────────────────────────────────────

  @Get('items')
  @Header('Cache-Control', 'private, max-age=60, stale-while-revalidate=300')
  getItems(@Req() req: any, @Query('categoryId') categoryId?: string) {
    return this.menuService.getItems(req.tenantId, categoryId);
  }

  @Post('items')
  createItem(@Req() req: any, @Body() body: any) {
    return this.menuService.createItem(req.tenantId, body);
  }

  @Patch('items/:id')
  updateItem(@Req() req: any, @Param('id') id: string, @Body() body: any) {
    return this.menuService.updateItem(req.tenantId, id, body);
  }

  @Patch('items/:id/availability')
  toggleAvailability(
    @Req() req: any,
    @Param('id') id: string,
    @Body('is_available') is_available: boolean,
  ) {
    return this.menuService.toggleAvailability(req.tenantId, id, is_available);
  }

  @Delete('items/:id')
  deleteItem(@Req() req: any, @Param('id') id: string) {
    return this.menuService.deleteItem(req.tenantId, id);
  }

  @Post('sync')
  syncMenu(@Req() req: any) {
    return this.menuService.syncMenu(req.tenantId);
  }
}
