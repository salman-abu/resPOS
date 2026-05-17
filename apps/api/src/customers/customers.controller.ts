import {
  Controller,
  Post,
  Patch,
  Get,
  Body,
  Param,
  Req,
  UseGuards,
} from '@nestjs/common';
import { CustomersService } from './customers.service';
import { CreateCustomerDto, UpdateCustomerDto } from './dto/customer.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Role } from '@prisma/client';
import { Roles } from '../auth/decorators/roles.decorator';
import { RolesGuard } from '../auth/guards/roles.guard';

@Controller('customers')
@UseGuards(JwtAuthGuard, RolesGuard)
export class CustomersController {
  constructor(private readonly customersService: CustomersService) {}

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Post()
  async create(@Req() req: any, @Body() dto: CreateCustomerDto) {
    return this.customersService.create(req.tenantId, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Patch(':id')
  async update(
    @Req() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateCustomerDto,
  ) {
    return this.customersService.update(req.tenantId, id, dto);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get(':id')
  async findOne(@Req() req: any, @Param('id') id: string) {
    return this.customersService.findOne(req.tenantId, id);
  }

  @Roles(Role.OWNER, Role.MANAGER, Role.CASHIER)
  @Get(':id/usual-order')
  async getUsualOrder(@Req() req: any, @Param('id') id: string) {
    return this.customersService.getUsualOrder(req.tenantId, id);
  }
}
