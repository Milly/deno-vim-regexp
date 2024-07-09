# deno-vim-regexp

[![license:MIT](https://img.shields.io/github/license/Milly/deno-vim-regexp?style=flat-square)](LICENSE)
[![jsr](https://jsr.io/badges/@milly/vimregexp)](https://jsr.io/@milly/vimregexp)
[![Test](https://github.com/Milly/deno-vim-regexp/actions/workflows/test.yml/badge.svg)](https://github.com/Milly/deno-vim-regexp/actions/workflows/test.yml)
[![codecov](https://codecov.io/gh/Milly/deno-vim-regexp/graph/badge.svg?token=jygHYwOBbv)](https://codecov.io/gh/Milly/deno-vim-regexp)

This module provides a conversion from Vim's regular expression format to Javascript's RegExp.

## Example

```typescript
import { VimRegExp } from "@milly/vimregexp/regexp";
import { assert, assertFalse } from "@std/assert";

const regex = new VimRegExp(
  "\\k\\+",
  {
    iskeyword: "@,48-57,_,192-255",
    flags: "i",
  },
);

assert(regex.test("Foo"));
assertFalse(regex.test("!!!"));
```
