import 'cross-fetch/polyfill'
import { createServer } from "http";
import test from "ava";

import fetch from "../lib/fetch";
import { handleRetry } from "../lib/handleRetry";
import { handleTimeout } from "../lib/handleTimeout";

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

      const raw = await handleRetry(
        () => fetch(`http://127.0.0.1:${port}`),
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

      const raw = await handleRetry(
        () => fetch(`http://127.0.0.1:${port}`),
        "GET",
        { attempts: 1 }
      );
      t.is(raw.status, 500);

      server.close();

      r();
    });
  });
});

test("respect 0 retries config", async t => {
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

      const raw = await handleRetry(
        () => fetch(`http://127.0.0.1:${port}`),
        "GET",
        { attempts: 0 }
      );
      t.is(raw.status, 500);
      t.is(i, 1);

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

      const raw = await handleRetry(
        () => fetch(`http://127.0.0.1:${port}`),
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

      const raw = await handleRetry(
        () => fetch(`http://127.0.0.1:${port}`),
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
        handleTimeout(fetch(`http://127.0.0.1:${port}`), 500);

      try {
        await handleRetry(request, "GET", {});
      } catch (e) {
        t.is(e.name, "HTTPTimeout");
      }

      server.close();

      r();
    });
  });
})

test("respects Retry-After header", async t => {
  let i = 0;
  const server = createServer((req, res) => {
    if (i++ < 2) {
      res.writeHead(500, {
        'Retry-After': 1
      });
      res.end();
    } else {
      res.end("ha");
    }
  });

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address();

      const then = Date.now();

      const raw = await handleRetry(
        () => fetch(`http://127.0.0.1:${port}`),
        "GET",
        {}
      );

      const now = Date.now();

      // retried too fast
      if ((now - then) < 1000) {
        t.fail();
      }

      const res = await raw.text();

      t.is(res, 'ha');

      server.close();

      r();
    });
  });
})
