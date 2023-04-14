export class Unit {
  static kelvinAndMired(v: number) {
    return Math.floor(1e6 / v);
  }

  static HSBToRGB = (h: number, s: number, b: number) => {
    s /= 100;
    b /= 100;
    const k = (n) => (n + h / 60) % 6;
    const f = (n) => b * (1 - s * Math.max(0, Math.min(k(n), 4 - k(n), 1)));
    return [255 * f(5), 255 * f(3), 255 * f(1)].map(Math.round) as [number, number, number];
  };

  static RGBToHSB = (r: number, g: number, b: number) => {
    r /= 255;
    g /= 255;
    b /= 255;
    const v = Math.max(r, g, b),
      n = v - Math.min(r, g, b);
    const h = n === 0 ? 0 : n && v === r ? (g - b) / n : v === g ? 2 + (b - r) / n : 4 + (r - g) / n;
    return [60 * (h < 0 ? h + 6 : h), v && (n / v) * 100, v * 100].map(Math.round) as [number, number, number];
  };

  static RGBToInt(r: number, g: number, b: number) {
    return (r << 16) + (g << 8) + b;
  }

  static IntToRGB(int: number): [number, number, number] {
    const r = int >> 16;
    const g = (int & 0xff00) >> 8;
    const b = int & 0xff;
    return [r, g, b];
  }
}
