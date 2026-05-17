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
import { Logger, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

// ─── Room helper ──────────────────────────────────────────────────────────────
// Each KDS screen subscribes to a room: `kds:{tenantId}:{station}` or `kds:{tenantId}:ALL`
export function kdsRoom(tenantId: string, station: string): string {
  return `kds:${tenantId}:${station}`;
}

export function floorRoom(tenantId: string): string {
  return `floor:${tenantId}`;
}

export function cfdRoom(tenantId: string): string {
  return `cfd:${tenantId}`;
}

export function orderRoom(tenantId: string, orderId: string): string {
  return `order:${tenantId}:${orderId}`;
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

  constructor(private jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token;
      if (!token) throw new UnauthorizedException('No token');
      const payload = await this.jwtService.verifyAsync(token);
      client.data.user = payload;
      this.logger.log(
        `KDS client connected: ${client.id} (Tenant: ${payload.tenantId})`,
      );
    } catch (error) {
      this.logger.warn(`Unauthenticated connection attempt: ${client.id}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`KDS client disconnected: ${client.id}`);
  }

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

  // ── Client subscribes to the floor plan room ──────────────────────────────
  @SubscribeMessage('subscribe_floor')
  handleSubscribeFloor(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string },
  ) {
    const { tenantId } = payload;
    client.join(floorRoom(tenantId));
    this.logger.log(
      `Client ${client.id} subscribed to floor for tenant ${tenantId}`,
    );
    return { status: 'subscribed', room: floorRoom(tenantId) };
  }

  @SubscribeMessage('subscribe_cfd')
  handleSubscribeCfd(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: { tenantId: string },
  ) {
    const { tenantId } = payload;
    client.join(cfdRoom(tenantId));
    this.logger.log(
      `Client ${client.id} subscribed to CFD for tenant ${tenantId}`,
    );
    return { status: 'subscribed', room: cfdRoom(tenantId) };
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

  emitTableStatusChanged(
    tenantId: string,
    payload: { id: string; status: string },
  ) {
    this.server.to(floorRoom(tenantId)).emit('table:status-changed', payload);
  }

  // ── Emit Order Update (for CFD) ──────────────────────────────────────────
  emitOrderUpdate(
    tenantId: string,
    payload: {
      id: string;
      status: string;
      token?: number | null;
      name?: string | null;
    },
  ) {
    this.server.to(cfdRoom(tenantId)).emit('order:update', payload);
  }

  // ── Emit canonical order state (for CRDT sync) ────────────────────────────
  emitOrderState(tenantId: string, orderId: string, state: any) {
    this.server.to(orderRoom(tenantId, orderId)).emit('order:state', state);
  }
}
