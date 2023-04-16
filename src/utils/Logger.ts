import debug, { Debugger } from 'debug';

export type LogFn = (message: string, ...params: any[]) => void;

export interface Logger {
  info: LogFn;
  warn: LogFn;
  debug: LogFn;
  error: LogFn;
}

export class BuiltinLogger implements Logger {
  scope: string;

  debugLog: Debugger;

  static composedLogger: Logger[] = [];

  constructor(scope = '') {
    this.scope = scope;
    this.debugLog = debug(scope);
  }

  static compose(...logger: Logger[]) {
    this.composedLogger.push(...logger);
  }

  log(level: keyof Logger, message: string, ...params: any[]) {
    this.debugLog(`(${level}) ${message}`, ...params);
    BuiltinLogger.composedLogger.forEach((i) => i[level](`[${this.scope}] ${message}`, ...params));
  }

  private createLogWithLevel =
    (level: keyof Logger) =>
    (message: string, ...params: any[]) =>
      this.log(level, message, ...params);

  info = this.createLogWithLevel('info');

  warn = this.createLogWithLevel('warn');

  error = this.createLogWithLevel('error');

  debug = this.createLogWithLevel('debug');
}
