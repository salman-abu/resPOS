"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AggregatorsModule = void 0;
const common_1 = require("@nestjs/common");
const aggregators_service_1 = require("./aggregators.service");
const aggregators_controller_1 = require("./aggregators.controller");
const prisma_module_1 = require("../prisma/prisma.module");
const orders_module_1 = require("../orders/orders.module");
let AggregatorsModule = class AggregatorsModule {
};
exports.AggregatorsModule = AggregatorsModule;
exports.AggregatorsModule = AggregatorsModule = __decorate([
    (0, common_1.Module)({
        imports: [prisma_module_1.PrismaModule, orders_module_1.OrdersModule],
        controllers: [aggregators_controller_1.AggregatorsController],
        providers: [aggregators_service_1.AggregatorsService],
    })
], AggregatorsModule);
//# sourceMappingURL=aggregators.module.js.map