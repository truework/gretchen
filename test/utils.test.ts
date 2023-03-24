import { normalizeURL } from "../lib/utils";

export default (test, assert) => {
  test("normalizeURL", () => {
    const normalized = "https://www.foo.com/api/v1/user";
    const baseURL = "https://www.foo.com";

    const normal = normalizeURL("api/v1/user", { baseURL });
    assert.equal(normal, normalized);

    const trailingSlash = normalizeURL("api/v1/user", {
      baseURL: baseURL + "/",
    });
    assert.equal(trailingSlash, normalized);

    const leadingSlash = normalizeURL("/api/v1/user", { baseURL });
    assert.equal(leadingSlash, normalized);

    // no slashes
    const noSlashes = normalizeURL("api/v1/user", { baseURL });
    assert.equal(noSlashes, normalized);

    const root = normalizeURL("", { baseURL });
    assert.equal(root, baseURL + "/");

    const absoluteOverride = normalizeURL("https://www.bar.com/api/v1/user", {
      baseURL: "http://localhost:8080",
    });
    assert.equal(absoluteOverride, "https://www.bar.com/api/v1/user");

    const relativePath = normalizeURL("v1/user", { baseURL: "/api" });
    assert.equal(relativePath, "/api/v1/user");
  });
};
