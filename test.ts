import { createServer } from "http";
import fetch from "node-fetch";
import test from "ava";

// @ts-ignore
global.fetch = fetch;

import * as gretch from "./index";

test("handleRetry: retry works", async t => {
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

      const raw = await gretch.handleRetry(() =>
        gretch.fetcher(`http://127.0.0.1:${port}`)
      );
      const res = await raw.text();

      t.is(res, "ha");

      server.close();

      r();
    });
  });
});

test("handleRetry: retries fail", async t => {
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

      const raw = await gretch.handleRetry(
        () => gretch.fetcher(`http://127.0.0.1:${port}`),
        1
      );
      t.is(raw.status, 500);

      server.close();

      r();
    });
  });
});

test("handleTimeout: will timeout", async t => {
  const server = createServer((req, res) => {
    setTimeout(() => {
      res.end("ha");
    }, 1000);
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      try {
        await gretch.handleTimeout(
          gretch.fetcher(`http://127.0.0.1:${port}`),
          500
        );
      } catch (e) {
        t.is(e.name, "HTTPTimeout");
      }

      server.close();

      r();
    });
  });
});

test("handleTimeout: won't timeout", async t => {
  const server = createServer((req, res) => {
    setTimeout(() => {
      res.end("ha");
    }, 1000);
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const raw = await gretch.handleTimeout(
        gretch.fetcher(`http://127.0.0.1:${port}`)
      );
      const res = await raw.text();

      t.is(res, "ha");

      server.close();

      r();
    });
  });
});

test("handleRetry(handleTimeout): timeout", async t => {
  const server = createServer((req, res) => {
    setTimeout(() => {
      res.end("ha");
    }, 1000);
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const request = () =>
        gretch.handleTimeout(gretch.fetcher(`http://127.0.0.1:${port}`), 500);

      try {
        await gretch.handleRetry(request);
      } catch (e) {
        t.is(e.name, "HTTPTimeout");
      }

      server.close();

      r();
    });
  });
});

test("gretch: successful requesst", async t => {
  const server = createServer((req, res) => {
    res.end("ha");
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch.gretch(`http://127.0.0.1:${port}`).text();

      if (res.data) {
        t.is(res.data, "ha");
      }

      server.close();

      r();
    });
  });
});

test("gretch: retry request", async t => {
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

      const res = await gretch.gretch(`http://127.0.0.1:${port}`).text();

      if (res.data) {
        t.is(res.data, "ha");
      }

      server.close();

      r();
    });
  });
});

test("gretch: retry fails, returns generic error", async t => {
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

      const res = await gretch
        .gretch(`http://127.0.0.1:${port}`, {
          retry: 1
        })
        .text();

      t.is(res.error.name, "HTTPError");

      server.close();

      r();
    });
  });
});

test("gretch: request timeout, returns generic error", async t => {
  const server = createServer((req, res) => {
    setTimeout(() => {
      res.end("ha");
    }, 1000);
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch
        .gretch(`http://127.0.0.1:${port}`, {
          timeout: 500
        })
        .text();

      t.is(res.error.name, "HTTPTimeout");

      server.close();

      r();
    });
  });
});

test("gretch: json posts", async t => {
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

      const res = await gretch
        .gretch<{ success: boolean }>(`http://127.0.0.1:${port}`, {
          method: "POST",
          json: {
            foo: true
          }
        })
        .json();

      t.is(res.data.success, true);

      server.close();

      r();
    });
  });
});

test("gretch: returns server error", async t => {
  const server = createServer((req, res) => {
    res.writeHead(500);
    res.end(JSON.stringify({ message: "foo" }));
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch.gretch(`http://127.0.0.1:${port}`).json();

      if (res.error) {
        t.is(res.error.message, "foo");
      }

      server.close();

      r();
    });
  });
});

test("gretch: returns data as error", async t => {
  const server = createServer((req, res) => {
    res.writeHead(400, {
      'Content-Type': 'application/json',
    });
    res.end(JSON.stringify({ message: "foo" }));
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const res = await gretch.gretch(`http://127.0.0.1:${port}`).json();

      if (res.error) {
        t.is(res.error.message, "foo");
      }

      server.close();

      r();
    });
  });
});
