import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
export declare function kdsRoom(tenantId: string, station: string): string;
export declare class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
    server: Server;
    private readonly logger;
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribe(client: Socket, payload: {
        tenantId: string;
        station: string;
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
}
