import { EventEmitter } from "eventemitter3";
type Callback = (...args: any[]) => void;
export interface MockSocketOptions {
  debug?: boolean;
}
export class MockSocket<
  ListenEvents extends Record<string, Callback> = any,
  EmitEvents extends Record<string, Callback> = any
> {
  private static _staticEmitter = new EventEmitter();
  static on<E extends string>(event: E, listener: Callback) {
    MockSocket._staticEmitter.on(event, listener);
  }
  static off<E extends string>(event: E, listener?: Callback) {
    MockSocket._staticEmitter.off(event, listener);
  }
  public active = true;
  public connected: boolean = false;
  public disconnected: boolean = true;
  public recovered = false;
  public id: string = "";
  public io = {
    setOpenToken: () => {
    },
    setSessionToken: () => {
    },
    on: () => {
    },
    reconnectionAttempts: () => {
    },
    reconnectionDelay: () => {
    },
    reconnectionDelayMax: () => {
    },
    timeout: () => {
    },
    transports: () => {
    },
    upgrade: () => {
    },
    upgradeTransport: () => {
    },
    upgradeTimeout: () => {
    },
  };
  private _clientEmitter = new EventEmitter();
  private _serverEmitter = new EventEmitter();
  private _debug: boolean;
  constructor(options: MockSocketOptions = {}) {
    this._debug = options.debug ?? process.env?.NODE_ENV === "development";
    this.connect();
  }
  private _log(...args: any[]): void {
    if (this._debug) {
      console.log("[MockSocket]", ...args);
    }
  }
  open() {
    return this.connect();
  }
  compress() {}
  connect() {
    this.connected = true;
    this.disconnected = false;
    this.id = Math.random().toString(36).substring(2, 15);
    setTimeout(() => {
      this._trigger("connect");
      MockSocket._staticEmitter.emit("connect", { socket: this });
    }, 0);
    return this;
  }
  disconnect() {
    this.connected = false;
    this.disconnected = true;
    this._trigger("disconnect");
    MockSocket._staticEmitter.emit("disconnect", { socket: this });
    return this;
  }
  close(): this {
    return this.disconnect();
  }
  private _trigger(event: string, ...args: any[]): this {
    this._log(`trigger event: ${event}`, ...args);
    this._clientEmitter.emit(event, ...args);
    return this;
  }
  on<E extends keyof ListenEvents & string>(
    event: E,
    listener: ListenEvents[E]
  ): this {
    this._clientEmitter.on(event, listener);
    return this;
  }
  once<E extends keyof ListenEvents & string>(
    event: E,
    listener: ListenEvents[E]
  ): this {
    this._clientEmitter.once(event, listener);
    return this;
  }
  off<E extends keyof ListenEvents & string>(
    event: E,
    listener?: ListenEvents[E]
  ): this {
    this._clientEmitter.off(event, listener);
    return this;
  }
  removeAllListeners(event?: string): this {
    this._clientEmitter.removeAllListeners(event);
    return this;
  }
  send(...args: Parameters<EmitEvents["message"]>): this {
    if (!this.connected) return this;
    this.emit("message", ...args);
    return this;
  }
  emit<E extends keyof EmitEvents & string>(
    event: E,
    ...args: Parameters<EmitEvents[E]>
  ): this {
    this._log(`emit: ${event}`, ...args);
    if (!this.connected) return this;
    const processEmit = async () => {
      this._serverEmitter.emit(event, ...args);
    };
    setTimeout(() => processEmit(), 0);
    return this;
  }
  public server = {
    on: (event: string, listener: Callback) => {
      this._serverEmitter.on(event, listener);
    },
    off: (event: string, listener?: Callback) => {
      this._serverEmitter.off(event, listener);
    },
    emit: (event: string, ...args: any[]) => {
      this._clientEmitter.emit(event, ...args);
    },
  };
}
export function io(url?: string, options?: MockSocketOptions): MockSocket {
  return new MockSocket(options);
}
export interface SocketIOStatic {
  (url?: string, options?: MockSocketOptions): MockSocket;
}
const ioWithStatics = io as SocketIOStatic;
export default ioWithStatics;