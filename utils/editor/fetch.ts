import type { XHRMiddleware } from "./xhr";
export type FetchProxy = typeof fetch & {
  use(middleware: XHRMiddleware): void;
  clearMiddlewares(): void;
};
export function createFetchProxy(
  target: (Window & { fetch: typeof fetch }) | typeof fetch = globalThis.fetch,
): FetchProxy {
  const middlewares: XHRMiddleware[] = [];
  const BaseFetch =
    typeof target === "function" ? target : target.fetch.bind(target);
  const proxy = (async (input: RequestInfo | URL, init?: RequestInit) => {
    let request: Request;
    try {
      request = new Request(input, init);
    } catch (e) {
      return BaseFetch(input, init);
    }
    try {
      for (const mw of middlewares) {
        const response = await mw(request.clone());
        if (response) {
          return response;
        }
      }
    } catch (err) {
      console.error("ProxyFetch middleware error:", err);
      return BaseFetch(request);
    }
    return BaseFetch(request);
  }) as FetchProxy;
  proxy.use = (middleware: XHRMiddleware) => {
    middlewares.push(middleware);
  };
  proxy.clearMiddlewares = () => {
    middlewares.length = 0;
  };
  return proxy;
}