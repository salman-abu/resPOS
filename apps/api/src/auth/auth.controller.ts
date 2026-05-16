import { Controller, Post, Body, Get, Query, UseGuards, Req } from '@nestjs/common';
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

  // ─── WebAuthn / Passkey (Phase 4.1) ──────────────────────────────────────────

  @UseGuards(JwtAuthGuard)
  @Get('passkey/register-options')
  async registerOptions(@Req() req: any) {
    return this.authService.generateRegistrationOptions(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Post('passkey/verify-registration')
  async verifyRegistration(@Req() req: any, @Body() body: any) {
    return this.authService.verifyRegistration(req.user.sub, body);
  }

  @Post('passkey/login-options')
  async loginOptions(@Body() body: { tenantId: string; userId: string }) {
    return this.authService.generateAuthenticationOptions(
      body.tenantId,
      body.userId,
    );
  }

  @Post('passkey/login-verify')
  async loginVerify(
    @Body() body: { tenantId: string; userId: string; response: any },
  ) {
    return this.authService.verifyAuthentication(
      body.tenantId,
      body.userId,
      body.response,
    );
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
