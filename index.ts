import fetch from "./lib/fetch";
import { HTTPError } from "./lib/errors";
import {
  handleRetry,
  defaultRetryOptions,
  RetryOptions
} from "./lib/handleRetry";
import { handleTimeout } from "./lib/handleTimeout";

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

export type GretchOptions = {
  json?: { [key: string]: any };
  retry?: RetryOptions | boolean;
  timeout?: number;
  [key: string]: any;
};

type GretchInstance<T, A> = {
  [key: string]: () => Promise<GretchResponse<T, A>>;
};

// @ts-ignore
const global = global || {};

if (typeof AbortController === "function") {
  global.AbortController = AbortController;
}

export default function gretch<T = APIResponse, A = APIError>(
  url: RequestInfo,
  opts: RequestInit & GretchOptions = {}
): GretchInstance<T, A> {
  const {
    method = "GET",
    json,
    retry = defaultRetryOptions,
    timeout = 10000,
    ...rest
  } = opts;
  const options: RequestInit = {
    method,
    headers: {},
    ...(rest as RequestInit)
  };
  const controller = global.supportsAbort ? new global.AbortController() : null;

  if (controller) {
    options.signal = controller.signal;
  }

  if (json) {
    options.headers = {
      "Content-Type": "application/json",
      ...options.headers
    };

    options.body = JSON.stringify(json);
  }

  const request = () =>
    timeout
      ? handleTimeout(fetch(url, options), timeout, controller)
      : fetch(url, options);

  const response =
    retry === false
      ? request()
      : handleRetry(request, method, retry as Partial<RetryOptions>);

  return ["json", "text", "formData", "arrayBuffer", "blob"].reduce(
    (methods, key) => {
      methods[key] = async () => {
        let status = 500;
        let res;
        let resolved: any;

        try {
          res = (await response).clone();
          status = res.status || 500;

          if (await (res.clone()).text()) {
            resolved = await res[key]();
          }

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
            error: (e ||
              `You tried to make fetch happen, but it didn't.`) as any,
            data: undefined
          };
        }
      };
      return methods;
    },
    {}
  );
}
