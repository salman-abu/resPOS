import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
export declare function kdsRoom(tenantId: string, station: string): string;
export declare function floorRoom(tenantId: string): string;
export declare function cfdRoom(tenantId: string): string;
export declare function orderRoom(tenantId: string, orderId: string): string;
export declare class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private jwtService;
    server: Server;
    private readonly logger;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): Promise<void>;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, payload: {
        tenantId: string;
        station: string;
    }): {
        status: string;
        room: string;
    };
    handleSubscribeFloor(client: Socket, payload: {
        tenantId: string;
    }): {
        status: string;
        room: string;
    };
    handleSubscribeCfd(client: Socket, payload: {
        tenantId: string;
    }): {
        status: string;
        room: string;
    };
    emitNewKot(tenantId: string, station: string, kot: any): void;
    emitItemDone(tenantId: string, station: string, payload: {
        kot_id: string;
        item_id: string;
        done: boolean;
    }): void;
    emitKotBumped(tenantId: string, station: string, kotId: string): void;
    emitKotStatus(tenantId: string, station: string, payload: {
        kot_id: string;
        status: string;
    }): void;
    emitTableStatusChanged(tenantId: string, payload: {
        id: string;
        status: string;
    }): void;
    emitOrderUpdate(tenantId: string, payload: {
        id: string;
        status: string;
        token?: number | null;
        name?: string | null;
    }): void;
    emitOrderState(tenantId: string, orderId: string, state: any): void;
}
