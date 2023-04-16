import { Device } from '../Device';

export enum WorkType {
  sleep = 1,
  pause = 2,
  sweeping = 3,
  goCharging = 4,
  charging = 5,
  mopping = 6,
  sweepingAndMopping = 7,
}

export class VacuumController {
  chargeAfterStop = false;

  constructor(private device: Device) {}

  async backCharge() {
    return this.device.send('set_charge', [1]);
  }

  async start() {
    return this.device.send('set_mode_withroom', [0, 1, 0]);
  }

  pause() {
    this.device.send('set_mode_withroom', [0, 2, 0]);
    if (this.chargeAfterStop) {
      this.backCharge();
    }
  }

  sleep() {
    this.device.send('set_mode_withroom', [0, 0, 0]);
  }

  setSuctionStep(step: number) {
    this.device.send('set_suction', [step]);
  }

  async getActiveState() {
    const mode = await this.device.getProp('run_state');
    const active = [WorkType.mopping, WorkType.sweeping, WorkType.sweepingAndMopping].includes(parseInt(mode as string));
    return active;
  }

  async setActiveState(active: boolean) {
    if (active) {
      this.start();
    } else {
      this.pause();
    }
  }

  async isCharing() {
    const mode = await this.device.getProp('run_state');
    return parseInt(mode as string) === WorkType.charging;
  }

  async setChargeAfterStop(value: boolean) {
    this.chargeAfterStop = value;
    const active = await this.getActiveState();
    if (this.chargeAfterStop && !active) {
      this.backCharge();
    }
  }
}
