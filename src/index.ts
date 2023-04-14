import { API } from 'homebridge';

import { PLATFORM_NAME } from './settings';
import { MiIOLocalPlatform } from './MiIOLocalPlatform';

/**
 * This method registers the platform with Homebridge
 */
export = (api: API) => {
  api.registerPlatform(PLATFORM_NAME, MiIOLocalPlatform);
};
