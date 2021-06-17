import 'cross-fetch/polyfill'
import { createServer } from 'http'

import { handleRetry } from '../lib/handleRetry'
import { handleTimeout } from '../lib/handleTimeout'

export default (test, assert) => {
  test('works', async () => {
    let i = 0
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(500)
        res.end()
      } else {
        res.end('ha')
      }
    })

    await new Promise(r => {
      server.listen(async () => {
        // @ts-ignore
        const { port } = server.address()

        const raw = await handleRetry(
          () => fetch(`http://127.0.0.1:${port}`),
          'GET',
          {}
        )
        const res = await raw.text()

        assert.equal(res, 'ha')

        server.close()

        r(0)
      })
    })
  })

  test('retries fail', async () => {
    let i = 0
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(500)
        res.end()
      } else {
        res.end('ha')
      }
    })

    await new Promise(r => {
      server.listen(async () => {
        // @ts-ignore
        const { port } = server.address()

        const raw = await handleRetry(
          () => fetch(`http://127.0.0.1:${port}`),
          'GET',
          { attempts: 1 }
        )
        assert.equal(raw.status, 500)

        server.close()

        r(0)
      })
    })
  })

  test('respect 0 retries config', async () => {
    let i = 0
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(500)
        res.end()
      } else {
        res.end('ha')
      }
    })

    await new Promise(r => {
      server.listen(async () => {
        // @ts-ignore
        const { port } = server.address()

        const raw = await handleRetry(
          () => fetch(`http://127.0.0.1:${port}`),
          'GET',
          { attempts: 0 }
        )
        assert.equal(raw.status, 500)
        assert.equal(i, 1)

        server.close()

        r(0)
      })
    })
  })

  test('retries for specified status codes', async () => {
    let i = 0
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(400)
        res.end()
      } else {
        res.end('ha')
      }
    })

    await new Promise(r => {
      server.listen(async () => {
        // @ts-ignore
        const { port } = server.address()

        const raw = await handleRetry(
          () => fetch(`http://127.0.0.1:${port}`),
          'GET',
          { codes: [400] }
        )
        const res = await raw.text()

        assert.equal(res, 'ha')

        server.close()

        r(0)
      })
    })
  })

  test('retries for specified methods', async () => {
    let i = 0
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(500)
        res.end()
      } else {
        res.end('ha')
      }
    })

    await new Promise(r => {
      server.listen(async () => {
        // @ts-ignore
        const { port } = server.address()

        const raw = await handleRetry(
          () => fetch(`http://127.0.0.1:${port}`),
          'POST',
          { methods: ['POST'] }
        )
        const res = await raw.text()

        assert.equal(res, 'ha')

        server.close()

        r(0)
      })
    })
  })

  test('works with timeout', async () => {
    const server = createServer((req, res) => {
      setTimeout(() => {
        res.end('ha')
      }, 1000)
    })

    await new Promise(r => {
      server.listen(async () => {
        // @ts-ignore
        const { port } = server.address()

        const request = () =>
          handleTimeout(fetch(`http://127.0.0.1:${port}`), 500)

        try {
          await handleRetry(request, 'GET', {})
        } catch (e) {
          assert.equal(e.name, 'HTTPTimeout')
        }

        server.close()

        r(0)
      })
    })
  })

  test('respects Retry-After header', async () => {
    let i = 0
    const server = createServer((req, res) => {
      if (i++ < 2) {
        res.writeHead(500, {
          'Retry-After': 1
        })
        res.end()
      } else {
        res.end('ha')
      }
    })

    await new Promise(r => {
      server.listen(async () => {
        // @ts-ignore
        const { port } = server.address()

        const then = Date.now()

        const raw = await handleRetry(
          () => fetch(`http://127.0.0.1:${port}`),
          'GET',
          {}
        )

        const now = Date.now()

        // retried too fast
        if (now - then < 1000) {
          throw Error('fail')
        }

        const res = await raw.text()

        assert.equal(res, 'ha')

        server.close()

        r(0)
      })
    })
  })
}
