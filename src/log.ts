export enum LogLevel {
  Error,
  Warn,
  Info,
  Debug,
}

export class Log {
  static level = LogLevel.Info;

  static debug(message?: unknown, ...optionalParams: unknown[]) {
    if (Log.level >= LogLevel.Debug) {
      console.debug(message, ...optionalParams);
    }
  }

  static info(message?: unknown, ...optionalParams: unknown[]) {
    if (Log.level >= LogLevel.Info) {
      console.info(message, ...optionalParams);
    }
  }

  static warn(message?: unknown, ...optionalParams: unknown[]) {
    if (Log.level >= LogLevel.Warn) {
      console.warn(message, ...optionalParams);
    }
  }

  static error(message?: unknown, ...optionalParams: unknown[]) {
    if (Log.level >= LogLevel.Error) {
      console.error(message, ...optionalParams);
    }
  }

  static setLevel(level: LogLevel) {
    Log.level = level;
  }
}
