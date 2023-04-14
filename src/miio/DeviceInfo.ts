export interface DeviceBaseInfo {
  deviceId: number;
  token: string;
  address: string;
  deviceUpTime: number;
}

export interface DeviceDetailInfo {
  model: string;
  fw_ver: string;
}
