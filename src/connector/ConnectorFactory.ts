import { DeviceConnectorConstructor } from './DeviceConnector';
import { CucoPlugV3Connector, ViomiVacuumV7Connector, YeeLinkLightLamp15Connector } from './models';

export class ConnectorFactory {
  private static connectors: DeviceConnectorConstructor[] = [];

  static register(connector: DeviceConnectorConstructor) {
    this.connectors.push(connector);
  }

  static find(model: string) {
    return this.connectors.find((i) => i.model === model);
  }
}

ConnectorFactory.register(YeeLinkLightLamp15Connector);
ConnectorFactory.register(ViomiVacuumV7Connector);
ConnectorFactory.register(CucoPlugV3Connector);
