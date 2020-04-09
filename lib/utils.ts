export function normalizeURL(
  url: string,
  { baseURL = "" }: { baseURL: string }
) {
  return (
    (/\/$/.test(baseURL) ? baseURL : baseURL + "/") +
    (/^\//.test(url) ? url.replace(/^\//, "") : url)
  );
}
