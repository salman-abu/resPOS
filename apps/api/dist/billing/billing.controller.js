"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.BillingController = void 0;
const common_1 = require("@nestjs/common");
const billing_service_1 = require("./billing.service");
const billing_dto_1 = require("./dto/billing.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let BillingController = class BillingController {
    billingService;
    constructor(billingService) {
        this.billingService = billingService;
    }
    generateInvoice(req, dto) {
        return this.billingService.generateInvoice(req.tenantId, dto);
    }
    getInvoice(req, id) {
        return this.billingService.getInvoice(req.tenantId, id);
    }
    settleInvoice(req, id, dto) {
        return this.billingService.settleInvoice(req.tenantId, id, dto);
    }
    openShift(req, dto) {
        return this.billingService.openShift(req.tenantId, req.user.sub, dto);
    }
    closeShift(req, dto) {
        return this.billingService.closeShift(req.tenantId, dto);
    }
    getZReport(req) {
        return this.billingService.getZReport(req.tenantId);
    }
    getTables(req) {
        return this.billingService.getTables(req.tenantId);
    }
};
exports.BillingController = BillingController;
__decorate([
    (0, common_1.Post)('invoice'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, billing_dto_1.GenerateInvoiceDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "generateInvoice", null);
__decorate([
    (0, common_1.Get)('invoice/:id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getInvoice", null);
__decorate([
    (0, common_1.Post)('invoice/:id/settle'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, billing_dto_1.SettleInvoiceDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "settleInvoice", null);
__decorate([
    (0, common_1.Post)('shift/open'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, billing_dto_1.OpenShiftDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "openShift", null);
__decorate([
    (0, common_1.Post)('shift/close'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, billing_dto_1.CloseShiftDto]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "closeShift", null);
__decorate([
    (0, common_1.Get)('shift/z-report'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getZReport", null);
__decorate([
    (0, common_1.Get)('tables'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BillingController.prototype, "getTables", null);
exports.BillingController = BillingController = __decorate([
    (0, common_1.Controller)('billing'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [billing_service_1.BillingService])
], BillingController);
//# sourceMappingURL=billing.controller.js.map