import {
  SubscribeMessage,
  WebSocketGateway,
  OnGatewayInit,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as Y from 'yjs';
import { YjsDoc } from '../models/mongo/yjs-doc.schema';
import { Logger } from '@nestjs/common';

const docs = new Map<string, Y.Doc>();

@WebSocketGateway({ cors: true })
export class YSocketIoGateway implements OnGatewayInit {
  private readonly logger = new Logger(YSocketIoGateway.name);
  @WebSocketServer()
  server: Server;

  afterInit(server: Server) {
    // Optionally log or set up persistence
    this.logger.log('y-socket-io initialized');
  }

  @SubscribeMessage('sync')
  async handleSync(
    client: Socket,
    { room, update }: { room: string; update: Uint8Array },
  ) {
    let ydoc = docs.get(room);
    if (!ydoc) {
      ydoc = new Y.Doc();
      // Load from MongoDB
      const docFromDb = await YjsDoc.findOne({ room });
      if (docFromDb) {
        Y.applyUpdate(ydoc, new Uint8Array(docFromDb.state.buffer));
      }
      docs.set(room, ydoc);

      // Persist on update
      ydoc.on('update', async () => {
        const state = Y.encodeStateAsUpdate(ydoc!);
        await YjsDoc.findOneAndUpdate({ room }, { state }, { upsert: true });
      });
    }
    Y.applyUpdate(ydoc, update);
    // Broadcast to others
    client.to(room).emit('sync', { update });
  }

  @SubscribeMessage('join')
  async handleJoin(client: Socket, room: string) {
    client.join(room);
    let ydoc = docs.get(room);
    if (!ydoc) {
      ydoc = new Y.Doc();
      // Load from MongoDB
      const docFromDb = await YjsDoc.findOne({ room });
      if (docFromDb) {
        Y.applyUpdate(ydoc, new Uint8Array(docFromDb.state.buffer));
      }
      docs.set(room, ydoc);

      // Persist on update
      ydoc.on('update', async () => {
        const state = Y.encodeStateAsUpdate(ydoc!);
        await YjsDoc.findOneAndUpdate({ room }, { state }, { upsert: true });
      });
    }
    // Send current state
    client.emit('sync', { update: Y.encodeStateAsUpdate(ydoc) });
  }
}
