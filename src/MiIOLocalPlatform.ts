import { API, DynamicPlatformPlugin, Logger, PlatformAccessory, PlatformConfig, Service, Characteristic } from 'homebridge';

import { PLATFORM_NAME, PLUGIN_NAME } from './settings';
import { DeviceConfig, MiIOManager } from './miio/MiIOManager';
import { MiIOPlatformConfig } from './PlatformConfig';
import { Device } from './miio/Device';
import { ConnectorFactory } from './connector/ConnectorFactory';
import { BuiltinLogger } from './utils';

export interface AccessoryContext {
  deviceId: number;
}

export type MiIOAccessory = PlatformAccessory<AccessoryContext>;

/**
 * HomebridgePlatform
 * This class is the main constructor for your plugin, this is where you should
 * parse the user config and discover/register accessories with Homebridge.
 */
export class MiIOLocalPlatform implements DynamicPlatformPlugin {
  public readonly Service: typeof Service = this.api.hap.Service;
  public readonly Characteristic: typeof Characteristic = this.api.hap.Characteristic;

  public readonly miIOManager: MiIOManager;

  // this is used to track restored cached accessories
  public accessories: MiIOAccessory[] = [];

  private deviceConfigs: DeviceConfig[] = [];

  constructor(public readonly log: Logger, public readonly config: PlatformConfig, public readonly api: API) {
    BuiltinLogger.compose(log);
    this.deviceConfigs = (config as MiIOPlatformConfig).devices.filter((i) => i.enable);
    this.miIOManager = new MiIOManager({ devices: this.deviceConfigs });
    this.log.debug('Finished initializing platform:', this.config.name);
    // When this event is fired it means Homebridge has restored all cached accessories from disk.
    // Dynamic Platform plugins should only register new accessories after this event was fired,
    // in order to ensure they weren't added to homebridge already. This event can also be used
    // to start discovery of new accessories.
    this.api.on('didFinishLaunching', () => {
      this.log.debug('Executed didFinishLaunching callback');
      this.clearUnConfiguredAccessories();
      // run the method to discover / register your devices as accessories
      this.miIOManager.discover();
      this.miIOManager.on('device', this.handleDevice);
    });
  }

  findDeviceConfig(id: number) {
    return this.deviceConfigs.find((i) => i.deviceId === id);
  }

  /**
   * This function is invoked when homebridge restores cached accessories from disk at startup.
   * It should be used to setup event handlers for characteristics and update respective values.
   */
  configureAccessory(accessory: MiIOAccessory) {
    this.log.info('Loading accessory from cache:', accessory.displayName);

    // add the restored accessory to the accessories cache so we can track if it has already been registered
    this.accessories.push(accessory);
  }

  removeAccessory(accessory: MiIOAccessory) {
    this.log.info(`Accessory ${accessory.displayName} removed`);
    this.accessories = this.accessories.filter((i) => i.UUID !== accessory.UUID);
    this.api.unregisterPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
  }

  clearUnConfiguredAccessories() {
    this.accessories.forEach((i) => {
      if (!this.findDeviceConfig(i.context.deviceId)) {
        this.removeAccessory(i);
      }
    });
  }

  getAccessory(id: number, name = 'new accessory') {
    const uuid = this.api.hap.uuid.generate(id.toString());
    const existingAccessory = this.accessories.find((accessory) => accessory.UUID === uuid);
    if (existingAccessory) {
      this.log.info('Restoring existing accessory from cache:', existingAccessory.displayName);
      return existingAccessory;
    }
    const accessory = new this.api.platformAccessory<AccessoryContext>(name, uuid);
    accessory.context.deviceId = id;
    this.log.info('Adding new accessory:', name);
    this.api.registerPlatformAccessories(PLUGIN_NAME, PLATFORM_NAME, [accessory]);
    return accessory;
  }

  /**
   * This is an example method showing how to register discovered accessories.
   * Accessories must only be registered once, previously created accessories
   * must not be registered again to prevent "duplicate UUID" errors.
   */
  handleDevice = (device: Device) => {
    const Connector = ConnectorFactory.find(device.model);
    if (!Connector) {
      this.log.warn(`Can not find device connector for model ${device.model}, maybe this device is unsupported`);
      return;
    }
    const accessory = this.getAccessory(device.id, device.name);
    new Connector(device, accessory, this).connect();
    this.accessories.push(accessory);
  };
}
