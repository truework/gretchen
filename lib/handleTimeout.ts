import { HTTPTimeout } from './errors';

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

