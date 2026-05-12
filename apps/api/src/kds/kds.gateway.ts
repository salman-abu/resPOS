import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger } from '@nestjs/common';

// ─── Room helper ──────────────────────────────────────────────────────────────
// Each KDS screen subscribes to a room: `kds:{tenantId}:{station}` or `kds:{tenantId}:ALL`
export function kdsRoom(tenantId: string, station: string): string {
  return `kds:${tenantId}:${station}`;
}

@WebSocketGateway({
  cors: {
    origin: ['http://localhost:3000', 'http://localhost:3001'],
    credentials: true,
  },
  namespace: 'kds',
})
export class KdsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private readonly logger = new Logger(KdsGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`KDS client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`KDS client disconnected: ${client.id}`);
  }

  // ── Client subscribes to a station room ──────────────────────────────────
  @SubscribeMessage('subscribe_station')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string; station: string },
  ) {
    const { tenantId, station } = payload;
    // Join the specific station room AND the ALL room
    client.join(kdsRoom(tenantId, station));
    client.join(kdsRoom(tenantId, 'ALL'));
    this.logger.log(
      `Client ${client.id} subscribed to ${station} for tenant ${tenantId}`,
    );
    return { status: 'subscribed', room: kdsRoom(tenantId, station) };
  }

  // ── Emit new KOT to the relevant station ─────────────────────────────────
  emitNewKot(tenantId: string, station: string, kot: any) {
    this.server.to(kdsRoom(tenantId, station)).emit('kot:new', kot);
    this.server.to(kdsRoom(tenantId, 'ALL')).emit('kot:new', kot);
  }

  // ── Emit item marked done ─────────────────────────────────────────────────
  emitItemDone(
    tenantId: string,
    station: string,
    payload: { kot_id: string; item_id: string; done: boolean },
  ) {
    this.server.to(kdsRoom(tenantId, station)).emit('kot:item_done', payload);
    this.server.to(kdsRoom(tenantId, 'ALL')).emit('kot:item_done', payload);
  }

  // ── Emit KOT bumped (served) ──────────────────────────────────────────────
  emitKotBumped(tenantId: string, station: string, kotId: string) {
    this.server
      .to(kdsRoom(tenantId, station))
      .emit('kot:bumped', { kot_id: kotId });
    this.server
      .to(kdsRoom(tenantId, 'ALL'))
      .emit('kot:bumped', { kot_id: kotId });
  }

  // ── Emit KOT status change ────────────────────────────────────────────────
  emitKotStatus(
    tenantId: string,
    station: string,
    payload: { kot_id: string; status: string },
  ) {
    this.server.to(kdsRoom(tenantId, station)).emit('kot:status', payload);
    this.server.to(kdsRoom(tenantId, 'ALL')).emit('kot:status', payload);
  }
}
