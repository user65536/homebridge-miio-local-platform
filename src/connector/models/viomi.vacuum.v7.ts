import { VacuumController } from '../../miio/controllers';
import { Unit } from '../../utils';
import { DeviceConnector } from '../DeviceConnector';

export class ViomiVacuumV7Connector extends DeviceConnector {
  static model = 'viomi.vacuum.v7';

  controller = new VacuumController(this.device);

  setupFanService() {
    const service = this.accessory.getService(this.Service.Fanv2) || this.accessory.addService(this.Service.Fanv2);
    service
      .getCharacteristic(this.Characteristic.Active)
      .onGet(() => this.controller.getActiveState())
      .onSet((v) => this.controller.setActiveState(v === this.Characteristic.Active.ACTIVE));
    service.setCharacteristic(this.Characteristic.Name, 'Vacuum');

    service
      .getCharacteristic(this.Characteristic.RotationSpeed)
      .onGet(() => this.getSuctionPercent())
      .onSet((v) => {
        const step = this.setSuctionPercent(v as number);
        service.updateCharacteristic(this.Characteristic.RotationSpeed, Unit.stepToPercent(step, 4));
      });

    service
      .getCharacteristic(this.Characteristic.SwingMode)
      .onGet(() => this.controller.chargeAfterStop)
      .onSet((v) => {
        this.controller.setChargeAfterStop(v as boolean);
      });
  }

  setupBatteryService() {
    const service = this.accessory.getService(this.Service.Battery) || this.accessory.addService(this.Service.Battery);
    service.setCharacteristic(this.Characteristic.Name, 'Battery');
    service.getCharacteristic(this.Characteristic.BatteryLevel).onGet(() => this.device.getProp('battary_life'));
    service.getCharacteristic(this.Characteristic.ChargingState).onGet(async () => {
      const charging = await this.controller.isCharing();
      const chargingState = charging ? this.Characteristic.ChargingState.CHARGING : this.Characteristic.ChargingState.NOT_CHARGING;
      return chargingState;
    });
  }

  async getSuctionPercent() {
    const grade = await this.device.getProp('suction_grade');
    const step = parseInt(grade as string) + 1;
    return Unit.stepToPercent(step, 4);
  }

  setSuctionPercent(value: number) {
    const step = Unit.percentToStep(value as number, 4);
    this.controller.setSuctionStep(step);
    return step;
  }

  connect() {
    this.setupInformation('Lumi United Technology Co., Ltd.');
    this.setupBatteryService();
    this.setupFanService();
  }
}
