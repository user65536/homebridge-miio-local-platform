import { DeviceBaseInfo, DeviceDetailInfo } from './DeviceInfo';
import { MiIONetwork } from './MiIONetwork';
import { MiIOPacket } from './MiIOPacket';
import { Logger } from 'homebridge';

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
  logger?: Logger;
}

export class Device {
  name: string;
  baseInfo: DeviceBaseInfo;
  detailInfo?: DeviceDetailInfo;
  logger?: Logger;
  private network: MiIONetwork;
  private _requestId = 0;
  private requestPromises = new Map<number, RequestPromise>();

  get requestId() {
    this._requestId += 1;
    return this._requestId;
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
    this.logger = options.logger;
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
      this.logger?.debug(`device ${this.name} ->`, payload);
      this.network.sendToDevice(this.baseInfo, payload);
      this.requestPromises.set(id, { resolve: resolve as (value: unknown) => void, reject });
      this.setRequestTimeout(id, 3000);
    });
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
      this.logger?.debug(`device ${this.name} <-`, payload);
      if (!payload) {
        return;
      }
      const data = JSON.parse(payload) as ResponsePayload;
      const promise = this.requestPromises.get(data.id);
      promise?.resolve(data);
      this.requestPromises.delete(data.id);
    } catch (error) {
      this.logger?.error('handle packet error', error);
    }
  }
}
