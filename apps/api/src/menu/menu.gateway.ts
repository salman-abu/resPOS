import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export const MENU_ROOM = (tenantId: string) => `menu:${tenantId}`;

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'menu',
})
export class MenuGateway {
  @WebSocketServer() server: Server;

  @SubscribeMessage('subscribe_tenant')
  handleSubscribeTenant(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId: string },
  ) {
    if (data.tenantId) {
      client.join(MENU_ROOM(data.tenantId));
    }
  }

  emitMenuUpdated(tenantId: string) {
    this.server
      .to(MENU_ROOM(tenantId))
      .emit('menu:updated', { timestamp: Date.now() });
  }
}
