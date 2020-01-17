export type APIResponse = any;
export type APIError = any;

export type GretchResponse<T = APIResponse, A = APIError> =
  | {
      response: Response;
      status: number;
      error: A;
      data: undefined;
    }
  | {
      response: Response;
      status: number;
      error: undefined;
      data: T;
    };

export type RequestOpts = {
  json?: { [key: string]: any };
  retry?: number | boolean;
  timeout?: number;
  [key: string]: any;
};

type GretchInstance<T, A> = {
  [key: string]: () => Promise<GretchResponse<T, A>>;
};

interface HTTPError extends Error {
  name: string;
  status: number;
  url: string;
}

interface HTTPTimeout extends Error {
  name: string;
  url: string;
}

const resolvers = ["json", "text", "formData", "arrayBuffer", "blob"];

// @ts-ignore
const global = global || {};

if (typeof AbortController === "function") {
  global.AbortController = AbortController;
}

class HTTPError extends Error {
  constructor(response: Response) {
    super(response.statusText);
    this.name = "HTTPError";
    this.status = response.status;
    this.url = response.url;
  }
}

class HTTPTimeout extends Error {
  constructor() {
    super("Request timed out");
    this.name = "HTTPTimeout";
  }
}

export async function fetcher(
  url: RequestInfo,
  opts: RequestInit = {}
): Promise<Response> {
  const headers: { [key: string]: any } = opts.headers || {};

  return fetch(url, {
    credentials: "same-origin",
    ...opts,
    headers
  });
}

export async function handleRetry(
  request: () => Promise<Response>,
  times = 2,
  delay = 6
) {
  const res = await request();

  if (!res.ok) {
    if (times === 0 || res instanceof HTTPTimeout) {
      return res;
    }

    await new Promise(r => {
      setTimeout(r, delay);
    });
    return handleRetry(request, times - 1, delay * 6);
  }

  return res;
}

export async function handleTimeout(
  request: Promise<Response>,
  ms = 10000,
  controller?: AbortController
): Promise<Response> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      if (controller) {
        console.log("abort");
        controller.abort();
      }

      reject(new HTTPTimeout());
    }, ms);

    request
      .then(resolve)
      .catch(reject)
      .then(() => clearTimeout(timer));
  });
}

export function gretch<T = APIResponse, A = APIError>(
  url: RequestInfo,
  opts: RequestInit & RequestOpts = {}
): GretchInstance<T, A> {
  const { json, retry = 2, timeout = 10000, ...rest } = opts;
  const options: RequestInit = { ...(rest as RequestInit) };
  const controller = global.supportsAbort ? new global.AbortController() : null;

  if (controller) {
    options.signal = controller.signal;
  }

  if (json) {
    options.headers = {
      "Content-Type": "application/json",
      ...(options.headers || {})
    };

    options.body = JSON.stringify(json);
  }

  const request = () =>
    timeout
      ? handleTimeout(fetcher(url, options), timeout, controller)
      : fetcher(url, options);

  const response =
    retry !== false ? handleRetry(request, retry as number) : request();

  return resolvers.reduce((methods, key) => {
    methods[key] = async () => {
      let status = 500;
      let res;

      try {
        res = (await response).clone();
        status = res.status || 500;

        let resolved = await res[key]();

        if (res.ok) {
          return {
            response: res,
            status,
            error: undefined,
            data: resolved as T
          };
        }

        if (!resolved) {
          resolved = new HTTPError(res);
        }

        return {
          response: res,
          status,
          error: resolved as A,
          data: undefined
        };
      } catch (e) {
        return {
          response: res as Response,
          status,
          error: (e || `You tried to make fetch happen, but it didn't.`) as any,
          data: undefined
        };
      }
    };
    return methods;
  }, {});
}
