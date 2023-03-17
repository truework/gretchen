import { HTTPTimeout } from "./errors";

export type RetryOptions = {
  attempts?: number;
  codes?: number[];
  methods?: string[];
  delay?: number;
};

export const defaultRetryOptions: RetryOptions = {
  attempts: 2,
  codes: [408, 413, 429],
  methods: ["GET"],
  delay: 6,
};

export async function handleRetry(
  request: () => Promise<Response>,
  method: string,
  retryOptions: Partial<RetryOptions>
) {
  const res = await request();
  const { status, headers } = res;
  const retryAfter = headers.get("Retry-After");

  const { attempts, codes, methods, delay } = {
    ...defaultRetryOptions,
    ...retryOptions,
  };

  const codesMatch =
    codes.indexOf(status) > -1 || (status >= 500 && status < 600);
  const methodsMatch = methods.indexOf(method) > -1;

  if (codesMatch && methodsMatch) {
    if (attempts === 0 || res instanceof HTTPTimeout) {
      return res;
    }

    await new Promise((r) => {
      setTimeout(r, retryAfter ? parseInt(retryAfter, 10) * 1000 : delay);
    });

    return handleRetry(request, method, {
      attempts: attempts - 1,
      codes: codes,
      methods: methods,
      delay: delay * delay,
    });
  }

  return res;
}
