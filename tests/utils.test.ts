import test from "ava";

import { normalizeURL } from "../lib/utils";

test("normalizeURL", t => {
  const normalized = "https://www.foo.com/api/v1/user";
  const baseURL = "https://www.foo.com";

  const normal = normalizeURL("api/v1/user", { baseURL });
  t.is(normal, normalized);

  const trailingSlash = normalizeURL("api/v1/user", { baseURL: baseURL + "/" });
  t.is(trailingSlash, normalized);

  const leadingSlash = normalizeURL("/api/v1/user", { baseURL });
  t.is(leadingSlash, normalized);

  // no slashes
  const noSlashes = normalizeURL("api/v1/user", { baseURL });
  t.is(noSlashes, normalized);

  const root = normalizeURL("", { baseURL });
  t.is(root, baseURL + "/");

  const absoluteOverride = normalizeURL("https://www.bar.com/api/v1/user", {
    baseURL: "http://localhost:8080"
  });
  t.is(absoluteOverride, "https://www.bar.com/api/v1/user");

  const relativePath = normalizeURL("v1/user", { baseURL: "/api" });
  t.is(relativePath, "/api/v1/user");
});
