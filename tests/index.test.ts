import "cross-fetch/polyfill";
import { createServer } from "http";
import test from "ava";

import { gretch, create } from "../index";

test("successful request", async t => {
  const server = createServer((req, res) => {
    res.end("ha");
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).text();

      if (res.data) {
        t.is(res.data, "ha");
      }

      server.close();

      r();
    });
  });
});

test("retry request", async t => {
  let i = 0;
  const server = createServer((req, res) => {
    if (i++ < 2) {
      res.writeHead(500);
      res.end();
    } else {
      res.end("ha");
    }
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).text();

      if (res.data) {
        t.is(res.data, "ha");
      }

      server.close();

      r();
    });
  });
});

test("retry fails, returns generic error", async t => {
  let i = 0;
  const server = createServer((req, res) => {
    if (i++ < 2) {
      res.writeHead(500);
      res.end();
    } else {
      res.end("ha");
    }
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`, {
        retry: {
          attempts: 1
        }
      }).text();

      t.is(res.error.name, "HTTPError");

      server.close();

      r();
    });
  });
});

test("request timeout, returns generic error", async t => {
  const server = createServer((req, res) => {
    setTimeout(() => {
      res.end("ha");
    }, 1000);
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`, {
        timeout: 500
      }).text();

      t.is(res.error.name, "HTTPTimeout");

      server.close();

      r();
    });
  });
});

test("json posts", async t => {
  const server = createServer((req, res) => {
    const data = [];
    req.on("data", chunk => data.push(chunk));
    req.on("end", () => {
      const body = JSON.parse(data[0].toString("utf8"));
      t.is(body.foo, true);
      res.end(JSON.stringify({ success: true }));
    });
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch<{ success: boolean }>(
        `http://127.0.0.1:${port}`,
        {
          method: "POST",
          json: {
            foo: true
          }
        }
      ).json();

      t.is(res.data.success, true);

      server.close();

      r();
    });
  });
});

test("won't parse 204 status", async t => {
  const server = createServer((req, res) => {
    const body = { message: "foo" };
    res.writeHead(204, {
      "Content-Type": "application/json",
      "Content-Length": JSON.stringify(body).length
    });
    res.end(JSON.stringify(body));
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).json();

      t.falsy(res.data);
      t.falsy(res.error);

      server.close();

      r();
    });
  });
});

test("returns data as error", async t => {
  const server = createServer((req, res) => {
    const body = { message: "foo" };
    res.writeHead(400, {
      "Content-Type": "application/json",
      "Content-Length": JSON.stringify(body).length
    });
    res.end(JSON.stringify(body));
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).json();

      if (res.error) {
        t.is(res.error.message, "foo");
      }

      server.close();

      r();
    });
  });
});

test(`body exists, will fail to parse non-json`, async t => {
  const server = createServer((req, res) => {
    res.writeHead(200, {
      "Content-Length": "3"
    });
    res.end("hey");
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).json();

      if (res.error) {
        t.pass();
      }

      server.close();

      r();
    });
  });
});

/**
 * Calling writeHead overrides default Content-Length
 * set by res.end(), i.e. if we removed writeHead here
 * this test would break.
 */
test(`will parse body if Content-Length header doesn't exist`, async t => {
  const server = createServer((req, res) => {
    res.writeHead(200, {
      "Content-Type": "application/json"
    });
    res.end(JSON.stringify({ foo: true }));
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).json();

      t.truthy(res.data);
      t.falsy(res.error);

      server.close();

      r();
    });
  });
});

test(`body does not exist, will not fail to parse non-json`, async t => {
  const server = createServer((req, res) => {
    res.writeHead(200);
    res.end();
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).json();

      if (res.error) {
        t.fail();
      }

      t.pass();

      server.close();

      r();
    });
  });
});

test(`hooks`, async t => {
  const server = createServer((req, res) => {
    res.writeHead(200);
    res.end();
  });

  t.plan(2);

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      await gretch(`http://127.0.0.1:${port}`, {
        timeout: 50000,
        hooks: {
          before(request) {
            t.truthy(request.url);
          },
          after({ status }) {
            t.is(status, 200);
          }
        }
      }).json();

      server.close();

      r();
    });
  });
});

test(`create`, async t => {
  const server = createServer((req, res) => {
    res.writeHead(200);
    res.end();
  });

  t.plan(1);

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const wrappedGretch = create({
        headers: {
          Foo: "Bar"
        }
      });

      await wrappedGretch(`http://127.0.0.1:${port}`, {
        hooks: {
          before(request, opts) {
            t.is(opts.headers.Foo, "Bar");
          }
        }
      }).json();

      server.close();

      r();
    });
  });
});

test(`create with baseURL`, async t => {
  const wrappedGretch = create({
    baseURL: `http://www.foo.com`
  });

  const res = await wrappedGretch("api").json();

  t.is(res.url, `http://www.foo.com/api`);
});

test(`create with baseURL, override per request`, async t => {
  const wrappedGretch = create({
    baseURL: `http://www.example.com`
  });

  const res = await wrappedGretch("/api", {
    baseURL: `http://www.example.net`
  }).json();

  t.is(res.url, `http://www.example.net/api`);
});

test(`body not parsed with flush`, async t => {
  const server = createServer((req, res) => {
    const body = { message: "foo" };
    res.writeHead(200, {
      "Content-Type": "application/json",
      "Content-Length": JSON.stringify(body).length
    });
    res.end(JSON.stringify(body));
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch(`http://127.0.0.1:${port}`).flush();

      t.truthy(res.url);
      t.truthy(res.status);
      t.truthy(res.response);
      // @ts-ignore
      t.falsy(res.error);
      // @ts-ignore
      t.falsy(res.data);

      t.pass();

      server.close();

      r();
    });
  });
});
