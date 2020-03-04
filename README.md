# gretchen ![npm](https://img.shields.io/npm/v/gretchen) [![](https://badgen.net/bundlephobia/minzip/gretchen)](https://bundlephobia.com/result?p=gretchen)

Making `fetch` happen in TypeScript.

> 🔎 This is beta software. We're using in production – ~6M requests/month – but
> your mileage may vary. However, if you'd like to try it out or contribute,
> we'd love that and we'd love to hear your thoughts.

## Features

- **safe:** will not throw on non-200 responses
- **precise:** allows for typing of both success & error responses
- **resilient:** configurable retries & timeout
- **smart:** respects `Retry-After` header
- **small:** won't break your bundle

### Install

```bash
npm i gretchen --save
```

### Browser support

`gretchen` targets all modern browsers. For IE11 support, you'll need to polyfill
`fetch`, `Promise`, and `Object.assign`. For Node.js, you'll need `fetch` and
`AbortController`.

### Quick links

- [Usage](#usage)
- [Making a request](#making-a-request)
  - [Options](#options)
  - [Retrying requests](#retrying-requests)
  - [Timeouts](#timeouts)
- [Response handling](#response-handling)
- [Hooks](#hooks)
- [Creating instances](#creating-instances)
- [Usage with TypeScript](#usage-with-typescript)
- [Why?](#why)
  - [Credits](#credits)
  - [License](#license)

# Usage

With `fetch`, you might do something like this:

```js
const request = await fetch("/api/user/12");
const user = await request.json();
```

With `gretchen`, it's very similar:

```js
import { gretch } from "gretchen";

const { data: user } = await gretch("/api/user/12").json();
```

👉 `gretchen` aims to provide just enough abstraction to provide ease of use
without sacrificing flexibility.

## Making a request

Using `gretchen` is very similar to using `fetch`. It too defaults to `GET`, and
sets the `credentials` header to `same-origin`.

```js
const request = gretch("/api/user/12");
```

To parse a response body, simply call any of the standard `fetch` [body interface
methods](https://developer.mozilla.org/en-US/docs/Web/API/Response#Body_Interface_Methods_2):

```js
const response = await request.json();
```

The slight diversion from native `fetch` here is to allow users to do this in
one shot:

```js
const response = await gretch("/api/user/12").json();
```

In addition to the _body interface methods_ you're familiar with, there's also a
`flush()` method. This resolves the request _without_ parsing the body (or
errors), which results in slight performance gains. This method returns a
slightly different response object, see below for more details.

```js
const response = await gretch("/api/user/authenticated").flush();
```

### Options

To make different types of requests or edit headers and other request config,
pass a options object:

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
    name: "Megan Rapinoe",
    occupation: "President of the United States"
  })
}).json();
```

For convenience, there’s also a `json` shorthand. We’ll take care of
stringifying the body and applying the `Content-Type` header:

```js
const response = await gretch("/api/user/12", {
  method: "PATCH",
  json: {
    email: "m.rapinoe@gmail.com"
  }
}).json();
```

#### Retrying requests

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

#### Timeouts

By default, `gretchen` will time out requests after 10 seconds and retry them, unless otherwise configured. To configure timeout, pass a value in milliseconds:

```js
const response = await gretch("/api/user/12", {
  timeout: 20000
}).json();
```

## Response handling

`gretchen`'s thin abstraction layer returns a specialized structure from a
request. In TypeScript terms, it employs a _discriminated union_ for ease of
typing. More on that later.

```js
const { url, status, error, data, response } = await gretch(
  "/api/user/12"
).json();
```

`url` and `status` here are what they say they are: properties of the `Response`
returned from the request.

#### `data`

If the response returns a `body` and you elect to parse it i.e. `.json()`, it
will be populated here.

#### `error`

And instead of throwing errors `gretchen` will populate the `error` prop with
any errors that occur **_or_** `body`ies returned from non-success (`4xx`)
responses.

Examples of `error` usage:

- a `/login` endpoint returns `401` and includes a message for the user
- an endpoint times out and an `HTTPTimeout` error is returned
- an unknown network error occurs during the request

#### `response`

`gretchen` also provides the full `response` object in case you need it.

#### Usage with `flush`

As mentioned above, `gretchen` also provides a `flush()` method to resolve a
request without parsing the body or errors. This results in a slightly different
response object.

```js
const { url, status, response } = await gretch(
  "/api/user/authenticated"
).flush();
```

## Hooks

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

## Creating instances

`gretchen` also exports a `create` method that allows you to configure default
options. This is useful if you want to attach something like logging to every
request made with the returned instance.

```js
import { create } from "gretchen";

const gretch = create({
  headers: {
    "X-Powered-By": "gretchen"
  },
  hooks: {
    after({ error }) {
      if (error) sentry.captureException(error);
    }
  }
});

await gretch("/api/user/12").json();
```

## Usage with TypeScript

`gretchen` is written in TypeScript and employs a _discriminated union_ to allow
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

There are a lot of options out there for requesting data. But most modern
`fetch` implementations rely on throwing errors. For type-safety, we wanted
something that would allow us to type the response, no matter what. We also
wanted to bake in a few opinions of our own, although the API is flexible enough
for most other applications.

### Credits

This library was inspired by [ky](https://github.com/sindresorhus/ky) and
[fetch-retry](https://github.com/zeit/fetch-retry) and others.

### License

MIT License © [Truework](https://truework.com)

<br />

![cheap movie reference](https://user-images.githubusercontent.com/4732330/73581652-928c6100-444f-11ea-8796-7cdc77271d06.png)
