import { DeviceBaseInfo, DeviceDetailInfo } from './DeviceInfo';
import { MiIONetwork } from './MiIONetwork';
import { MiIOPacket } from './MiIOPacket';
import { BuiltinLogger, Logger } from '../utils';

export interface RequestPayload<T> {
  id: number;
  method: string;
  params: T;
}

export interface ResponsePayload<R = string[]> {
  id: number;
  result: R;
}

interface RequestPromise {
  resolve: (payload: unknown) => void;
  reject: (error?: unknown) => void;
}

export interface DeviceOptions {
  deviceInfo: DeviceBaseInfo;
  network: MiIONetwork;
  name: string;
}

export class Device {
  name: string;
  baseInfo: DeviceBaseInfo;
  detailInfo?: DeviceDetailInfo;
  logger: Logger = new BuiltinLogger('device');
  private network: MiIONetwork;
  private requestPromises = new Map<number, RequestPromise>();

  get requestId() {
    return Math.round(Math.random() * 100000);
  }

  get id() {
    return this.baseInfo.deviceId;
  }

  get model() {
    return this.detailInfo?.model ?? 'unknown';
  }

  get token() {
    return this.baseInfo.token;
  }

  constructor(options: DeviceOptions) {
    this.name = options.name;
    this.baseInfo = options.deviceInfo;
    this.network = options.network;
  }

  private setRequestTimeout(id: number, time: number) {
    setTimeout(() => {
      const promise = this.requestPromises.get(id);
      if (!promise) {
        return;
      }
      promise.reject(new Error('timeout'));
      this.network.hello(this.baseInfo.address);
      this.requestPromises.delete(id);
    }, time);
  }

  private handleHelloPacket(packet: MiIOPacket) {
    this.baseInfo.deviceUpTime = packet.deviceUpTime;
  }

  isRequestOK(payload: ResponsePayload) {
    if (typeof payload?.result?.[0] !== 'string') {
      return true;
    }
    return payload.result[0] === 'ok';
  }

  async updateDetailInfo() {
    const res = await this.send<DeviceDetailInfo>('miIO.info', []);
    this.detailInfo = res.result;
  }

  send<R, P extends unknown[] = unknown[]>(method: string, params: P) {
    return new Promise<ResponsePayload<R>>((resolve, reject) => {
      const id = this.requestId;
      const payload = JSON.stringify({ id, method, params });
      this.logger?.debug(`${this.name} ->`, payload);
      this.network.sendToDevice(this.baseInfo, payload);
      this.requestPromises.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.setRequestTimeout(id, 3000);
    });
  }

  async getProp(prop: string): Promise<string | number>;
  async getProp(prop: string[]): Promise<Array<string | number>>;
  async getProp(prop: string | string[]) {
    const isArrayProps = Array.isArray(prop);
    const propArray = isArrayProps ? prop : [prop];
    const res = await this.send<{ result: Array<string | number> }>('get_prop', propArray);
    return isArrayProps ? res.result : res.result[0];
  }

  updateAddress(address: string) {
    this.baseInfo.address = address;
  }

  handlePacket(packet: MiIOPacket) {
    if (packet.isHelloReply()) {
      this.handleHelloPacket(packet);
      return;
    }
    try {
      this.baseInfo.deviceUpTime = packet.deviceUpTime;
      const payload = packet.decryptByToken(this.token);
      this.logger?.debug(`${this.name} <-`, payload);
      if (!payload) {
        return;
      }
      // eslint-disable-next-line no-control-regex
      const data = JSON.parse(payload.replace(/[\x00-\x09\x0B-\x0C\x0E-\x1F\x7F-\x9F]/g, '')) as ResponsePayload;
      const promise = this.requestPromises.get(data.id);
      promise?.resolve(data);
      this.requestPromises.delete(data.id);
    } catch (error) {
      this.logger?.error('handle packet error', error);
    }
  }
}
