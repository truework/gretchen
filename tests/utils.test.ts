import test from "ava";

import { normalizeURL } from "../lib/utils";

test("normalizeURL", t => {
  const url = "https://www.foo.com/api/v1/user";
  const baseURL = "https://www.foo.com";

  const one = normalizeURL("api/v1/user", { baseURL });
  t.truthy(one === url);

  // trailing slash
  const two = normalizeURL("api/v1/user", { baseURL: baseURL + "/" });
  t.truthy(two === url);

  // leading slashe
  const three = normalizeURL("/api/v1/user", { baseURL });
  t.truthy(three === url);

  // no slashes
  const four = normalizeURL("api/v1/user", { baseURL });
  t.truthy(four === url);

  const five = normalizeURL("", { baseURL: "http://localhost:8080" });
  t.truthy(five === "http://localhost:8080/");
});
