import { PlatformConfig } from 'homebridge';
import { DeviceConfig } from './miio/MiIOManager';

export interface MiIOPlatformConfig extends PlatformConfig {
  devices: DeviceConfig[];
}
