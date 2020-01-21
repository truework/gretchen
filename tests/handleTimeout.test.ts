import { createServer } from "http";
import fetch from "node-fetch";
import test from "ava";

// @ts-ignore
global.fetch = fetch;

import * as gretch from "../index";

test("will timeout", async t => {
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

test("won't timeout", async t => {
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
