import { ExtractJwt, Strategy } from 'passport-jwt';
import { PassportStrategy } from '@nestjs/passport';
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET ||
        (() => {
          throw new Error('JWT_SECRET environment variable is required');
        })(),
    });
  }

  async validate(payload: any) {
    // Super admin tokens bypass user table lookup
    if (payload.is_super_admin) {
      return {
        sub: payload.sub,
        email: payload.email,
        is_super_admin: true,
        level: payload.level,
      };
    }

    const user = await this.prisma.user.findUnique({
      where: { id: payload.sub },
      include: { tenant: true },
    });

    if (!user || !user.is_active) {
      throw new UnauthorizedException();
    }

    // Check if tenant is active
    if (!user.tenant.is_active) {
      throw new UnauthorizedException('Tenant account is suspended');
    }

    return {
      sub: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      mode: payload.mode || 'LIVE',
      user,
    };
  }
}
