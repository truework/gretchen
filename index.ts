import fetch from './lib/fetch'
import { HTTPError } from './lib/errors'
import {
  handleRetry,
  defaultRetryOptions,
  RetryOptions
} from './lib/handleRetry'
import { handleTimeout } from './lib/handleTimeout'
import { normalizeURL } from './lib/utils'

export type DefaultGretchResponse = any
export type DefaultGretchError = any

export type GretchResponse<T = DefaultGretchResponse, A = DefaultGretchError> =
  | {
      url: string
      status: number
      data: undefined
      error: A
      response: Response
    }
  | {
      url: string
      status: number
      data: T
      error: undefined
      response: Response
    }

export type GretchHooks = {
  before?: (request: Request, opts: GretchOptions) => void
  after?: (response: GretchResponse, opts: GretchOptions) => void
}

export type GretchOptions = {
  baseURL?: string
  json?: { [key: string]: any }
  retry?: RetryOptions | boolean
  timeout?: number
  onException?: (e: Error) => void
  hooks?: GretchHooks
  headers?: { [key: string]: any } & RequestInit['headers']
  [key: string]: any
} & RequestInit

export type GretchInstance<T, A> = {
  flush(): Promise<{ url: string; status: number; response: Response }>
  arrayBuffer: () => Promise<GretchResponse<T, A>>
  blob: () => Promise<GretchResponse<T, A>>
  formData: () => Promise<GretchResponse<T, A>>
  json: () => Promise<GretchResponse<T, A>>
  text: () => Promise<GretchResponse<T, A>>
}

export function gretch<T = DefaultGretchResponse, A = DefaultGretchError> (
  url: string,
  opts: GretchOptions = {}
): GretchInstance<T, A> {
  const {
    method = 'GET',
    baseURL,
    json,
    retry = defaultRetryOptions,
    timeout = 10000,
    hooks = {},
    ...rest
  } = opts
  const options: RequestInit = {
    method,
    headers: {},
    ...(rest as RequestInit)
  }
  const controller =
    typeof AbortController !== 'undefined' ? new AbortController() : null

  if (controller) {
    options.signal = controller.signal
  }

  if (json) {
    options.headers = {
      'Content-Type': 'application/json',
      ...options.headers
    }

    options.body = JSON.stringify(json)
  }

  const normalizedURL =
    baseURL !== undefined ? normalizeURL(url, { baseURL }) : url
  const request = new Request(normalizedURL, options)

  if (hooks.before) hooks.before(request, opts)

  const fetcher = () =>
    timeout
      ? handleTimeout(fetch(request), timeout, controller)
      : fetch(request)

  const sent =
    retry === false
      ? fetcher()
      : handleRetry(fetcher, method, retry as Partial<RetryOptions>)

  const instance = {
    async flush () {
      const response = (await sent).clone()
      return {
        url: normalizedURL,
        status: response.status,
        response
      }
    }
  }
  ;['json', 'text', 'formData', 'arrayBuffer', 'blob'].forEach(key => {
    instance[key] = async () => {
      let response: Response
      let status = 500
      let resolved: T | A
      let error
      let data

      try {
        response = (await sent).clone()
        status = response.status || 500

        if (status !== 204) {
          resolved = await response.clone()[key]()
        }

        if (response.ok) {
          data = resolved as T
        } else {
          error = (resolved || new HTTPError(response)) as A
        }
      } catch (e) {
        error = (e || `You tried to make fetch happen, but it didn't.`) as any
      }

      const res: GretchResponse<T, A> = {
        url: normalizedURL,
        status,
        data,
        error,
        response
      }

      if (hooks.after) hooks.after(res, opts)

      return res
    }
  })

  return instance as GretchInstance<T, A>
}

export function create (defaultOpts: GretchOptions = {}) {
  return function wrappedGretch<
    T = DefaultGretchResponse,
    A = DefaultGretchError
  > (url: string, opts: GretchOptions = {}): GretchInstance<T, A> {
    return gretch(url, { ...defaultOpts, ...opts })
  }
}
