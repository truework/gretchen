export default async function fetcher(
  url: RequestInfo,
  opts: RequestInit = {}
): Promise<Response> {
  return fetch(url, {
    credentials: "same-origin",
    ...opts
  });
}
