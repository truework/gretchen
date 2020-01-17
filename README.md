# gretchen

Making fetch happen in Typescript. **1.1kb gzipped.**

### Install

```
npm i @truework/gretchen --save
```

# Usage

```typescript
import gretch from "@truework/gretchen";

const res = await gretch<{ user: UserType }>("/my/api").json();

if (res.data) {
  console.log(res.data) // { user: ... }
}
```

### License

MIT License © [Truework](https://truework.com)
