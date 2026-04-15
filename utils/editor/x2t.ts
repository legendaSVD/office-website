import { X2tConvertParams, X2tConvertResult } from "./types";
interface PendingMessage {
  resolve: (value: any) => void;
  reject: (error: Error) => void;
}
interface WorkerResponse {
  id: number;
  type: string;
  payload?: any;
  error?: string;
}
export class X2tConverter {
  private worker: Worker | null = null;
  private initPromise: Promise<void> | null = null;
  private messageId = 0;
  private pendingMessages = new Map<number, PendingMessage>();
  constructor() {
    if (globalThis.Worker) {
      this.init();
    }
  }
  private getNextId(): number {
    return ++this.messageId;
  }
  private sendMessage<T>(type: string, payload?: any): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error("Worker not initialized"));
        return;
      }
      const id = this.getNextId();
      this.pendingMessages.set(id, { resolve, reject });
      if (type === "convert" && payload?.data instanceof ArrayBuffer) {
        this.worker.postMessage({ id, type, payload }, [payload.data]);
      } else {
        this.worker.postMessage({ id, type, payload });
      }
    });
  }
  private handleWorkerMessage = (event: MessageEvent<WorkerResponse>) => {
    const { id, type, payload, error } = event.data;
    if (type === "ready") {
      console.log("[X2tConverter] Worker ready");
      return;
    }
    const pending = this.pendingMessages.get(id);
    if (!pending) return;
    this.pendingMessages.delete(id);
    if (type === "error") {
      pending.reject(new Error(error || "Unknown worker error"));
    } else {
      pending.resolve(payload);
    }
  };
  private handleWorkerError = (error: ErrorEvent) => {
    console.error("[X2tConverter] Worker error:", error);
    for (const [id, pending] of this.pendingMessages) {
      pending.reject(new Error(`Worker error: ${error.message}`));
      this.pendingMessages.delete(id);
    }
  };
  public init(): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = new Promise<void>((resolve, reject) => {
      try {
        this.worker = new Worker(new URL("./x2t.worker.ts", import.meta.url));
        this.worker.onmessage = this.handleWorkerMessage;
        this.worker.onerror = this.handleWorkerError;
        console.log("[X2tConverter] Worker created");
        resolve();
      } catch (err) {
        this.initPromise = null;
        reject(err);
      }
    });
    return this.initPromise;
  }
  public async convert({
    data,
    fileFrom,
    fileTo,
    media,
    fonts,
    themes,
  }: X2tConvertParams): Promise<X2tConvertResult> {
    await this.init();
    const cloneMap = (map?: { [key: string]: Uint8Array }) => {
      if (!map) return undefined;
      return Object.fromEntries(
        Object.entries(map).map(([key, value]) => [key, value.slice(0)])
      );
    };
    const dataClone = data.slice(0);
    const payload = {
      data: dataClone,
      fileFrom,
      fileTo,
      media: cloneMap(media),
      fonts: cloneMap(fonts),
      themes: cloneMap(themes),
    };
    return this.sendMessage<X2tConvertResult>("convert", payload);
  }
  public terminate(): void {
    if (this.worker) {
      for (const [id, pending] of this.pendingMessages) {
        pending.reject(new Error("Worker terminated"));
        this.pendingMessages.delete(id);
      }
      this.worker.terminate();
      this.worker = null;
      this.initPromise = null;
      console.log("[X2tConverter] Worker terminated");
    }
  }
  public get isInitialized(): boolean {
    return this.worker !== null && this.initPromise !== null;
  }
}
export const converter = new X2tConverter();