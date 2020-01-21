# gretchen

Making fetch happen in Typescript. **1.1kb gzipped.**

## Features

- **safe:** does not throw
- **precise:** allows for typing of success & error response
- **resilient:** configurable retries & timeout
- **smart:** respects `Retry-After` header
- **small:** won't break your bundle

### Why?

There are a lot of options out there for requesting data. Most modern fetch
implementations, however, rely on throwing errors. For type-safety, we needed
something that would allow us to type the response, no matter what. We also
wanted to bake in a few opinions of our own, though the API should be flexible
enough for most other applications.

## Install

```
npm i @truework/gretchen --save
```

# Usage

```typescript
import gretch from "@truework/gretchen";

const res = await gretch<{ user: UserType }>("/my/api").json();

if (res.data) {
  console.log(res.data); // { user: ... }
}
```

### Credits

This library was inspired by [ky](https://github.com/sindresorhus/ky) and
[fetch-retry](https://github.com/zeit/fetch-retry).

### License

MIT License © [Truework](https://truework.com)

<br />

![cheap movie reference](https://user-images.githubusercontent.com/4732330/72651850-65698a00-394a-11ea-93ae-933aa5e44c47.png)
