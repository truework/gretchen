import { GretchOptions, MergeableObject } from "../index";

function headersToObj(headers: Headers) {
  const o = {};

  headers.forEach((v, k) => {
    o[k] = v;
  });

  return o;
}

export function merge(
  a: MergeableObject = {},
  b: MergeableObject = {}
): GretchOptions {
  const c = { ...a };

  for (const k of Object.keys(b)) {
    const v = b[k];

    if (typeof v === "object") {
      if (k === "headers") {
        c[k] = merge(
          headersToObj(new Headers(a[k])),
          headersToObj(new Headers(v))
        );
      } else if (v.pop && a[k].pop) {
        c[k] = [...(a[k] || []), ...v];
      } else if (typeof a[k] === "object" && !a[k].pop) {
        c[k] = merge(a[k], v);
      } else {
        c[k] = v;
      }
    } else {
      c[k] = v;
    }
  }

  return c;
}
