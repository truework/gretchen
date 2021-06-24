import { merge } from '../lib/merge'

export default (test, assert) => {
  test('merges primitives', () => {
    const o = merge(
      {
        str: 'in',
        bool: false,
        int: 0,
        arr: ['in'],
        obj: {
          prop: 'in'
        }
      },
      {
        str: 'out',
        bool: true,
        int: 1,
        arr: ['out'],
        obj: {
          prop: 'out'
        }
      }
    )

    assert.equal(o.str, 'out')
    assert.equal(o.bool, true)
    assert.equal(o.int, 1)
    assert.deepEqual(o.arr, ['in', 'out'])
    assert.equal(o.obj.prop, 'out')
  })

  test('merges headers', () => {
    const o = merge(
      {
        headers: new Headers({
          'X-In': 'in',
          'X-Header': 'in'
        })
      },
      {
        headers: {
          'X-Out': 'out',
          'X-Header': 'out'
        }
      }
    )

    assert.equal(o.headers['x-header'], 'out')
    assert.equal(o.headers['x-in'], 'in')
    assert.equal(o.headers['x-out'], 'out')
  })

  test('overwrites mixed values', () => {
    const o = merge(
      {
        timeout: 100,
        retry: false,
        hooks: {
          after () {}
        }
      },
      {
        timeout: 200,
        retry: {
          attempts: 3
        },
        hooks: {
          after: [() => {}]
        }
      }
    )

    assert.equal(o.timeout, 200)
    // @ts-ignore
    assert.equal(o.retry.attempts, 3)
    assert(Array.isArray(o.hooks.after))
  })

  test('merges hooks', () => {
    const o = merge(
      {
        hooks: {
          before () {}
        }
      },
      {
        hooks: {
          after () {}
        }
      }
    )

    assert(typeof o.hooks.before === 'function')
    assert(typeof o.hooks.after === 'function')
  })

  test('clones reference object', () => {
    const defaults = {
      prop: 'default'
    }

    const o = merge(defaults, {
      prop: 'out'
    })

    assert.equal(defaults.prop, 'default')
    assert.equal(o.prop, 'out')
  })
}
