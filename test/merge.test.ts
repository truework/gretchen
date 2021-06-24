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

  test('overwrites values', () => {
    const o = merge(
      {
        timeout: 100,
        retry: {
          attempts: 3
        }
      },
      {
        timeout: 200,
        retry: false
      }
    )

    assert.equal(o.timeout, 200)
    assert.equal(o.retry, false)
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
