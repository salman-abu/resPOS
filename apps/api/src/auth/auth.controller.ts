import {
  Controller,
  Post,
  Body,
  Get,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('staff/login')
  async loginStaff(
    @Body() body: { tenantId: string; userId: string; pin: string },
  ) {
    return this.authService.loginWithPin(body.tenantId, body.userId, body.pin);
  }

  @Post('owner/login')
  async loginOwner(@Body() body: { email: string; pin: string }) {
    return this.authService.loginOwner(body.email, body.pin);
  }

  @UseGuards(JwtAuthGuard)
  @Get('terminal-info')
  async getTerminalInfo(@Query('tenantId') tenantId: string) {
    if (!tenantId) return { error: 'Missing tenantId' };
    return this.authService.getTerminalInfo(tenantId);
  }

  @Post('verify-manager-pin')
  async verifyManagerPin(
    @Body() body: { tenantId: string; managerId: string; pin: string },
  ) {
    return this.authService.verifyManagerPin(
      body.tenantId,
      body.managerId,
      body.pin,
    );
  }
}
