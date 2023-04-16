import { YeeLightController, YeeLightPropValue } from '../../miio/controllers';
import { DeviceConnector } from '../DeviceConnector';
import { CharacteristicValue, Nullable } from 'homebridge';
import { Unit } from '../../utils';

export class YeeLinkLightLamp15Connector extends DeviceConnector {
  static model = 'yeelink.light.lamp15';

  controller = new YeeLightController(this.device);

  setupInformation() {
    this.accessory
      .getService(this.Service.AccessoryInformation)!
      .setCharacteristic(this.Characteristic.Manufacturer, 'Yeelight Technology')
      .setCharacteristic(this.Characteristic.Model, this.device.model)
      .setCharacteristic(this.Characteristic.SerialNumber, String(this.device.id))
      .setCharacteristic(this.Characteristic.FirmwareRevision, String(this.device.detailInfo?.fw_ver || 'unknown'));
  }

  setupLightService() {
    const serviceName = 'light';
    const service = this.accessory.getService(serviceName) || this.accessory.addService(this.Service.Lightbulb, serviceName, 'Light');
    service
      .getCharacteristic(this.Characteristic.On)
      .onSet((value) => this.controller.setLightPower(value ? 'on' : 'off'))
      .onGet(this.createPropGetter('power', (p) => p === 'on'));

    service
      .getCharacteristic(this.Characteristic.Brightness)
      .onSet((value) => this.controller.setLightBright(value as number))
      .onGet(this.createPropGetter('bright'));

    service
      .getCharacteristic(this.Characteristic.ColorTemperature)
      .onSet((v) => this.controller.setLightColorTemperature(this.homeKitCtToYeeLight(v as number)))
      .onGet(this.createPropGetter('ct', (v) => this.YeeLightCtToHomeKit(parseInt(v as string))));
  }

  setupBgService() {
    const serviceName = 'background';
    const service = this.accessory.getService(serviceName) || this.accessory.addService(this.Service.Lightbulb, serviceName, 'BG');
    service
      .getCharacteristic(this.Characteristic.On)
      .onSet((value) => this.controller.setBgPower(value ? 'on' : 'off'))
      .onGet(this.createPropGetter('bg_power', (p) => p === 'on'));

    service
      .getCharacteristic(this.Characteristic.Brightness)
      .onSet((value) => this.controller.setBgBright(value as number))
      .onGet(this.createPropGetter('bg_bright'));

    service
      .getCharacteristic(this.Characteristic.Hue)
      .onGet(() => this.controller.getBgHue())
      .onSet((v) => this.controller.setBgHue(v as number));
    service
      .getCharacteristic(this.Characteristic.Saturation)
      .onGet(() => this.controller.getBgSaturation())
      .onSet((v) => this.controller.setBgSaturation(v as number));
  }

  connect(): void {
    this.setupInformation();
    this.setupLightService();
    this.setupBgService();
    // this.device.send('bg_start_cf', [0, 0, '10000,1,16711701,-1,10000,1,2300,-1,10000,1,65280,-1']).then((v) => console.log(v));
  }

  createPropGetter = (prop: string, transformer?: (prop: YeeLightPropValue) => Nullable<CharacteristicValue>) => () => {
    return this.controller.getProp(prop).then(transformer);
  };

  handleSetBright = (value: CharacteristicValue) => {
    this.controller.setLightBright(value as number);
  };

  homeKitCtToYeeLight(ct: number) {
    const kelvin = Unit.kelvinAndMired(ct);
    return Math.round(((kelvin - 7142) * (2700 - 6500)) / (2000 - 7142) + 6500);
  }

  YeeLightCtToHomeKit(ct: number) {
    const kelvin = Math.round(((ct - 6500) * (2000 - 7142)) / (2700 - 6500) + 7142);
    return Unit.kelvinAndMired(kelvin);
  }
}
