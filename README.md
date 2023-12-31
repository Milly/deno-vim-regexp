# deno-vim-regexp

[![license:MIT](https://img.shields.io/github/license/Milly/deno-vim-regexp?style=flat-square)](LICENSE)
[![deno land](http://img.shields.io/badge/available%20on-deno.land/x/vim__regexp-lightgrey.svg?logo=deno)](https://deno.land/x/vim_regexp)
[![Test](https://github.com/Milly/deno-vim-regexp/actions/workflows/test.yml/badge.svg)](https://github.com/Milly/deno-vim-regexp/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/Milly/deno-vim-regexp/branch/master/graph/badge.svg?token=jygHYwOBbv)](https://codecov.io/gh/Milly/deno-vim-regexp)

This module provides a conversion from Vim's regular expression format to Javascript's RegExp.

## Example

```typescript
import { VimRegExp } from "https://deno.land/x/vim_regexp@VERSION/regexp.ts";

const regex = new VimRegExp(
  "\\k\\+",
  {
    iskeyword: "@,48-57,_,192-255",
    flags: "i",
  },
);

console.log(regex.test("Foo")); // Output: true
console.log(regex.test("!!!")); // Output: false
```
