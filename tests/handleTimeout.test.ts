import 'cross-fetch/polyfill'
import { createServer } from 'http'
import test from 'ava'

import { handleTimeout } from '../lib/handleTimeout'

test('will timeout', async t => {
  const server = createServer((req, res) => {
    setTimeout(() => {
      res.end('ha')
    }, 1000)
  })

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address()

      try {
        await handleTimeout(fetch(`http://127.0.0.1:${port}`), 500)
      } catch (e) {
        t.is(e.name, 'HTTPTimeout')
      }

      server.close()

      r()
    })
  })
})

test("won't timeout", async t => {
  const server = createServer((req, res) => {
    setTimeout(() => {
      res.end('ha')
    }, 1000)
  })

  await new Promise(r => {
    server.listen(async () => {
      // @ts-ignore
      const { port } = server.address()

      const raw = await handleTimeout(fetch(`http://127.0.0.1:${port}`))
      const res = await raw.text()

      t.is(res, 'ha')

      server.close()

      r()
    })
  })
})
