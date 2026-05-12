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
var KdsGateway_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.KdsGateway = void 0;
exports.kdsRoom = kdsRoom;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const common_1 = require("@nestjs/common");
function kdsRoom(tenantId, station) {
    return `kds:${tenantId}:${station}`;
}
let KdsGateway = KdsGateway_1 = class KdsGateway {
    server;
    logger = new common_1.Logger(KdsGateway_1.name);
    handleConnection(client) {
        this.logger.log(`KDS client connected: ${client.id}`);
    }
    handleDisconnect(client) {
        this.logger.log(`KDS client disconnected: ${client.id}`);
    }
    handleSubscribe(client, payload) {
        const { tenantId, station } = payload;
        client.join(kdsRoom(tenantId, station));
        client.join(kdsRoom(tenantId, 'ALL'));
        this.logger.log(`Client ${client.id} subscribed to ${station} for tenant ${tenantId}`);
        return { status: 'subscribed', room: kdsRoom(tenantId, station) };
    }
    emitNewKot(tenantId, station, kot) {
        this.server.to(kdsRoom(tenantId, station)).emit('kot:new', kot);
        this.server.to(kdsRoom(tenantId, 'ALL')).emit('kot:new', kot);
    }
    emitItemDone(tenantId, station, payload) {
        this.server.to(kdsRoom(tenantId, station)).emit('kot:item_done', payload);
        this.server.to(kdsRoom(tenantId, 'ALL')).emit('kot:item_done', payload);
    }
    emitKotBumped(tenantId, station, kotId) {
        this.server.to(kdsRoom(tenantId, station)).emit('kot:bumped', { kot_id: kotId });
        this.server.to(kdsRoom(tenantId, 'ALL')).emit('kot:bumped', { kot_id: kotId });
    }
    emitKotStatus(tenantId, station, payload) {
        this.server.to(kdsRoom(tenantId, station)).emit('kot:status', payload);
        this.server.to(kdsRoom(tenantId, 'ALL')).emit('kot:status', payload);
    }
};
exports.KdsGateway = KdsGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], KdsGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_station'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], KdsGateway.prototype, "handleSubscribe", null);
exports.KdsGateway = KdsGateway = KdsGateway_1 = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: {
            origin: ['http://localhost:3000', 'http://localhost:3001'],
            credentials: true,
        },
        namespace: 'kds',
    })
], KdsGateway);
//# sourceMappingURL=kds.gateway.js.map