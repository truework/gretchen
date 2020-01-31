# gretchen

Making fetch happen in Typescript. **1.1kb gzipped.**

## Features

- **safe:** will not throw on errors
- **precise:** allows for typing of both success & error responses
- **resilient:** configurable retries & timeout
- **smart:** respects `Retry-After` header
- **small:** won't break your bundle

### Why?

There are a lot of options out there for requesting data. Most modern fetch
implementations, however, rely on throwing errors. For type-safety, we needed something that would allow us to type the response, no matter what. We also wanted to bake in a few opinions of our own, though the API should be flexible enough for most other applications.

## Install

```
npm i @truework/gretchen --save
```

# Usage

Basic usage looks a lot like `window.fetch`:

```js
import gretch from "@truework/gretchen";

const request = gretch("/api/user/12");
```

The request will be made immediately. To await its return and consume any response data, call one of the MIME-type handlers returned from the initial `gretch` call:

```js
const response = await request.json();
```

Responses are somewhat special. In Typescript terms, they employ a _discriminated union_ to allow you to type and consume both the success and error responses returned by your API.

In a successful response, the object will look something like this:

```js
{
	status: 200,
	data: {}, // or whatever your data is
  error: undefined,
}
```

And for an error response it will look something like this:

```js
{
	status: 400,
	data: undefined,
  error: {}, // an Error, or other data returned by your API
}
```

## Config

`gretchen` defaults to `GET` requests, and sets `credentials` to `same-origin`.

To make different types of requests, or edit headers and other request config, pass a config object:

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

For convenience, there’s also a `json` shorthand. We’ll take care of stringifying the body:

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

`gretchen` will automatically attempt to retry _some_ types of requests if they return certain error codes. Below are the configurable options and their defaults:

- `attempts` - a `number` of retries to attempt before failing. Defaults to `2`.
- `codes` - an `array` or `number` status codes that indicate a retry-able request. Defaults to `[ 408, 413, 429 ]`.
- `methods` - an `array` of `string`s indicating which request methods should be retry-able. Defaults to `[ ‘GET’ ]`.
- `delay` - a `number` used to exponentially back-off the delay time between requests. Defaults to `6`. Example: first delay is 6ms, second 36ms, third 216ms, and so on.

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

## Usage with Typescript

`gretchen` is written in Typescript and employs a _discriminated union_ to allow you to type and consume both the success and error responses returned by your API.

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

# Credits

This library was inspired by [ky](https://github.com/sindresorhus/ky) and
[fetch-retry](https://github.com/zeit/fetch-retry).

### License

MIT License © [Truework](https://truework.com)

<br />

![cheap movie reference](https://user-images.githubusercontent.com/4732330/72651850-65698a00-394a-11ea-93ae-933aa5e44c47.png)
