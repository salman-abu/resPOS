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
Object.defineProperty(exports, "__esModule", { value: true });
exports.SuperAdminService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
let SuperAdminService = class SuperAdminService {
    prisma;
    jwtService;
    constructor(prisma, jwtService) {
        this.prisma = prisma;
        this.jwtService = jwtService;
    }
    async login(email, passwordString) {
        const admin = await this.prisma.superAdmin.findUnique({
            where: { email },
        });
        if (!admin || !admin.is_active) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const isMatch = await bcrypt.compare(passwordString, admin.password);
        if (!isMatch) {
            throw new common_1.UnauthorizedException('Invalid credentials');
        }
        const payload = {
            sub: admin.id,
            email: admin.email,
            is_super_admin: true,
            level: admin.level,
        };
        return {
            access_token: this.jwtService.sign(payload),
            admin: { name: admin.name, email: admin.email, level: admin.level },
        };
    }
    async getDashboardStats() {
        const totalTenants = await this.prisma.tenant.count();
        const activeTenants = await this.prisma.tenant.count({
            where: { is_active: true },
        });
        const totalOrders = await this.prisma.order.count();
        const invoices = await this.prisma.invoice.findMany({
            select: { total: true },
        });
        const totalGmv = invoices.reduce((acc, curr) => acc + curr.total, 0);
        return {
            totalTenants,
            activeTenants,
            totalOrders,
            totalGmv,
        };
    }
    async getAllTenants() {
        return this.prisma.tenant.findMany({
            include: {
                _count: {
                    select: { outlets: true, users: true, orders: true },
                },
            },
            orderBy: { created_at: 'desc' },
        });
    }
    async toggleTenantStatus(id, is_active) {
        return this.prisma.tenant.update({
            where: { id },
            data: { is_active },
        });
    }
    async impersonateTenant(tenantId) {
        const tenant = await this.prisma.tenant.findUnique({
            where: { id: tenantId },
        });
        if (!tenant) {
            throw new common_1.NotFoundException('Tenant not found');
        }
        const payload = {
            sub: `impersonate_${tenantId}`,
            tenant_id: tenantId,
            role: 'OWNER',
            is_impersonated: true,
        };
        return {
            access_token: this.jwtService.sign(payload),
            tenant_name: tenant.name,
        };
    }
};
exports.SuperAdminService = SuperAdminService;
exports.SuperAdminService = SuperAdminService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], SuperAdminService);
//# sourceMappingURL=superadmin.service.js.map