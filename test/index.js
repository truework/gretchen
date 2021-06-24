console.time('test')

require('esbuild-register/dist/node').register()

const test = require('baretest')('gretchen')
const assert = require('assert')

require('./utils.test').default(test, assert)
require('./handleRetry.test').default(test, assert)
require('./handleTimeout.test').default(test, assert)
require('./index.test').default(test, assert)
require('./merge.test').default(test, assert)

process.on('unhandledRejection', e => {
  console.error(e)
  process.exit(1)
})

!(async function () {
  test.before(() => {})

  test.after(() => {})

  await test.run()

  console.timeEnd('test')
})()
