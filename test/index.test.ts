import "cross-fetch/polyfill";
import { createServer } from "http";

import { gretch, create } from "../index";

export default (test, assert) => {
  test("successful request", async () => {
    const server = createServer((req, res) => {
      res.end("ha");
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`).text();

        if (res.data) {
          assert.equal(res.data, "ha");
        }

        server.close();

        r(0);
      });
    });
  });

  test("retry request", async () => {
    let i = 0;
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(500);
        res.end();
      } else {
        res.end("ha");
      }
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`).text();

        if (res.data) {
          assert.equal(res.data, "ha");
        }

        server.close();

        r(0);
      });
    });
  });

  test("retry fails, returns generic error", async () => {
    let i = 0;
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(500);
        res.end();
      } else {
        res.end("ha");
      }
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`, {
          retry: {
            attempts: 1,
          },
        }).text();

        assert.equal(res.error.name, "HTTPError");

        server.close();

        r(0);
      });
    });
  });

  test("request timeout, returns generic error", async () => {
    const server = createServer((req, res) => {
      setTimeout(() => {
        res.end("ha");
      }, 1000);
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`, {
          timeout: 500,
        }).text();

        assert.equal(res.error.name, "HTTPTimeout");

        server.close();

        r(0);
      });
    });
  });

  test("json posts", async () => {
    const server = createServer((req, res) => {
      const data = [];
      req.on("data", (chunk) => data.push(chunk));
      req.on("end", () => {
        const body = JSON.parse(data[0].toString("utf8"));
        assert.equal(body.foo, true);
        res.end(JSON.stringify({ success: true }));
      });
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch<{ success: boolean }>(
          `http://127.0.0.1:${port}`,
          {
            method: "POST",
            json: {
              foo: true,
            },
          }
        ).json();

        assert.equal(res.data.success, true);

        server.close();

        r(0);
      });
    });
  });

  test("won't parse 204 status", async () => {
    const server = createServer((req, res) => {
      const body = { message: "foo" };
      res.writeHead(204, {
        "Content-Type": "application/json",
        "Content-Length": JSON.stringify(body).length,
      });
      res.end(JSON.stringify(body));
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`).json();

        assert(!res.data);
        assert(!res.error);

        server.close();

        r(0);
      });
    });
  });

  test("returns data as error", async () => {
    const server = createServer((req, res) => {
      const body = { message: "foo" };
      res.writeHead(400, {
        "Content-Type": "application/json",
        "Content-Length": JSON.stringify(body).length,
      });
      res.end(JSON.stringify(body));
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`).json();

        if (res.error) {
          assert.equal(res.error.message, "foo");
        }

        server.close();

        r(0);
      });
    });
  });

  test(`body exists, will fail to parse non-json`, async () => {
    const server = createServer((req, res) => {
      res.writeHead(200, {
        "Content-Type": "application/json",
      });
      res.end("hey");
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`).json();

        assert(!!res.error);

        server.close();

        r(0);
      });
    });
  });

  test(`won't parse body if 204 and json()`, async () => {
    const server = createServer((req, res) => {
      res.writeHead(204, {
        "Content-Type": "application/json",
      });
      res.end(JSON.stringify({ foo: true }));
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`).json();

        assert(!res.data);
        assert(!res.error);

        server.close();

        r(0);
      });
    });
  });

  test(`hooks`, async () => {
    const server = createServer((req, res) => {
      res.writeHead(200);
      res.end();
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        let hooks = 0;

        await gretch(`http://127.0.0.1:${port}`, {
          timeout: 50000,
          hooks: {
            before(request, opts) {
              assert(request.url);
              assert(opts.timeout);
              hooks++;
            },
            after: [
              (response, opts) => {
                assert(response.status);
                assert(opts.timeout);
                hooks++;
              },
              () => {
                hooks++;
              },
            ],
          },
        }).json();

        assert(hooks === 3);

        server.close();

        r(0);
      });
    });
  });

  test(`create`, async () => {
    const server = createServer((req, res) => {
      res.writeHead(200);
      res.end();
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const wrappedGretch = create({
          headers: {
            Foo: "Bar",
          },
        });

        await wrappedGretch(`http://127.0.0.1:${port}`, {
          hooks: {
            before(request, opts) {
              assert.equal(opts.headers.Foo, "Bar");
            },
          },
        }).json();

        server.close();

        r(0);
      });
    });
  });

  test(`create with baseURL`, async () => {
    const wrappedGretch = create({
      baseURL: `http://www.foo.com`,
    });

    const res = await wrappedGretch("api").json();

    assert.equal(res.url, `http://www.foo.com/api`);
  });

  test(`create with baseURL, override per request`, async () => {
    const wrappedGretch = create({
      baseURL: `http://www.foo.com`,
    });

    const res = await wrappedGretch("/api", {
      baseURL: `http://www.bar.com`,
    }).json();

    assert.equal(res.url, `http://www.bar.com/api`);
  });

  test(`body not parsed with flush`, async () => {
    const server = createServer((req, res) => {
      const body = { message: "foo" };
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Content-Length": JSON.stringify(body).length,
      });
      res.end(JSON.stringify(body));
    });

    await new Promise((r) => {
      server.listen(async () => {
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const { port } = server.address();

        const res = await gretch(`http://127.0.0.1:${port}`).flush();

        assert(!!res.url);
        assert(!!res.status);
        assert(!!res.response);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        assert(!res.error);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        assert(!res.data);

        server.close();

        r(0);
      });
    });
  });
};
