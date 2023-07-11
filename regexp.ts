/**
 * This module provides Vim's regular expression.
 *
 * @module
 */

import { DEFAULT_CHAR_PATTERNS, patternToCharClass, PatternType } from "./charclass.ts";
import { UnsupportedSyntaxError, VimRegExpSyntaxError } from "./errors.ts";

export type VimRegExpOptions = {
  /**
   * Optional flags that allow for functionality like global searching.
   * These flags can be used separately or together in any order.
   *
   * | Flag | Description                             | Corresponding property |
   * | ---- | --------------------------------------- | ---------------------- |
   * | "d"  | Generate indices for substring matches. | hasIndices             |
   * | "g"  | Global search.                          | global                 |
   * | "i"  | Case-insensitive search.                | ignoreCase             |
   * | "y"  | Perform a "sticky" search that matches. | sticky                 |
   *
   * Note that the "s" and "v" flag is always specified.  Also, the "m" and "u"
   * flags cannot be specified by the user.
   */
  flags?: string;

  /**
   * The characters specified by this option are included in file names and
   * path names.  Filenames are used for commands like "gf", "[i" and in
   * the tags file.  It is also used for "\f" in a `pattern`.
   * Multi-byte characters 256 and above are always included, only the
   * characters up to 255 are specified with this option.
   * For UTF-8 the characters 0xa0 to 0xff are included as well.
   *
   * (default `"@,48-57,/,.,-,_,+,,,#,$,%,~,="`)
   */
  isfname?: string;

  /**
   * The characters given by this option are included in identifiers.
   * It is also used for "\i" in a `pattern`.  See `isfname` for a
   * description of the format of this option.  For '@' only characters up
   * to 255 are used.
   *
   * (default `"@,48-57,_,192-255"`)
   */
  isident?: string;

  /**
   * Keywords are used in searching and recognizing with many commands:
   * "w", "#", "[i", etc.  It is also used for "\k" in a `pattern`.  See
   * `isfname` for a description of the format of this option.  For '@'
   * characters above 255 check the "word" character class (any character
   * that is not white space or punctuation).
   *
   * (default `"@,48-57,_,192-255"`)
   */
  iskeyword?: string;

  /**
   * The characters given by this option are displayed directly on the screen.
   * It is also used for "\p" in a `pattern`.  See `isfname` for a description
   * of the format of this option.
   *
   * Multi-byte characters 256 and above are always included, only the
   * characters up to 255 are specified with this option.
   *
   * (default `"@,161-255"`)
   */
  isprint?: string;

  /**
   * Changes the special characters that can be used in search patterns.
   * (default `true`)
   */
  magic?: boolean;

  /**
   * Ignore case in search patterns.  (default `false`)
   *
   * Also see `smartcase`.  Can be overruled by using "\c" or "\C" in the
   * pattern.  Also overruled by using "i" flag in the `flags` option.
   *
   * Hierarchy of overrides:
   *   1. "i" in `flags` option
   *   2. "\c" or "\C" in pattern
   *   3. `ignorecase` option
   */
  ignorecase?: boolean;

  /**
   * Override the `ignorecase` option if the search pattern contains upper
   * case characters.  (default `false`)
   *
   * Only used when the search pattern is typed and `ignorecase` option is on.
   */
  smartcase?: boolean;

  /**
   * Enable string-match mode.  (default `false`)
   *
   * A Vim's regexp pattern is normally used to find a match in the buffer
   * lines.  When a pattern is used to find a match in a String, almost
   * everything works in the same way.  The difference is that a String is
   * handled like it is one line.  When it contains a "\n" character, this
   * is not seen as a line break for the pattern.  It can be matched with
   * a "\n" in the pattern, or with ".".
   *
   * Don't forget that "^" will only match at the first character of the
   * String and "$" at the last character of the string.  They don't match
   * after or before a "\n".
   *
   * @example
   * ```ts
   * import { VimRegExp } from "https://deno.land/x/vim_regexp@VERSION/regexp.ts";
   *
   * const lines = "aaaa\nxxxx";
   * const regexBuffer = new VimRegExp("^..");
   * console.log(
   *   [...lines.matchAll(regexBuffer)].map(([v]) => v),
   * ); // Output: ["aa", "xx"]
   * const regexString = new VimRegExp("^..", { stringMatch: true });
   * console.log(
   *   [...lines.matchAll(regexString)].map(([v]) => v),
   * ); // Output: ["aa"]
   * ```
   */
  stringMatch?: boolean;
};

/**
 * Represents a Vim's regular expression.
 */
export class VimRegExp extends RegExp {
  /**
   * Returns `true` if an object is a `RegExp`.
   *
   * @param obj - Object to check.
   * @returns Whether the object is a `RegExp` object.
   */
  static isRegExp(obj: unknown): obj is RegExp {
    return Object.prototype.toString.call(obj) === "[object RegExp]";
  }

  #options: Required<VimRegExpOptions>;
  #vimSource: string;

  /**
   * Creates a new instance of the VimRegExp class.
   *
   * Always parsed with Vim's `magic` options is set.
   * Only some Vim regular expressions can be parsed.
   *
   * @param pattern - Vim's regular expression pattern, or an object of VimRegExp.
   * @param options - The options or the flags.
   *
   * @throws VimRegExpSyntaxError
   * Thrown if `pattern` is invalid format.
   * Thrown if `options` contains invalid value.
   *
   * @example
   * ```ts
   * import { VimRegExp } from "https://deno.land/x/vim_regexp@VERSION/regexp.ts";
   *
   * const regex = new VimRegExp("\\k\\+", { flags: "i" });
   * console.log(regex.vimSource); // Output: "\\k\\+"
   * console.log(regex.test("Foo")); // Output: true
   * console.log(regex.test("!!!")); // Output: false
   * ```
   */
  // deno-lint-ignore constructor-super
  constructor(
    pattern: string | VimRegExp,
    options: VimRegExpOptions | string = {},
  ) {
    const [srcObj, vimSource] = pattern instanceof VimRegExp
      ? [pattern, pattern.#vimSource]
      : [undefined, pattern];
    const mergedOptions = {
      ...DEFAULT_CHAR_PATTERNS,
      magic: true,
      ignorecase: false,
      smartcase: false,
      stringMatch: false,
      ...(srcObj && srcObj.#options),
      flags: "",
      ...(typeof options === "string" ? { flags: options } : options),
    };
    try {
      const { source, flags } = parseVimPattern(vimSource, mergedOptions);
      super(source, flags);
    } catch (cause) {
      // Re-throw or wrap known errors.
      if (cause instanceof VimRegExpSyntaxError) {
        throw cause;
      }
      if (cause instanceof SyntaxError) {
        throw new VimRegExpSyntaxError(cause.message, { source: vimSource, cause });
      }
      // Re-throw unknown errors.
      throw cause;
    }
    this.#options = mergedOptions;
    this.#vimSource = vimSource;
  }

  /**
   * Returns a copy of the text of the Vim's regular expression pattern.
   */
  get vimSource(): string {
    return this.#vimSource;
  }

  /**
   * Returns a copy of the options of the VimRegExp.
   */
  get options(): VimRegExpOptions {
    return { ...this.#options };
  }
}

type EscapeChar = keyof typeof ESCAPE_CHARS;

const ESCAPE_CHARS = {
  e: "\\x1b",
  t: "\\t",
  r: "\\r",
  b: "\\x08",
  n: "\\n",
} as const;

type CharClassKey = keyof typeof SINGLE_CHAR_CLASSES;

const [SINGLE_CHAR_NORMAL, SINGLE_CHAR_WITH_LF] = [0, 1];
const SINGLE_CHAR_CLASSES = {
  s: ["[ \\t]", "[ \\t\\n]"],
  S: ["[^ \\t\\n]", "[^ \\t]"],
  d: ["[0-9]", "[0-9\\n]"],
  D: ["[^0-9\\n]", "[^0-9]"],
  x: ["[0-9A-Fa-f]", "[0-9A-Fa-f\\n]"],
  X: ["[^0-9A-Fa-f\\n]", "[^0-9A-Fa-f]"],
  o: ["[0-7]", "[0-7\\n]"],
  O: ["[^0-7\\n]", "[^0-7]"],
  w: ["[0-9A-Za-z_]", "[0-9A-Za-z_\\n]"],
  W: ["[^0-9A-Za-z_\\n]", "[^0-9A-Za-z_]"],
  h: ["[A-Za-z_]", "[A-Za-z_\\n]"],
  H: ["[^A-Za-z_\\n]", "[^A-Za-z_]"],
  a: ["[A-Za-z]", "[A-Za-z\\n]"],
  A: ["[^A-Za-z\\n]", "[^A-Za-z]"],
  l: ["[[a-z]--[A-Z]]", "[a-z\\n]"],
  L: ["[^a-z\\n]", "[^a-z]"],
  u: ["[[A-Z]--[a-z]]", "[A-Z\\n]"],
  U: ["[^A-Z\\n]", "[^A-Z]"],
} as const satisfies Record<string, readonly [normal: string, withLF: string]>;

type CharClassName = keyof typeof NAMED_CHAR_CLASSES;
type NullCharClassName = {
  [K in CharClassName]: typeof NAMED_CHAR_CLASSES[K] extends null ? K : never;
}[CharClassName];

const NAMED_CHAR_CLASSES = {
  alnum: "[0-9A-Za-z]",
  alpha: "[A-Za-z]",
  backspace: "\\x08",
  blank: "[ \\t]",
  cntrl: "[\\x00-\\x1f\\x7f]",
  digit: "[0-9]",
  escape: "\\x1b",
  fname: null, // isfname
  graph: "[!-~]",
  ident: null, // isident
  keyword: null, // iskeyword
  lower: "\\p{Ll}", // not exactly same as Vim
  print: null, // isprint
  punct: "[[!-~]--[0-9A-Za-z]]",
  return: "\\r",
  space: "[\\t-\\r ]",
  tab: "\\t",
  upper: "\\p{Lu}", // not exactly same as Vim
  xdigit: "[0-9A-Fa-f]",
} as const;

/** Matches characters that need to be escaped in collection when using `v` flag. */
const reUnicodeSetSpecialChars = /[-!#$%&()*+,./:;<=>?@\[\]^`{|}~]/u;
/** Matches the numeric part of '\d123' */
const reDecimalChar = /^[0-9]+/u;
/** Matches the numeric part of '\o40' */
const reOctalChar = /^(?:[0-3][0-7]{0,2}|[4-7][0-7]?)/u;
/** Matches the numeric part of '\x20' */
const reHexadecimalChar = /^[0-9a-fA-F]{1,2}/u;
/** Matches the numeric part of '\u20AC' */
const reUnicodeChar = /^[0-9a-fA-F]{1,4}/u;
/** Matches the numeric part of '\U1234abcd' */
const reLongUnicodeChar = /^[0-9a-fA-F]{1,8}/u;
/** Matches a character class '[:alnum:]' */
const reNamedCharClass = new RegExp(`\\[:(?:${Object.keys(NAMED_CHAR_CLASSES).join("|")}):\\]`);
/** Matches a equivalence class '[=a=]' */
const reEquivalenceClass = /\[=.=\]/u;
/** Matches a collation element '[.a.]' */
const reCollationElement = /\[\..\.\]/u;
/** Matches a escaped character in collection. */
const reEscapedChar = new RegExp(
  `\\\\(?:d${reDecimalChar.source.slice(1 /* remove '^' */) // \d123
  }|o${reOctalChar.source.slice(1 /* remove '^' */) // \o40
  }|x${reHexadecimalChar.source.slice(1 /* remove '^' */) // \x20
  }|u${reUnicodeChar.source.slice(1 /* remove '^' */) // \u20AC
  }|U${reLongUnicodeChar.source.slice(1 /* remove '^' */) // \U1234abcd
  }|.)`, // \x
  "u",
);
/** Matches a character range in collection. */
const reCharacterRange = new RegExp(
  `(?<start>${/^[-\]]/.source // '-' or ']' is allowed at beginning of sequence
  }|${/[^-\]\\]/.source // any single character except '-', ']' or '\'
  }|${reEscapedChar.source})-(?<end>${reEscapedChar.source}|.)`,
  "u",
);
/** Matches a collection range. No contains beginning '['. Contains trailing ']'. */
const reCollection = new RegExp(
  `^\\^?\\]?(?:\\\\.|${reNamedCharClass.source // '[:' CharClass ':]'
  }|${reEquivalenceClass.source // '[=' char '=]'
  }|${reCollationElement.source // '[.' char '.]'
  }|[^\\]])*\\]`,
  "u",
);
/** Matches a set of normal and special part in collection. */
const reCollectionYield = new RegExp(
  `(?<normal>.*?)(?<special>${reCharacterRange.source // <start> '-' <end>
  }|${reEscapedChar.source // backslash ...
  }|${reNamedCharClass.source // '[:' CharClass ':]'
  }|${reEquivalenceClass.source // '[=' char '=]'
  }|${reCollationElement.source // '[.' char '.]'
  }|${reUnicodeSetSpecialChars.source}|$)`,
  "gyu",
);

function parseVimPattern(source: string, options: Required<VimRegExpOptions>) {
  if (/[mu]/.test(options.flags)) {
    // Allows the "s" or "v" flag here. Because the matchAll method passes
    // the original flags to the constructor when cloning the object.
    throw new VimRegExpSyntaxError(
      `Invalid flags supplied to VimRegExp constructor '${options.flags}'`,
      { source: options.flags },
    );
  }

  const [VERY_MAGIC, MAGIC, NOMAGIC, VERY_NOMAGIC] = [1, 2, 3, 4];
  const { stringMatch } = options;
  /** Current `magic` state. */
  let magic = options.magic ? MAGIC : NOMAGIC;
  /** Current `ignorecase` state. */
  let ignorecase = options.ignorecase &&
    !(options.smartcase && /^(?:\\.|[^\\])*?\p{Lu}/u.test(source));

  /** Result pattern buffer. */
  const resPattern: string[] = [];
  const push = (...items: string[]) => resPattern.push(...items);

  /** The starting index of the current group in the result buffer.
   *
   * - Push stack when new block is started.
   * - Pop stack when current block is closed.
   *
   *     foofoo(barbar(bazbaz|quxqux)quux)
   *     ^     ^      ^             ^    ^
   *     []    [6]    [6,13]        [6]  []
   */
  const groupIndices: number[] = [];
  /** The starting index of the last group in the result buffer.
   *
   * - Save trailing value of `groupIndices` when pop it.
   */
  let lastGroupIndex: number | undefined;
  /** The starting index of the current concat in the result buffer.
   *
   * - Push stack when new block is started.
   * - Pop stack when current block is closed.
   * - Replace last when new concat is started.
   *
   *     foofoo|barbar(bazbaz&quxqux)quux
   *     ^      ^      ^      ^      ^
   *     [0]    [7]    [7,14] [7,21] [7]
   */
  const concatIndices: number[] = [0];

  /** Last index of undetermined '$' that is EOL or literal. */
  let maybe$Index: number | undefined;
  const correct$ToLiteral = () => {
    if (typeof maybe$Index !== "undefined" && maybe$Index < resPattern.length - 1) {
      resPattern[maybe$Index] = "\\$";
    }
    maybe$Index = undefined;
  };

  /** Input pattern buffer. */
  const vimPattern = [...source];
  /** The index to parse next in the input buffer. */
  let index = 0;
  /** The starting index of the current atom in the input buffer. */
  let atomIndex = 0;
  type Match = RegExpMatchArray & { index: number };
  const maybeNext: {
    (r: RegExp): Match | undefined;
    <T>(r: RegExp, parser: (m: Match) => T): T | undefined;
  } = <T>(r: RegExp, parser?: (m: Match) => T): T | Match | undefined => {
    const m = vimPattern.slice(index).join("").match(r);
    if (m) {
      if (m.index !== 0) {
        throw new Error("Implementation error: Must match at the lead");
      }
      try {
        const res = parser ? parser(m as Match) : m as Match;
        index += [...m[0]].length;
        return res;
      } catch (_) { /* Ignore error */ }
    }
  };
  const ensureNext: {
    (r: RegExp): Match;
    <T>(r: RegExp, parser: (m: Match) => T): T;
  } = <T>(r: RegExp, parser?: (m: Match) => T): T | Match => {
    const res = maybeNext(r, ...(parser ? [parser] : []) as []);
    if (res === undefined) {
      throw new VimRegExpSyntaxError("Invalid keyword", { source, index: atomIndex });
    }
    return res;
  };
  const getAtom = () => vimPattern.slice(atomIndex, index).join("");

  const toCharCode = (n: number, fallback = ""): string => {
    if (n <= 0xff) {
      return (`\\x${(n.toString(16).padStart(2, "0"))}`);
    } else if (n <= 0xffff) {
      return (`\\u${(n.toString(16).padStart(4, "0"))}`);
    } else if (n <= 0x10ffff) {
      return (`\\u{${(n.toString(16))}}`);
    } else {
      return fallback;
    }
  };

  const getCharClass = (type: PatternType) => {
    return patternToCharClass(options[type], { type });
  };

  const parseEscapedCharInCollection = (s: string): string => {
    if (s[0] === "\\") {
      const escaped = ESCAPE_CHARS[s.slice(1) as EscapeChar];
      if (escaped) {
        return escaped;
      }
      switch (s[1]) {
        case "d": // \d123
          return toCharCode(parseInt(s.slice(2)));
        case "o": // \o40
          return toCharCode(parseInt(s.slice(2), 8));
        case "x": // \x20
        case "u": // \u20AC
        case "U": // \U1234abcd
          return toCharCode(parseInt(s.slice(2), 16));
      }
      // TODO: throws error?
      return "\\\\" + toCharCode(s.charCodeAt(1));
    }
    if (s.length !== 1) {
      throw new Error(`Implementation error: Must be single character: ${s}`);
    }
    if (reUnicodeSetSpecialChars.test(s)) {
      return toCharCode(s.charCodeAt(0));
    }
    return s;
  };

  const parseCollection = (collection: string): string => {
    const [inverse, rest] = collection.startsWith("^")
      ? ["^", collection.slice(1)]
      : ["", collection];
    return inverse + rest.replaceAll(reCollectionYield, (...args) => {
      const {
        normal,
        special,
        start,
        end,
      } = args.at(-1) as NonNullable<RegExpMatchArray["groups"]>;
      if (special === "") { // sequence closed
        return normal;
      }
      if (start && end) { // character range
        return normal + parseEscapedCharInCollection(start) + "-" +
          parseEscapedCharInCollection(end);
      }
      if (special[0] === "[") {
        switch (special[1]) {
          case ":": { // named class '[:alnum:]'
            const name = special.slice(2, -2) as CharClassName;
            return normal +
              (NAMED_CHAR_CLASSES[name] ??
                getCharClass(`is${name as NullCharClassName}`));
          }
          case "=": // equivalence class '[=a=]'
            throw new UnsupportedSyntaxError("[[=a=]]", {
              source,
              index: atomIndex,
            });
          case ".": // collation element '[.a.]'
            throw new UnsupportedSyntaxError("[[.a.]]", {
              source,
              index: atomIndex,
            });
        }
      }
      return normal + parseEscapedCharInCollection(special);
    });
  };

  const hasAtom = () => concatIndices.at(-1)! < resPattern.length;
  const assertRepeatable = () => {
    if (!hasAtom()) {
      throw new VimRegExpSyntaxError(
        `Nothing to repeat: ${getAtom()}`,
        { source, index: atomIndex },
      );
    }
  };

  while (index < vimPattern.length) {
    // Save the starting index of the current atom.
    atomIndex = index;

    // If backslash exists increment index.
    const backslash = vimPattern[index] === "\\";
    backslash && ++index;

    // Parse quantifier.
    const quantifier = maybeNext(/^[*+=?{@]/);
    if (quantifier) {
      switch (quantifier[0]) {
        case "*":
          if (backslash ? magic >= NOMAGIC : (magic <= MAGIC && hasAtom())) { // /star
            push("*");
          } else { // literal '*'
            push("\\*");
          }
          break;
        case "+":
          if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\+
            assertRepeatable();
            push("+");
          } else { // literal '+'
            push("\\+");
          }
          break;
        case "=":
          if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\=
            assertRepeatable();
            push("?");
          } else { // literal '='
            push("=");
          }
          break;
        case "?":
          if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\?
            assertRepeatable();
            push("?");
          } else { // literal '?'
            push("\\?");
          }
          break;
        case "{":
          if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\{
            assertRepeatable();
            const p = ensureNext(/^(?<ng>-)?(?<min>[0-9]+)?(?<comma>,)?(?<max>[0-9]+)?}/);
            if (!p) {
              throw new VimRegExpSyntaxError(
                `Incomplete quantifier: ${getAtom()}`,
                { source, index: atomIndex },
              );
            }
            const { ng, min, comma, max } = p.groups!;
            if (!min && !max) {
              push(`*${ng ? "?" : ""}`);
            } else if (min && max) {
              push(`{${Math.min(parseInt(min), parseInt(max))},${max}}${ng ? "?" : ""}`);
            } else if (comma) {
              push(`{${min ?? "0"},${max ?? ""}}${ng ? "?" : ""}`);
            } else {
              push(`{${min}}`);
            }
          } else { // literal '{'
            push("\\{");
          }
          break;
        case "@":
          if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\@= etc...
            assertRepeatable();
            if (vimPattern[index] === ">") {
              throw new UnsupportedSyntaxError("\\@>", {
                source,
                index: atomIndex,
              });
            }
            const n = maybeNext(/^[0-9]+/);
            const p = ensureNext(/^<?[=!]/)?.[0];
            if (n) {
              // console.warn(
              //   new UnsupportedSyntaxError(`\\@${n[0]}${p}`, { source, index }),
              // );
            }
            if (resPattern.at(-1) === ")") {
              resPattern[lastGroupIndex!] = `(?${p}`;
            } else {
              resPattern.splice(-1, 0, `(?${p}`);
              push(")");
            }
          } else { // literal '@'
            push("@");
          }
          break;
      }
      continue;
    }

    const c = vimPattern[index++];
    switch (c) {
      case "\\":
        push("\\\\");
        break;
      case "^":
        if (backslash ? magic >= VERY_NOMAGIC : magic <= NOMAGIC) { // /^
          if (hasAtom()) {
            if ((["\n", "\\n", "\\x0a"] as string[]).includes(resPattern.at(-1)!)) {
              push(stringMatch ? "^" : "(?:)");
            } else { // literal '^'
              push("\\^");
            }
          } else {
            push(stringMatch ? "^" : "(?:^|(?<=\\n))");
          }
        } else { // literal '^'
          push("\\^");
        }
        break;
      case "$":
        if (backslash ? magic >= VERY_NOMAGIC : magic <= NOMAGIC) { // /$
          // Save index of EOL '$'. It is determined when the block is closed.
          maybe$Index = resPattern.length;
          push(stringMatch ? "$" : "(?:(?=\\n)|$)");
        } else { // literal '$'
          push("\\$");
        }
        break;
      case ".":
        push((backslash ? magic >= NOMAGIC : magic <= MAGIC) ? "[^\\n]" : "\\.");
        break;
      case "<": {
        const word = getCharClass("iskeyword");
        push(`(?<!${word})(?=${word})`);
        break;
      }
      case ">": { // \>
        const word = getCharClass("iskeyword");
        push(`(?<=${word})(?!${word})`);
        break;
      }
      case "~":
        if (backslash ? magic >= NOMAGIC : magic <= MAGIC) { // /~
          throw new UnsupportedSyntaxError("~", { source, index: atomIndex });
        } else { // literal '~'
          push("~");
        }
        break;
      case "(":
        if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\(
          groupIndices.push(resPattern.length);
          push("(");
          concatIndices.push(resPattern.length);
        } else { // literal '('
          push("\\(");
        }
        break;
      case ")":
        if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\)
          if ((lastGroupIndex = groupIndices.pop()) === undefined) {
            throw new VimRegExpSyntaxError("Unmatched '\\)'", { source, index: atomIndex });
          }
          concatIndices.pop();
          correct$ToLiteral();
          push(")");
        } else { // literal ')'
          push("\\)");
        }
        break;
      case "|":
        if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\|
          correct$ToLiteral();
          push("|");
          concatIndices.splice(-1, 1, resPattern.length);
        } else { // literal '|'
          push("\\|");
        }
        break;
      case "&":
        if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) { // /\&
          correct$ToLiteral();
          resPattern.splice(concatIndices.pop()!, 0, "(?=");
          push(")");
          concatIndices.push(resPattern.length);
        } else { // literal '&'
          push("&");
        }
        break;
      case "%":
        if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) {
          switch (vimPattern[index++]) {
            case "(": // /\%(
              groupIndices.push(resPattern.length);
              push("(?:");
              concatIndices.push(resPattern.length);
              break;
            case "^": // /\%^
              push("^");
              break;
            case "$": // /\%$
              push("$");
              break;
            case "d": // /\%d123
              push(ensureNext(reDecimalChar, ([s]) => toCharCode(parseInt(s))));
              break;
            case "o": // /\%o40
              push(ensureNext(reOctalChar, ([s]) => toCharCode(parseInt(s, 8))));
              break;
            case "x": // /\%x2a
              push(ensureNext(reHexadecimalChar, ([s]) => toCharCode(parseInt(s, 16))));
              break;
            case "u": // /\%u20AC
              push(ensureNext(reUnicodeChar, ([s]) => toCharCode(parseInt(s, 16))));
              break;
            case "U": // /\%U1234abcd
              push(ensureNext(reLongUnicodeChar, ([s]) => toCharCode(parseInt(s, 16), "[]")));
              break;
            case "[": // /\%[]
              throw new UnsupportedSyntaxError("\\%[]", { source, index: atomIndex });
            case "C": // /\%C
              throw new UnsupportedSyntaxError("\\%C", { source, index: atomIndex });
            default: { // /\%V /\%# etc...
              --index;
              const p = maybeNext(/^(?:V|#=?|[<>]?(?:'.?|(?:\.|[0-9]+)?[lcv]))/);
              if (p) {
                throw new UnsupportedSyntaxError(`\\%${p[0]}`, { source, index: atomIndex });
              }
              throw new VimRegExpSyntaxError(
                `Invalid keyword: ${getAtom()}`,
                { source, index: atomIndex },
              );
            }
          }
        } else { // literal '%'
          push("%");
        }
        break;
      case "[":
        if (backslash ? magic >= NOMAGIC : magic <= MAGIC) {
          const collection = maybeNext(reCollection);
          if (!collection) { // literal '['
            // When the ']' is not there assume no collection is used.
            push("\\[");
          } else if (collection[0] === "]") { // literal '[]'
            // When the inside of '[]' is empty assume no collection is used.
            push("\\[\\]");
          } else { // /[]
            push(`[${parseCollection(collection[0].slice(0, -1))}]`);
          }
        } else { // literal '['
          push("\\[");
        }
        break;
      case "]": // literal ']'
        push("\\]");
        break;
      case "_":
        if (backslash ? magic >= MAGIC : magic <= VERY_MAGIC) {
          const key = vimPattern[index++];
          const charClass = SINGLE_CHAR_CLASSES[key as CharClassKey];
          if (charClass) { // /\_s etc...
            push(charClass[SINGLE_CHAR_WITH_LF]);
            break;
          }
          switch (key) {
            case "^": // /\_^
              push(stringMatch ? "^" : "(?:^|(?<=\\n))");
              break;
            case "$": // /\_$
              push(stringMatch ? "$" : "(?:(?=\\n)|$)");
              break;
            case ".": // /\_.
              push(".");
              break;
            case "[": { // /\_[
              const collection = maybeNext(reCollection);
              if (!collection) { // literal '['
                // When the ']' is not there assume no collection is used.
                push("\\[");
              } else if (collection[0] === "]") { // literal '[]'
                // When the inside of '[]' is empty assume no collection is used.
                push("\\[\\]");
              } else { // /\_[]
                push(`[\\n[${parseCollection(collection[0].slice(0, -1))}]]`);
              }
              break;
            }
            case "i": // /\_i
              push(`[\\n${getCharClass("isident")}]`);
              break;
            case "I": // /\_I
              push(`[[\\n${getCharClass("isident")}]--[0-9]]`);
              break;
            case "k": // /\_k
              push(`[\\n${getCharClass("iskeyword")}]`);
              break;
            case "K": // /\_K
              push(`[[\\n${getCharClass("iskeyword")}]--[0-9]]`);
              break;
            case "f": // /\_f
              push(`[\\n${getCharClass("isfname")}]`);
              break;
            case "F": // /\_F
              push(`[[\\n${getCharClass("isfname")}]--[0-9]]`);
              break;
            case "p": // /\_p
              push(`[\\n${getCharClass("isprint")}]`);
              break;
            case "P": // /\_P
              push(`[[\\n${getCharClass("isprint")}]--[0-9]]`);
              break;
            default:
              throw new VimRegExpSyntaxError(
                `Invalid char class: ${getAtom()}`,
                { source, index: atomIndex },
              );
          }
        } else { // literal '_'
          push("_");
        }
        break;
      default:
        if (backslash) {
          if (c === "n") { // /\n
            correct$ToLiteral();
          }
          const escaped = ESCAPE_CHARS[c as EscapeChar];
          if (escaped) { // /\e etc...
            push(escaped);
            break;
          }
          const charClass = SINGLE_CHAR_CLASSES[c as CharClassKey];
          if (charClass) { // /\s etc...
            push(charClass[SINGLE_CHAR_NORMAL]);
            break;
          }
          switch (c) {
            case "i": // /\i
              push(getCharClass("isident"));
              break;
            case "I": // /\I
              push(`[${getCharClass("isident")}--[0-9]]`);
              break;
            case "k": // /\k
              push(getCharClass("iskeyword"));
              break;
            case "K": // /\K
              push(`[${getCharClass("iskeyword")}--[0-9]]`);
              break;
            case "f": // /\f
              push(getCharClass("isfname"));
              break;
            case "F": // /\F
              push(`[${getCharClass("isfname")}--[0-9]]`);
              break;
            case "p": // /\p
              push(getCharClass("isprint"));
              break;
            case "P": // /\P
              push(`[${getCharClass("isprint")}--[0-9]]`);
              break;
            case "c": // /\c
              ignorecase = true;
              break;
            case "C": // /\C
              ignorecase = false;
              break;
            case "z": { // /\z
              const op = maybeNext(/^[se(1-9]/);
              if (op) {
                throw new UnsupportedSyntaxError(`\\z${op[0]}`, { source, index: atomIndex });
              }
              throw new VimRegExpSyntaxError(
                `Invalid keyword: \\z${vimPattern[index] ?? ""}`,
                { source, index: atomIndex },
              );
            }
            case "Z": // /\Z
              throw new UnsupportedSyntaxError("\\Z", { source, index: atomIndex });
            case "m": // /\m
              magic = MAGIC;
              break;
            case "M": // /\M
              magic = NOMAGIC;
              break;
            case "v": // /\v
              magic = VERY_MAGIC;
              break;
            case "V": // /\V
              magic = VERY_NOMAGIC;
              break;
            default:
              if (/[1-9]/.test(c)) { // /\1 ... /\9
                push(`(?:\\${c})`);
              } else { // unreserved backslashed characters
                push(c);
              }
              break;
          }
        } else { // normal characters
          push(c);
        }
        break;
    }
  }
  correct$ToLiteral();
  const resSource = resPattern.join("");

  // Union internal flags to `options.flags`.
  const internalFlags = [...`sv${ignorecase ? "i" : ""}`];
  const resFlags = internalFlags.reduce(
    (flags, add) => flags.includes(add) ? flags : flags + add,
    options.flags,
  );

  return { source: resSource, flags: resFlags };
}
