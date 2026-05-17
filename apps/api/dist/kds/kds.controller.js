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
exports.KdsController = void 0;
const common_1 = require("@nestjs/common");
const kds_service_1 = require("./kds.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
let KdsController = class KdsController {
    kdsService;
    constructor(kdsService) {
        this.kdsService = kdsService;
    }
    getActiveKots(req, station) {
        return this.kdsService.getActiveKots(req.tenantId, station);
    }
    markItemDone(req, kotId, itemId, done) {
        return this.kdsService.markItemDone(req.tenantId, kotId, itemId, done);
    }
    bumpKot(req, kotId) {
        return this.kdsService.bumpKot(req.tenantId, kotId);
    }
    recallKot(req, kotId) {
        return this.kdsService.recallKot(req.tenantId, req.user.sub, kotId);
    }
};
exports.KdsController = KdsController;
__decorate([
    (0, common_1.Get)('kots'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)('station')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "getActiveKots", null);
__decorate([
    (0, common_1.Patch)('kot/:kotId/item/:itemId'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('kotId')),
    __param(2, (0, common_1.Param)('itemId')),
    __param(3, (0, common_1.Body)('done')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, Boolean]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "markItemDone", null);
__decorate([
    (0, common_1.Patch)('kot/:kotId/bump'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('kotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "bumpKot", null);
__decorate([
    (0, common_1.Patch)('kot/:kotId/recall'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Param)('kotId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String]),
    __metadata("design:returntype", void 0)
], KdsController.prototype, "recallKot", null);
exports.KdsController = KdsController = __decorate([
    (0, common_1.Controller)('kds'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __metadata("design:paramtypes", [kds_service_1.KdsService])
], KdsController);
//# sourceMappingURL=kds.controller.js.map