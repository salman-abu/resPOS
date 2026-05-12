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
exports.MenuController = void 0;
const common_1 = require("@nestjs/common");
const menu_service_1 = require("./menu.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let MenuController = class MenuController {
    menuService;
    constructor(menuService) {
        this.menuService = menuService;
    }
    getCategories(req) {
        const tenantId = req.tenantId;
        return this.menuService.getCategories(tenantId);
    }
    getItems(req, categoryId) {
        const tenantId = req.tenantId;
        return this.menuService.getItems(tenantId, categoryId);
    }
    toggleAvailability(req, id, is_available) {
        const tenantId = req.tenantId;
        return this.menuService.toggleAvailability(tenantId, id, is_available);
    }
};
exports.MenuController = MenuController;
__decorate([
    (0, common_1.Get)('categories'),
    __param(0, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "getCategories", null);
__decorate([
    (0, common_1.Get)('items'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('categoryId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "getItems", null);
__decorate([
    (0, common_1.Patch)('items/:id/availability'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)('is_available')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Boolean]),
    __metadata("design:returntype", void 0)
], MenuController.prototype, "toggleAvailability", null);
exports.MenuController = MenuController = __decorate([
    (0, common_1.Controller)('menu'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [menu_service_1.MenuService])
], MenuController);
//# sourceMappingURL=menu.controller.js.map