import { DeviceConnector } from '../DeviceConnector';

export class CucoPlugV3Connector extends DeviceConnector {
  static model = 'cuco.plug.v3';

  setupSwitchService() {
    const service = this.accessory.getService(this.Service.Switch) || this.accessory.addService(this.Service.Switch);
    service
      .getCharacteristic(this.Characteristic.On)
      .onGet(async () => {
        const res = await this.device.send('get_properties', [{ diid: this.device.id, siid: 2, piid: 1 }]);
        return res?.result?.[0]?.value ?? null;
      })
      .onSet((value) => {
        this.device.send('set_properties', [{ diid: this.device.id, siid: 2, piid: 1, value }]);
      });
  }

  connect() {
    this.setupInformation('Lumi United Technology Co., Ltd.');
    this.setupSwitchService();
  }
}
