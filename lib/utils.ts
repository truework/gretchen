const protocolRegEx = /https?:\/\//;

export function normalizeURL(url: string, { baseURL }: { baseURL: string }) {
  if (protocolRegEx.test(url) || !baseURL) return url;

  const [protocol] = baseURL.match(protocolRegEx) || [""];
  const path = (baseURL.replace(protocol, "") + "/").replace(/\/\//, "/");

  return protocol + (path + url).replace(/\/\//, "/");
}
