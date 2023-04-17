import { Device } from './Device';
import { DeviceBaseInfo } from './DeviceInfo';
import { MiIONetwork } from './MiIONetwork';
import { MiIOPacket } from './MiIOPacket';
import { EventEmitter } from '../utils/EventEmitter';
import { BuiltinLogger } from '../utils';
import { retry } from '../utils/retry';

export interface DeviceConfig extends Pick<DeviceBaseInfo, 'deviceId' | 'token'> {
  name: string;
  enable?: boolean;
}

export interface MiIOManagerConfig {
  devices: DeviceConfig[];
}

export type PlatformEvents = {
  device: (device: Device) => void;
};

export class MiIOManager extends EventEmitter<PlatformEvents> {
  devices: Device[] = [];

  network = new MiIONetwork();

  logger = new BuiltinLogger('manager');

  deviceConfigs: DeviceConfig[] = [];

  constructor(config: MiIOManagerConfig) {
    super();
    this.deviceConfigs = config.devices;
    this.bindEvent();
  }

  private bindEvent() {
    this.network.on('packet', this.handlePacket.bind(this));
  }

  private getConfigByDeviceId(id: number) {
    const config = this.deviceConfigs.find((i) => i.deviceId === id);
    return config;
  }

  private createDeviceByPacket(packet: MiIOPacket, address: string) {
    const { deviceId, deviceUpTime } = packet;
    this.logger.info('discoverd device id: ', deviceId);
    const config = this.getConfigByDeviceId(deviceId);
    if (!config) {
      this.logger.info(`no config found for device ${deviceId}, ignored`);
      return;
    }
    const device = new Device({
      deviceInfo: { deviceId, deviceUpTime, address, token: config.token },
      network: this.network,
      name: config.name,
    });
    return device;
  }

  private async handleNewDevice(device?: Device) {
    if (!device) {
      return;
    }
    this.devices.push(device);
    await device.updateDetailInfo();
    this.emit('device', device);
  }

  private handlePacket(packet: MiIOPacket, address: string) {
    const device = this.findDeviceById(packet.deviceId);
    if (!device) {
      const device = this.createDeviceByPacket(packet, address);
      this.handleNewDevice(device);
    } else {
      device.updateAddress(address);
      device.handlePacket(packet);
    }
  }

  private findUnreadyDevices() {
    return this.deviceConfigs.filter((i) => !this.findDeviceById(i.deviceId));
  }

  private _discover = () => {
    return new Promise((resolve, reject) => {
      this.network.hello('255.255.255.255');
      setTimeout(() => {
        const unreadyDevices = this.findUnreadyDevices();
        if (unreadyDevices.length === 0) {
          resolve('');
        } else {
          const devicesString = unreadyDevices.map((i) => i.name).join(' ');
          reject(new Error(`${unreadyDevices.length} device(s) not fount: ${devicesString}`));
        }
      }, 3000);
    });
  };

  findDeviceById(id: number) {
    const device = this.devices.find((i) => i.id === id);
    return device;
  }

  discover() {
    const discover = retry(this._discover, 10);
    discover().catch((e) => this.logger.error(e));
  }
}
