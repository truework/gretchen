# gretchen ![npm](https://img.shields.io/npm/v/@truework/gretchen) [![](https://badgen.net/bundlephobia/minzip/@truework/gretchen)](https://bundlephobia.com/result?p=@truework/gretchen)

Making `fetch` happen in Typescript.

> ⚠️ This is beta software, and it might not be ready for production use just
> yet. However, if you'd like to try it out or contribute, we'd love that and
> we'd love to hear your thoughts.

## Features

- **safe:** will not throw on non-200 responses
- **precise:** allows for typing of both success & error responses
- **resilient:** configurable retries & timeout
- **smart:** respects `Retry-After` header
- **small:** won't break your bundle

### Install

```bash
npm i @truework/gretchen --save
```

### Browser Support
`gretchen` targets all modern browsers. For IE11 support, you'll need to polyfill
`fetch`, `Promise`, and `Object.assign`. For Node.js, you'll need `fetch` and
`AbortController`.

# Usage

Basic usage looks a lot like `window.fetch`:

```js
import { gretch } from "@truework/gretchen";

const request = gretch("/api/user/12");
```

The request will be made immediately, but to await the response and consume any
response data, use any of the standard `fetch` [body interface
methods](https://developer.mozilla.org/en-US/docs/Web/API/Response#Body_Interface_Methods_2):

```js
const response = await request.json();
```

`gretchen` responses are somewhat special. In Typescript terms, they employ a
_discriminated union_ to allow you to type and consume both the success and
error responses returned by your API.

In a successful response, the object will look something like this:

```js
{
  url: string,
  status: number,
  data: object, // Response body
  error: undefined,
}
```

And for an error response it will look something like this:

```js
{
  url: string,
  status: number,
  data: undefined,
  error: object, // Response body, or an Error
}
```

## Config

`gretchen` defaults to `GET` requests, and sets `credentials` to `same-origin`.

To make different types of requests, or edit headers and other request config,
pass a config object:

```js
const response = await gretch("/api/user/12", {
  credentials: "include",
  headers: {
    "Tracking-ID": "abcde12345"
  }
}).json();
```

Configuring requests bodies should look familiar as well:

```js
const response = await gretch("/api/user/12", {
  method: "PATCH",
  body: JSON.stringify({
    email: `m.rapinoe@gmail.com`
  })
}).json();
```

For convenience, there’s also a `json` shorthand. We’ll take care of
stringifying the body:

```js
const response = await gretch("/api/user/12", {
  method: "PATCH",
  json: {
    name: "Megan Rapinoe",
    occupation: "President of the United States"
  }
}).json();
```

### Resilience

`gretchen` will automatically attempt to retry _some_ types of requests if they
return certain error codes. Below are the configurable options and their
defaults:

- `attempts` - a `number` of retries to attempt before failing. Defaults to `2`.
- `codes` - an `array` of `number` status codes that indicate a retry-able
  request. Defaults to `[ 408, 413, 429 ]`.
- `methods` - an `array` of `string`s indicating which request methods should be
  retry-able. Defaults to `[ "GET" ]`.
- `delay` - a `number` in milliseconds used to exponentially back-off the delay
  time between requests. Defaults to `6`. Example: first delay is 6ms, second
  36ms, third 216ms, and so on.

These options can be set using the configuration object:

```js
const response = await gretch("/api/user/12", {
  retry: {
    attempts: 3
  }
}).json();
```

### Timeouts

By default, `gretchen` will time out requests after 10 seconds and retry them, unless otherwise configured. To configure timeout, pass a value in milliseconds:

```js
const response = await gretch("/api/user/12", {
  timeout: 20000
}).json();
```

### Hooks

`gretchen` uses the concept of "hooks" to tap into the request lifecycle. Hooks
are good for code that needs to run on every request, like adding tracking
headers and logging errors.

#### `before`

The `before` hook runs just prior to the request being made. You can even modify
the request directly, like to add headers. The `before` hook is passed the `Request`
object, and the full options object.

```js
const response = await gretch("/api/user/12", {
  hooks: {
    before(request, options) {
      request.headers.set("Tracking-ID", "abcde");
    }
  }
}).json();
```

#### `after`

The `after` hook has the opportunity to read the `gretchen` response. It
_cannot_ modify it. This is mostly useful for logging.

```js
const response = await gretch("/api/user/12", {
  hooks: {
    after({ url, status, data, error }) {
      sentry.captureMessage(`${url} returned ${status}`);
    }
  }
}).json();
```

## Instances

`gretchen` also exports a `create` method that allows you to configure default
options. This is useful if you want to attach something like logging to every
request made with the returned instance.

```js
import { create } from "@truework/gretchen";

const gretch = create({
  headers: {
    "X-Powered-By": "@truework/gretchen"
  },
  hooks: {
    after({ error }) {
      if (error) sentry.captureException(error);
    }
  }
});

await gretch("/api/user/12").json();
```

## Usage with Typescript

`gretchen` is written in Typescript and employs a _discriminated union_ to allow
you to type and consume both the success and error responses returned by your
API.

To do so, pass your data types directly to the `gretch` call:

```typescript
type Success = {
  name: string;
  occupation: string;
};

type Error = {
  code: number;
  errors: string[];
};

const response = await gretch<Success, Error>("/api/user/12").json();
```

Then, you can safely use the responses:

```typescript
if (response.error) {
  const {
    code, // number
    errors // array of strings
  } = response.error; // typeof Error
} else if (response.data) {
  const {
    name, // string
    occupation // string
  } = response.data; // typeof Success
}
```

# Why?

There are a lot of options out there for requesting data. Most modern `fetch`
implementations, however, rely on throwing errors. For type-safety, we wanted
something that would allow us to type the response, no matter what. We also
wanted to bake in a few opinions of our own, although the API is flexible enough
for most other applications.

# Credits

This library was inspired by [ky](https://github.com/sindresorhus/ky) and
[fetch-retry](https://github.com/zeit/fetch-retry).

### License

MIT License © [Truework](https://truework.com)

<br />

![cheap movie reference](https://user-images.githubusercontent.com/4732330/73581652-928c6100-444f-11ea-8796-7cdc77271d06.png)
