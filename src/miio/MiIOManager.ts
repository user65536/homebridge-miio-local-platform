import { Device } from './Device';
import { DeviceBaseInfo } from './DeviceInfo';
import { MiIONetwork } from './MiIONetwork';
import { MiIOPacket } from './MiIOPacket';
import { EventEmitter } from '../utils/EventEmitter';
import { BuiltinLogger } from '../utils';

export interface DeviceConfig extends Pick<DeviceBaseInfo, 'deviceId' | 'token'> {
  name: string;
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

  constructor(private config: MiIOManagerConfig) {
    super();
    this.bindEvent();
  }

  private bindEvent() {
    this.network.on('packet', this.handlePacket.bind(this));
  }

  private getConfigByDeviceId(id: number) {
    const config = this.config.devices.find((i) => i.deviceId === id);
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

  findDeviceById(id: number) {
    const device = this.devices.find((i) => i.id === id);
    return device;
  }

  discover() {
    this.network.hello('255.255.255.255');
  }
}
