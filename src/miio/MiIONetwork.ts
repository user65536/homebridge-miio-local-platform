import dgram from 'dgram';
import { DeviceBaseInfo } from './DeviceInfo';
import { MiIOPacket as MiIOPacket } from './MiIOPacket';
import { EventEmitter } from '../utils/EventEmitter';
import { BuiltinLogger } from '../utils';

export type MiIONetworkEvents = {
  packet: (packet: MiIOPacket, remoteAddress: string) => void;
};

export class MiIONetwork extends EventEmitter<MiIONetworkEvents> {
  readonly port = 54321;

  socket: dgram.Socket;

  logger = new BuiltinLogger('network');

  constructor() {
    super();
    this.socket = dgram.createSocket('udp4');
    this.bindEvent();
  }

  private bindEvent() {
    this.socket.addListener('listening', () => {
      this.socket.setBroadcast(true);
    });
    this.socket.on('message', (msg, rInfo) => {
      this.handleMessage(msg, rInfo.address);
    });
  }

  private handleMessage(buffer: Buffer, address: string) {
    const packet = MiIOPacket.from(buffer);
    if (!packet) {
      return;
    }
    this.logger.debug(`<- ${address}`, buffer);
    this.emit('packet', packet, address);
  }

  private send(address: string, buffer: Uint8Array) {
    this.logger.debug(`-> ${address}`, buffer);
    return new Promise((resolve, reject) => {
      this.socket.send(buffer, this.port, address, (err) => {
        if (err) {
          reject(err);
        } else {
          resolve('');
        }
      });
    });
  }

  sendToDevice(deviceInfo: DeviceBaseInfo, payload: string) {
    const miIOPackage = new MiIOPacket({ ...deviceInfo, payload });
    return this.send(deviceInfo.address, miIOPackage.toBuffer());
  }

  hello(address: string) {
    const msg = Buffer.from('21310020ffffffffffffffffffffffffffffffffffffffffffffffffffffffff', 'hex');
    this.send(address, msg);
  }
}
