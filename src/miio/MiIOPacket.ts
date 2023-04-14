import { DeviceBaseInfo } from './DeviceInfo';
import crypto from 'crypto';

export interface MiIOPackageOptions extends Pick<DeviceBaseInfo, 'deviceId' | 'deviceUpTime'> {
  payload?: string;
  encryptedPayload?: Buffer;
  checksum?: Buffer;
  token?: string;
}

export class MiIOPacket {
  private payload?: string;
  private encryptedPayload?: Buffer;
  private token?: Buffer;
  private tokenKey?: Buffer;
  private tokenIV?: Buffer;
  private checksum?: Buffer;
  deviceId: number;
  deviceUpTime: number;

  get length() {
    if (!this.encryptedPayload) {
      return 32;
    }
    return this.encryptedPayload.length + 32;
  }

  get header() {
    const header = Buffer.alloc(16);
    header.writeUInt16BE(0x2131);
    header.writeUInt16BE(this.length, 2);
    header.writeInt32BE(0, 4);
    header.writeUInt32BE(this.deviceId, 8);
    header.writeUInt32BE(this.getCurrentStamp(), 12);
    return header;
  }

  constructor(options: MiIOPackageOptions) {
    this.deviceId = options.deviceId;
    this.deviceUpTime = options.deviceUpTime;
    this.payload = options.payload;
    this.encryptedPayload = options.encryptedPayload;
    this.checksum = options.checksum;
    if (options.token) {
      this.updateToken(options.token);
    }
  }

  private static bufferToInt(buffer: Buffer) {
    return parseInt(buffer.toString('hex'), 16);
  }

  static valid(buffer: Buffer) {
    if (buffer.slice(0, 2).toString('hex') !== '2131') {
      return false;
    }
    return true;
  }

  static from(buffer: Buffer) {
    if (!this.valid(buffer)) {
      return null;
    }
    const length = this.bufferToInt(buffer.slice(2, 4));
    const deviceId = this.bufferToInt(buffer.slice(8, 12));
    const stamp = this.bufferToInt(buffer.slice(12, 16));
    const deviceUpTime = Math.floor(Date.now() / 1000 - stamp);
    const checksum = buffer.slice(16, 32);
    const encryptedPayload = buffer.slice(32, length);
    return new MiIOPacket({ deviceId, deviceUpTime, checksum, encryptedPayload });
  }

  private encryptPayload(payload: string) {
    if (!this.tokenIV || !this.tokenKey) {
      throw new Error('missing device token during encryption');
    }
    const cipher = crypto.createCipheriv('aes-128-cbc', this.tokenKey, this.tokenIV);
    const encrypted = Buffer.concat([cipher.update(payload), cipher.final()]);
    return encrypted;
  }

  private getCurrentStamp() {
    return Math.floor(Date.now() / 1000 - this.deviceUpTime);
  }

  private calcChecksum() {
    if (!this.token) {
      throw new Error('missing token');
    }
    if (!this.encryptedPayload) {
      throw new Error('missing body');
    }
    return crypto.createHash('md5').update(this.header).update(this.token).update(this.encryptedPayload).digest();
  }

  decryptByToken(token: string) {
    if (this.payload) {
      return this.payload;
    }
    this.updateToken(token);
    if (!this.encryptedPayload || !this.validChecksum()) {
      return null;
    }
    const decipher = crypto.createDecipheriv('aes-128-cbc', this.tokenKey!, this.tokenIV!);
    const data = Buffer.concat([decipher.update(this.encryptedPayload), decipher.final()]);
    const payload = data.toString('utf-8');
    this.payload = payload;
    return payload;
  }

  isHelloReply() {
    return this.length === 32;
  }

  updateToken(token: string) {
    this.token = Buffer.from(token, 'hex');
    this.tokenKey = crypto.createHash('md5').update(this.token).digest();
    this.tokenIV = crypto.createHash('md5').update(this.tokenKey).update(this.token).digest();
    return this;
  }

  validChecksum() {
    if (!this.checksum) {
      return false;
    }
    if (this.isHelloReply()) {
      return true;
    }
    return this.calcChecksum().compare(this.checksum) === 0;
  }

  toBuffer() {
    if (!this.payload) {
      throw new Error('missing payload');
    }
    const body = this.encryptPayload(this.payload);
    this.encryptedPayload = body;
    const checksum = this.calcChecksum();
    const buffer = Buffer.concat([this.header, checksum, body]);
    return buffer;
  }
}
