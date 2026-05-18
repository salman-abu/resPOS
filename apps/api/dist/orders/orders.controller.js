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
exports.VoidJobController = exports.OrdersController = void 0;
const common_1 = require("@nestjs/common");
const orders_service_1 = require("./orders.service");
const order_dto_1 = require("./dto/order.dto");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const roles_guard_1 = require("../auth/guards/roles.guard");
const roles_decorator_1 = require("../auth/decorators/roles.decorator");
const client_1 = require("@prisma/client");
let OrdersController = class OrdersController {
    ordersService;
    constructor(ordersService) {
        this.ordersService = ordersService;
    }
    async getCfdOrders(req) {
        return this.ordersService.getCfdOrders(req.tenantId);
    }
    async createOrder(req, dto) {
        try {
            return await this.ordersService.createOrder(req.tenantId, req.user.sub, dto, req.trainingSessionId);
        }
        catch (e) {
            throw new common_1.HttpException(e.message || String(e), 400);
        }
    }
    getActiveOrders(req, tableId) {
        if (tableId) {
            return this.ordersService.getActiveOrderByTable(req.tenantId, tableId, req.trainingSessionId);
        }
        return this.ordersService.getActiveOrders(req.tenantId, req.trainingSessionId);
    }
    getOpenTabs(req) {
        return this.ordersService.getOpenTabs(req.tenantId);
    }
    getOrder(req, id) {
        return this.ordersService.getOrder(req.tenantId, id);
    }
    getLastRound(req, id) {
        return this.ordersService.getLastRound(req.tenantId, id);
    }
    addItems(req, id, dto) {
        return this.ordersService.addItems(req.tenantId, id, dto);
    }
    async fireKot(req, id, body) {
        try {
            return await this.ordersService.fireKot(req.tenantId, id, req.user.sub, body.item_ids);
        }
        catch (e) {
            throw new common_1.HttpException(e.message || String(e), 400);
        }
    }
    voidOrder(req, id, reason) {
        return this.ordersService.voidOrder(req.tenantId, id, reason, req.user.sub);
    }
    holdItems(req, id, itemIds) {
        return this.ordersService.holdItems(req.tenantId, id, itemIds);
    }
    fireHeldItems(req, id, courseNumber) {
        return this.ordersService.fireHeldItems(req.tenantId, id, req.user.sub, courseNumber);
    }
    openTab(req, id, tabName) {
        return this.ordersService.openTab(req.tenantId, id, tabName);
    }
    attachCustomer(req, id, customerId) {
        return this.ordersService.attachCustomer(req.tenantId, id, customerId);
    }
    transferOrder(req, id, newTableId) {
        return this.ordersService.transferOrder(req.tenantId, id, newTableId);
    }
    voidItem(req, id, itemId) {
        return this.ordersService.voidItem(req.tenantId, id, itemId, req.user.sub);
    }
    async loadTemplate(req, body) {
        return this.ordersService.loadTemplate(req.tenantId, body.history_id);
    }
};
exports.OrdersController = OrdersController;
__decorate([
    (0, roles_decorator_1.Roles)(client_1.Role.OWNER, client_1.Role.MANAGER, client_1.Role.CASHIER),
    (0, common_1.Get)('cfd'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "getCfdOrders", null);
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, order_dto_1.CreateOrderDto]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "createOrder", null);
__decorate([
    (0, common_1.Get)('active'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('table_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getActiveOrders", null);
__decorate([
    (0, common_1.Get)('tabs'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOpenTabs", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getOrder", null);
__decorate([
    (0, common_1.Get)(':id/last-round'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "getLastRound", null);
__decorate([
    (0, common_1.Post)(':id/items'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, order_dto_1.AddItemsToOrderDto]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "addItems", null);
__decorate([
    (0, common_1.Post)(':id/kot'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "fireKot", null);
__decorate([
    (0, common_1.Patch)(':id/void'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('reason')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "voidOrder", null);
__decorate([
    (0, common_1.Patch)(':id/items/hold'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('item_ids')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Array]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "holdItems", null);
__decorate([
    (0, common_1.Patch)(':id/items/fire-held'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('course_number')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Number]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "fireHeldItems", null);
__decorate([
    (0, common_1.Post)(':id/open-tab'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('tab_name')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "openTab", null);
__decorate([
    (0, common_1.Patch)(':id/customer'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('customer_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "attachCustomer", null);
__decorate([
    (0, common_1.Patch)(':id/transfer'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('new_table_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "transferOrder", null);
__decorate([
    (0, common_1.Post)(':id/void-item'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('item_id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String]),
    __metadata("design:returntype", void 0)
], OrdersController.prototype, "voidItem", null);
__decorate([
    (0, common_1.Post)('load-template'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], OrdersController.prototype, "loadTemplate", null);
exports.OrdersController = OrdersController = __decorate([
    (0, common_1.Controller)('orders'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard, roles_guard_1.RolesGuard),
    __metadata("design:paramtypes", [orders_service_1.OrdersService])
], OrdersController);
let VoidJobController = class VoidJobController {
    cancelVoidJob(id) {
        return { cancelled: true };
    }
};
exports.VoidJobController = VoidJobController;
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], VoidJobController.prototype, "cancelVoidJob", null);
exports.VoidJobController = VoidJobController = __decorate([
    (0, common_1.Controller)('void-job'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard)
], VoidJobController);
//# sourceMappingURL=orders.controller.js.map