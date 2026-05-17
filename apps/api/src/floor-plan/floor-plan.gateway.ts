import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export const FLOOR_ROOM = (tenantId: string) => `floor:${tenantId}`;

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'floor',
})
export class FloorPlanGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('subscribe_tenant')
  handleSubscribeTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    if (data.tenantId) {
      client.join(FLOOR_ROOM(data.tenantId));
    }
  }

  emitTableStatusChanged(tenantId: string, table: object) {
    this.server.to(FLOOR_ROOM(tenantId)).emit('table:status-changed', table);
  }
}
