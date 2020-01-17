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

<br />

![cheap movie reference](https://user-images.githubusercontent.com/4732330/72651850-65698a00-394a-11ea-93ae-933aa5e44c47.png)

### License

MIT License © [Truework](https://truework.com)
