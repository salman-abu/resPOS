"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const prisma_service_1 = require("../prisma/prisma.service");
const audit_service_1 = require("../audit/audit.service");
const bcrypt = __importStar(require("bcrypt"));
const ioredis_1 = __importDefault(require("ioredis"));
const ioredis_mock_1 = __importDefault(require("ioredis-mock"));
let AuthService = class AuthService {
    prisma;
    jwtService;
    auditService;
    redis;
    constructor(prisma, jwtService, auditService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
        this.auditService = auditService;
        if (process.env.MOCK_REDIS === 'true') {
            this.redis = new ioredis_mock_1.default();
        }
        else {
            this.redis = new ioredis_1.default(process.env.REDIS_URL || 'redis://localhost:6379');
        }
    }
    async getTerminalInfo(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId, is_active: true },
        });
        if (!tenant)
            throw new common_1.UnauthorizedException('Invalid or suspended terminal');
        const staff = await this.prisma.user.findMany({
            where: { tenant_id: tenantId, is_active: true },
            select: { id: true, name: true, role: true },
        });
        return {
            tenantName: tenant.name,
            staff,
        };
    }
    async loginWithPin(tenantId, userId, pin, mode = 'LIVE') {
        const user = await this.prisma.user.findFirst({
            where: { id: userId, tenant_id: tenantId, is_active: true },
        });
        if (!user) {
            throw new common_1.UnauthorizedException('Invalid user credentials');
        }
        const isPinValid = await bcrypt.compare(pin, user.pin_hash);
        if (!isPinValid) {
            throw new common_1.UnauthorizedException('Invalid PIN');
        }
        const payload = {
            sub: user.id,
            tenantId: user.tenant_id,
            role: user.role,
            mode,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                tenant_id: user.tenant_id,
                mode,
            },
        };
    }
    async loginOwner(email, pin, mode = 'LIVE') {
        const user = await this.prisma.user.findFirst({
            where: { email, is_active: true },
        });
        if (!user || user.role !== 'OWNER') {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isPinValid = await bcrypt.compare(pin, user.pin_hash);
        if (!isPinValid) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = {
            sub: user.id,
            tenantId: user.tenant_id,
            role: user.role,
            mode,
        };
        return {
            access_token: this.jwtService.sign(payload),
            user: {
                id: user.id,
                name: user.name,
                role: user.role,
                tenant_id: user.tenant_id,
                mode,
            },
        };
    }
    async verifyManagerPin(tenantId, managerId, pin) {
        const user = await this.prisma.user.findFirst({
            where: { id: managerId, tenant_id: tenantId, is_active: true },
        });
        if (!user) {
            await this.auditService
                .log({
                tenantId,
                action: 'SCREEN_UNLOCKED',
                entityType: 'USER',
                entityId: managerId,
                performedBy: managerId,
                reason: 'Manager not found during PIN verification',
            })
                .catch(() => { });
            throw new common_1.UnauthorizedException('Manager not found');
        }
        if (user.role !== 'MANAGER' && user.role !== 'OWNER') {
            await this.auditService
                .log({
                tenantId,
                action: 'SCREEN_UNLOCKED',
                entityType: 'USER',
                entityId: managerId,
                performedBy: managerId,
                reason: `Unauthorized role ${user.role} attempted PIN verification`,
            })
                .catch(() => { });
            throw new common_1.UnauthorizedException('Only MANAGER or OWNER can authorize');
        }
        const isPinValid = await bcrypt.compare(pin, user.pin_hash);
        if (!isPinValid) {
            await this.auditService
                .log({
                tenantId,
                action: 'SCREEN_UNLOCKED',
                entityType: 'USER',
                entityId: managerId,
                performedBy: managerId,
                reason: 'Invalid manager PIN',
            })
                .catch(() => { });
            throw new common_1.UnauthorizedException('Invalid manager PIN');
        }
        const jti = crypto.randomUUID();
        const payload = {
            sub: user.id,
            tenantId: user.tenant_id,
            role: user.role,
            purpose: 'manager_pin_auth',
            jti,
        };
        const token = this.jwtService.sign(payload, { expiresIn: '2m' });
        await this.redis.setex(`manager_auth:${jti}`, 120, 'true');
        await this.auditService
            .log({
            tenantId,
            action: 'SCREEN_UNLOCKED',
            entityType: 'USER',
            entityId: managerId,
            performedBy: managerId,
            reason: 'Manager PIN verified successfully',
            newValue: { role: user.role, expires_in: 120 },
        })
            .catch(() => { });
        return {
            authorization_token: token,
            manager_name: user.name,
            expires_in: 120,
        };
    }
    async validateManagerAuthToken(token) {
        try {
            const payload = this.jwtService.verify(token);
            if (payload.purpose !== 'manager_pin_auth')
                return false;
            const key = `manager_auth:${payload.jti}`;
            const exists = await this.redis.get(key);
            if (!exists)
                return false;
            await this.redis.del(key);
            return true;
        }
        catch {
            return false;
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService,
        audit_service_1.AuditService])
], AuthService);
//# sourceMappingURL=auth.service.js.map