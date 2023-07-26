import { DeviceConnector } from '../DeviceConnector';

export class LumiACPartnerConnector extends DeviceConnector {
  static model = 'lumi.acpartner.mcn02';

  setupHeaterCoolerService() {
    const service = this.accessory.getService(this.Service.HeaterCooler) || this.accessory.addService(this.Service.HeaterCooler);
    service.setCharacteristic(this.Characteristic.Name, 'HeaterCooler');
    service
      .getCharacteristic(this.Characteristic.Active)
      .onGet(this.createPropGetter('power', (v) => v === 'on'))
      .onSet(async (v) => {
        const current = (await this.device.getProp('power')) === 'on';
        if (current !== v) {
          this.device.send('set_power', [v ? 'on' : 'off']);
        }
      });

    service
      .getCharacteristic(this.Characteristic.CurrentHeaterCoolerState)
      .setProps({
        validValues: [this.Characteristic.CurrentHeaterCoolerState.HEATING, this.Characteristic.CurrentHeaterCoolerState.COOLING],
      })
      .onGet(this.createPropGetter('mode', (v) => this.modeToState(v as string)));

    service
      .getCharacteristic(this.Characteristic.TargetHeaterCoolerState)
      .setProps({
        validValues: [this.Characteristic.TargetHeaterCoolerState.COOL, this.Characteristic.TargetHeaterCoolerState.HEAT],
      })
      .onSet((v) => this.setMode(v as number));

    service
      .getCharacteristic(this.Characteristic.CurrentTemperature)
      .onGet(this.createPropGetter('tar_temp'))
      .onSet((v) => this.device.send('set_tar_temp', [v]));

    service
      .getCharacteristic(this.Characteristic.SwingMode)
      .onGet(this.createPropGetter('ver_swing', (v) => v === 'on'))
      .onSet((v) => this.device.send('set_ver_swing', [v ? 'on' : 'off']));
    service
      .getCharacteristic(this.Characteristic.CoolingThresholdTemperature)
      .onGet(this.createPropGetter('tar_temp'))
      .onSet((v) => this.setTargetTemperature(v as number));

    service
      .getCharacteristic(this.Characteristic.CoolingThresholdTemperature)
      .setProps({ maxValue: 30, minStep: 1, minValue: 20 })
      .onGet(this.createPropGetter('tar_temp'))
      .onSet((v) => this.setTargetTemperature(v as number));

    service
      .getCharacteristic(this.Characteristic.HeatingThresholdTemperature)
      .setProps({ maxValue: 30, minStep: 1, minValue: 20 })
      .onGet(this.createPropGetter('tar_temp'))
      .onSet((v) => this.setTargetTemperature(v as number));
  }

  async setTargetTemperature(value: number) {
    this.device.send('set_tar_temp', [value]);
  }

  async getCurrentCoolingState() {
    const power = await this.device.getProp('power');
    if (power === 'off') {
      return this.Characteristic.CurrentHeatingCoolingState.OFF;
    }
    const mode = await this.device.getProp('mode');
    return mode === 'cool' ? this.Characteristic.CurrentHeatingCoolingState.COOL : this.Characteristic.CurrentHeatingCoolingState.HEAT;
  }

  modeToState(mode: string) {
    return (
      {
        heat: this.Characteristic.CurrentHeaterCoolerState.HEATING,
        cool: this.Characteristic.CurrentHeaterCoolerState.COOLING,
      }[mode] || this.Characteristic.CurrentHeaterCoolerState.IDLE
    );
  }

  setMode(state: number) {
    const targetMode =
      {
        [this.Characteristic.TargetHeaterCoolerState.HEAT]: 'heat',
        [this.Characteristic.TargetHeaterCoolerState.COOL]: 'cool',
      }[state] || 'cool';
    this.device.send('set_mode', [targetMode]);
  }

  connect() {
    this.setupInformation('Lumi United Technology Co., Ltd.');
    this.setupHeaterCoolerService();
  }
}
