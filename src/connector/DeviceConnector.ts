import { PlatformAccessory } from 'homebridge';
import { Device } from '../miio/Device';
import { MiIOLocalPlatform } from '../MiIOLocalPlatform';

export abstract class DeviceConnector {
  protected get Service() {
    return this.platform.Service;
  }

  protected get Characteristic() {
    return this.platform.Characteristic;
  }

  constructor(protected device: Device, protected accessory: PlatformAccessory, protected platform: MiIOLocalPlatform) {}

  abstract connect(): void;
}

export interface DeviceConnectorConstructor {
  model: string;
  new (device: Device, accessory: PlatformAccessory, platform: MiIOLocalPlatform): DeviceConnector;
}
