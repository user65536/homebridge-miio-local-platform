import { DeviceConnectorConstructor } from './DeviceConnector';
import * as Models from './models';

export class ConnectorFactory {
  private static connectors: DeviceConnectorConstructor[] = [];

  static register(connector: DeviceConnectorConstructor) {
    this.connectors.push(connector);
  }

  static find(model: string) {
    return this.connectors.find((i) => {
      if (typeof i.model === 'string') {
        return i.model === model;
      } else {
        return i.model.includes(model);
      }
    });
  }
}

Object.values(Models).forEach((Model) => ConnectorFactory.register(Model));
