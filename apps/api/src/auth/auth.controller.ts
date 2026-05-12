import { Controller, Post, Body } from '@nestjs/common';
import { AuthService } from './auth.service';

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
}
