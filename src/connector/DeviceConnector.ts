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

  protected setupInformation(manufacturer: string) {
    this.accessory
      .getService(this.Service.AccessoryInformation)!
      .setCharacteristic(this.Characteristic.Manufacturer, manufacturer)
      .setCharacteristic(this.Characteristic.Model, this.device.model)
      .setCharacteristic(this.Characteristic.SerialNumber, String(this.device.id))
      .setCharacteristic(this.Characteristic.FirmwareRevision, String(this.device.detailInfo?.fw_ver || 'unknown'));
  }
}

export interface DeviceConnectorConstructor {
  model: string;
  new (device: Device, accessory: PlatformAccessory, platform: MiIOLocalPlatform): DeviceConnector;
}
