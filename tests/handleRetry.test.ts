import { createServer } from "http";
import fetch from "node-fetch";
import test from "ava";

// @ts-ignore
global.fetch = fetch;

import * as gretch from "../index";

test("works", async t => {
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
        "GET",
        {}
      );
      const res = await raw.text();

      t.is(res, "ha");

      server.close();

      r();
    });
  });
});

test("retries fail", async t => {
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
        "GET",
        { attempts: 1 }
      );
      t.is(raw.status, 500);

      server.close();

      r();
    });
  });
});

test("retries for specified status codes", async t => {
  let i = 0;
  const server = createServer((req, res) => {
    if (i++ < 2) {
      res.writeHead(400);
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
        "GET",
        { codes: [ 400 ] }
      );
      const res = await raw.text();

      t.is(res, 'ha');

      server.close();

      r();
    });
  });
});

test("retries for specified methods", async t => {
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
        "POST",
        { methods: [ "POST" ] }
      );
      const res = await raw.text();

      t.is(res, 'ha');

      server.close();

      r();
    });
  });
});

test("works with timeout", async t => {
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
        await gretch.handleRetry(request, "GET", {});
      } catch (e) {
        t.is(e.name, "HTTPTimeout");
      }

      server.close();

      r();
    });
  });
})
