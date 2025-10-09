import { Injectable } from '@angular/core';

export enum LogLevel {
  Debug = 0,
  Info = 1,
  Warn = 2,
  Error = 3,
  None = 4,
}

@Injectable({
  providedIn: 'root',
})
export class LoggerService {
  private logLevel: LogLevel = LogLevel.Debug;
  private prefix = '[App]';

  constructor() {
    // Set log level based on environment
    // You can configure this based on your needs
    if (typeof window !== 'undefined') {
      // Check if running in browser (not SSR)
      const isProduction = false; // Change based on your environment config
      this.logLevel = isProduction ? LogLevel.Warn : LogLevel.Debug;
    }
  }

  /**
   * Set the minimum log level
   */
  setLogLevel(level: LogLevel): void {
    this.logLevel = level;
  }

  /**
   * Set a custom prefix for all log messages
   */
  setPrefix(prefix: string): void {
    this.prefix = prefix;
  }

  /**
   * Log debug messages
   */
  debug(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Debug) {
      console.debug(`${this.prefix} [DEBUG]`, message, ...args);
    }
  }

  /**
   * Log info messages
   */
  info(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Info) {
      console.info(`${this.prefix} [INFO]`, message, ...args);
    }
  }

  /**
   * Log warning messages
   */
  warn(message: string, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Warn) {
      console.warn(`${this.prefix} [WARN]`, message, ...args);
    }
  }

  /**
   * Log error messages
   */
  error(message: string, error?: Error | any, ...args: any[]): void {
    if (this.logLevel <= LogLevel.Error) {
      if (error) {
        console.error(`${this.prefix} [ERROR]`, message, error, ...args);
      } else {
        console.error(`${this.prefix} [ERROR]`, message, ...args);
      }
    }
  }

  /**
   * Log with custom styling (browser only)
   */
  log(message: string, style?: string, ...args: any[]): void {
    if (typeof window !== 'undefined' && style) {
      console.log(`%c${this.prefix} ${message}`, style, ...args);
    } else {
      console.log(`${this.prefix}`, message, ...args);
    }
  }

  /**
   * Group logs together
   */
  group(label: string): void {
    if (typeof console.group === 'function') {
      console.group(`${this.prefix} ${label}`);
    }
  }

  /**
   * End log group
   */
  groupEnd(): void {
    if (typeof console.groupEnd === 'function') {
      console.groupEnd();
    }
  }

  /**
   * Log a table (useful for arrays/objects)
   */
  table(data: any): void {
    if (this.logLevel <= LogLevel.Debug && typeof console.table === 'function') {
      console.table(data);
    }
  }

  /**
   * Time a function execution
   */
  time(label: string): void {
    if (typeof console.time === 'function') {
      console.time(`${this.prefix} ${label}`);
    }
  }

  /**
   * End timing a function execution
   */
  timeEnd(label: string): void {
    if (typeof console.timeEnd === 'function') {
      console.timeEnd(`${this.prefix} ${label}`);
    }
  }
}
