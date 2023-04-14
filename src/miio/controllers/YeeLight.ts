import { Unit } from '../../utils/Unit';
import { Device } from '../Device';

export type YeeLightPropValue = string | number;

interface PropResponse {
  result: Array<YeeLightPropValue>;
}

type LightState = string | number | Array<string | number>;

export class YeeLightController {
  hue = 0;

  saturation = 0;

  constructor(private device: Device) {}

  async getProp(prop: string) {
    const res = await this.device.send<PropResponse>('get_prop', [prop]);
    return res.result?.[0];
  }

  private async setLight(key: string, state: LightState) {
    const propState = Array.isArray(state) ? state : [state];
    try {
      return await this.device.send(key, [...propState, 'smooth', 500]);
    } catch (e: any) {
      this.device.logger?.error(e);
    }
  }

  private createLightHandler =
    <S extends LightState>(key: string) =>
    (state: S) => {
      this.setLight(key, state);
    };

  setLightPower = this.createLightHandler<'on' | 'off'>('set_power');

  setBgPower = this.createLightHandler<'on' | 'off'>('bg_set_power');

  setLightBright = this.createLightHandler<number>('set_bright');

  setBgBright = this.createLightHandler<number>('bg_set_bright');

  setLightColorTemperature = this.createLightHandler<number>('set_ct_abx');

  setBgRgb = this.createLightHandler<number>('bg_set_rgb');

  private sendCurrentBgColor() {
    const rgb = Unit.HSBToRGB(this.hue, this.saturation, 100);
    const rgbNumber = Unit.RGBToInt(...rgb);
    this.setBgRgb(rgbNumber);
  }

  async getBgRgb() {
    const rgbString = await this.getProp('bg_rgb');
    const rgb = parseInt(rgbString as string);
    return rgb;
  }

  async getBgHue() {
    const rgb = await this.getBgRgb();
    const [hue] = Unit.RGBToHSB(...Unit.IntToRGB(rgb));
    this.hue = hue;
    return hue;
  }

  async getBgSaturation() {
    const rgb = await this.getBgRgb();
    const [, saturation] = Unit.RGBToHSB(...Unit.IntToRGB(rgb));
    this.saturation = saturation;
    return saturation;
  }

  async setBgHue(hue: number) {
    this.hue = hue;
    return this.sendCurrentBgColor();
  }

  async setBgSaturation(sat: number) {
    this.saturation = sat;
    return this.sendCurrentBgColor();
  }
}
