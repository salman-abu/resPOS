import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  Req,
} from '@nestjs/common';
import { InventoryService } from './inventory.service';
import { CreateIngredientDto, UpdateStockDto } from './dto/inventory.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

@Controller('inventory')
@UseGuards(JwtAuthGuard, RolesGuard)
export class InventoryController {
  constructor(private readonly inventoryService: InventoryService) {}

  @Get('ingredients')
  @Roles('OWNER', 'MANAGER', 'KITCHEN')
  getIngredients(@Req() req: any) {
    return this.inventoryService.getIngredients(req.tenantId);
  }

  @Post('ingredients')
  @Roles('OWNER', 'MANAGER')
  createIngredient(@Req() req: any, @Body() dto: CreateIngredientDto) {
    return this.inventoryService.createIngredient(req.tenantId, dto);
  }

  @Patch('ingredients/:id/stock')
  @Roles('OWNER', 'MANAGER')
  updateStock(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateStockDto,
  ) {
    return this.inventoryService.updateStock(
      req.tenantId,
      id,
      dto,
      req.user.sub,
    );
  }
}
