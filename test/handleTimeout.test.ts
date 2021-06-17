import 'cross-fetch/polyfill'
import { createServer } from 'http'

import { handleTimeout } from '../lib/handleTimeout'

export default (test, assert) => {
  test('will timeout', async () => {
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
          assert.equal(e.name, 'HTTPTimeout')
        }

        server.close()

        r(0)
      })
    })
  })

  test("won't timeout", async () => {
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

        assert.equal(res, 'ha')

        server.close()

        r(0)
      })
    })
  })
}
