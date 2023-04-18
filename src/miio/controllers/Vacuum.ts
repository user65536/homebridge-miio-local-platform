import { withCache } from '../../utils/withCache';
import { Device } from '../Device';

export enum WorkType {
  sleep = '1',
  pause = '2',
  sweeping = '3',
  goCharging = '4',
  charging = '5',
  mopping = '6',
  sweepingAndMopping = '7',
}

export class VacuumController {
  chargeAfterStop = false;

  constructor(private device: Device) {}

  safeSend(method: string, params: any[]) {
    this.device.send(method, params).catch((e) => {
      this.device.logger.error(`Failed to send ${method} with params %O\nError: `, params, e);
    });
  }

  getProps = withCache(async () => {
    const props = ['run_state', 'suction_grade', 'battary_life'];
    const res = await this.device.getProp(props);
    if (!res) {
      return null;
    }
    return props.reduce((t, c, index) => {
      t[c] = res[index];
      return t;
    }, {} as Record<string, string | number>);
  }, 500);

  async backCharge() {
    return this.safeSend('set_charge', [1]);
  }

  async start() {
    return this.safeSend('set_mode_withroom', [0, 1, 0]);
  }

  pause() {
    this.safeSend('set_mode_withroom', [0, 2, 0]);
    if (this.chargeAfterStop) {
      this.backCharge();
    }
  }

  sleep() {
    this.safeSend('set_mode_withroom', [0, 0, 0]);
  }

  setSuctionStep(step: number) {
    this.safeSend('set_suction', [step]);
  }

  async getMode() {
    const props = await this.getProps();
    if (!props) {
      return null;
    }
    return props.run_state;
  }

  async getActiveState() {
    const mode = await this.getMode();
    if (!mode) {
      return null;
    }
    const active = [WorkType.mopping, WorkType.sweeping, WorkType.sweepingAndMopping].includes(String(mode) as WorkType);
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
    const mode = await this.getMode();
    if (!mode) {
      return null;
    }
    return String(mode) === WorkType.charging;
  }

  async setChargeAfterStop(value: boolean) {
    const isCharing = await this.isCharing();
    this.chargeAfterStop = value;
    const active = await this.getActiveState();
    if (this.chargeAfterStop && !active && !isCharing) {
      this.backCharge();
    }
  }
}
