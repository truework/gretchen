/* eslint-env node */
console.time("test");

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("esbuild-register/dist/node").register();

// eslint-disable-next-line @typescript-eslint/no-var-requires
const test = require("baretest")("gretchen");
// eslint-disable-next-line @typescript-eslint/no-var-requires
const assert = require("assert");
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("./utils.test").default(test, assert);
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("./handleRetry.test").default(test, assert);
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("./handleTimeout.test").default(test, assert);
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("./index.test").default(test, assert);
// eslint-disable-next-line @typescript-eslint/no-var-requires
require("./merge.test").default(test, assert);

process.on("unhandledRejection", (e) => {
  console.error(e);
  process.exit(1);
});

!(async function () {
  // eslint-disable-next-line @typescript-eslint/no-empty-function
  test.before(() => {});

  // eslint-disable-next-line @typescript-eslint/no-empty-function
  test.after(() => {});

  await test.run();

  console.timeEnd("test");
})();
