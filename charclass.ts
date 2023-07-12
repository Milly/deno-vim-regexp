/**
 * This module provides Vim's regular expression character class.
 *
 * @module
 */

import { CharClassSyntaxError } from "./errors.ts";

/**
 * Type of character pattern.
 */
export type PatternType = "isfname" | "isident" | "iskeyword" | "isprint";

/**
 * Optional argument type for the `patternToCharClass` function.`
 */
export type PatternToCharClassOptions = {
  /**
   * Type of character pattern.
   *
   * @default {undefined}
   */
  type?: PatternType;

  /**
   * Set to `false` to disable Unicode range.
   *
   * If the option is enabled, `RegExp` must have the `v` flag.
   *
   * @default {true}
   */
  unicode?: boolean;
};

/**
 * Default value for Vim's character pattern options.
 *
 * @example
 * ```ts
 * import {
 *   DEFAULT_CHAR_PATTERNS,
 *   patternToCharClass,
 * } from "https://deno.land/x/vim_regexp@VERSION/charclass.ts";
 *
 * const charClass = patternToCharClass(DEFAULT_CHAR_PATTERNS.isprint);
 * console.log(charClass); // Output: "[\\x41-\\x5a\\x61-\\x7a\\xa1-\\xff]"
 * ```
 */
export const DEFAULT_CHAR_PATTERNS: Readonly<Record<PatternType, string>> = {
  isfname: "@,48-57,/,.,-,_,+,,,#,$,%,~,=",
  isident: "@,48-57,_,192-255",
  iskeyword: "@,48-57,_,192-255",
  isprint: "@,161-255",
};

/**
 * Forces overriding patterns for pattern type.
 */
const FORCE_CHAR_PATTERNS: Readonly<Record<PatternType, string>> = {
  // 0xa0(160) to 0xff(255) are contains in Unicode.
  isfname: "^160-255",
  isident: "",
  iskeyword: "",
  // Space 0x20(32) to '~' 0x7e(126) are always displayed.
  // 0xa0(160) to 0xff(255) are contains in Unicode.
  isprint: "32-126,^160-255",
};

/**
 * Regular expression character classes without ASCII code.
 * The `/v` flag is required when used with `RegExp`.
 *
 * FIXME: Vim uses an internal table to determine words with Unicode characters, so 'iskeyword' doesn't match exactly.
 */
const UNICODE_CHAR_CLASSES: Readonly<Record<PatternType, string>> = {
  isfname: "[\\xa0-\\u{10ffff}]",
  isident: "",
  iskeyword: "[[\\p{L}\\p{N}\\p{Emoji}]--[\\x00-\\xff]]",
  isprint: "[\\xa0-\\u{10ffff}]",
};

/**
 * Word character codes less than 256.
 */
const ASCII_WORD_CHARS = [
  // A-Z
  ...range(0x41, 0x5a),
  // a-z
  ...range(0x61, 0x7a),
  // Unicode word in u00a0-u00ff
  0xb5,
  ...range(0xc0, 0xd6),
  ...range(0xd8, 0xf6),
  ...range(0xf8, 0xff),
] as const;

/**
 * Converts the value of Vim's `isfname` option into a character class in RegExp.
 * Can specify values for `isfname`, `isident`, `iskeyword`, or `isprint` options.
 *
 * The `/v` flag is required when used with `RegExp`.
 *
 * @remarks
 * **Note that this section is taken from Vim's `:help 'isfname'`.**
 *
 * The format of value is a list of parts, separated with commas.
 * Each part can be a single character number or a range.  A range is two
 * character numbers with `-` in between.  A character number can be a
 * decimal number between 0 and 255 or the ASCII character itself (does
 * not work for digits).  Example:
 *
 *         `"_,-,128-140,#-43"`    (include `_` and `-` and the range
 *                                 128 to 140 and `#` to 43)
 *
 * If a part starts with `^`, the following character number or range
 * will be excluded from the option.  The option is interpreted from left
 * to right.  Put the excluded character after the range where it is
 * included.  To include `^` itself use it as the last character of the
 * option or the end of a range.  Example:
 *
 *         `"^a-z,#,^"`      (exclude `a` to `z`, include `#` and `^`)
 *
 * If the character is `@`, all characters where isalpha() returns TRUE
 * are included.  Normally these are the characters a to z and A to Z,
 * plus accented characters.  To include `@` itself use "@-@".  Examples:
 *
 *         `"@,^a-z"`      All alphabetic characters, excluding lower
 *                         case ASCII letters.
 *         `"a-z,A-Z,@-@"` All letters plus the `@` character.
 *
 * A comma can be included by using it where a character number is
 * expected.  Example:
 *
 *         `"48-57,,,_"`   Digits, comma and underscore.
 *
 * A comma can be excluded by prepending a `^`.  Example:
 *
 *         `" -~,^,,9"`    All characters from space to `~`, excluding
 *                         comma, plus `<Tab>`.
 *
 * @param pattern - Pattern string of Vim's `isfname` option.
 * @param [options] - Optional arguments. (default `{}`)
 * @returns A string representing the character class in regular expression.
 *
 * @throws CharClassSyntaxError
 * Thrown if `value` is invalid format.
 *
 * @example
 * ```ts
 * import { patternToCharClass } from "https://deno.land/x/vim_regexp@VERSION/charclass.ts";
 *
 * const isfname = "@,48-57,/,.,-,_,+,,,#,$,%,~,=";
 * const fnameRegex = new RegExp(`${
 *   patternToCharClass(isfname, { type: 'isfname', unicode: true })
 * }+`, "v");
 *
 * const fname = "   /path/to/filename.ext  ".match(fnameRegex);
 * console.log(fname?.[0]); // Output: "/path/to/filename.ext"
 * ```
 */
export function patternToCharClass(
  pattern: string,
  options: PatternToCharClassOptions = {},
): string {
  const { type, unicode = true } = options;

  // Collect chars from pattern.
  const charSet = new Set<number>();
  const setChars = (chars: readonly number[], inverse: boolean) => {
    chars.forEach(inverse ? (c) => charSet.delete(c) : (c) => charSet.add(c));
  };
  const reBlock =
    /(?<inverse>\^)?(?<start>\d+|[^\d^]|(?<=\^)\^|\^$)(?:-(?<end>\d+|[^\d]))?(?:, *|$)|(.+)/gy;
  const parse = (pattern: string) => {
    for (const { index, groups, 0: block } of pattern.matchAll(reBlock)) {
      const { inverse, start, end } = groups as Record<string, string | undefined>;
      if (!start) {
        throw new CharClassSyntaxError(
          `Invalid keyword: ${block}`,
          { source: pattern, index },
        );
      }
      if (start === "@" && end === undefined) {
        setChars(ASCII_WORD_CHARS, !!inverse);
      } else {
        const [rs, re] = [start, end ?? start].map((p) =>
          p.match(/^\d+$/) ? parseInt(p, 10) : p.charCodeAt(0)
        );
        if (!(1 <= rs && rs <= 255 && 1 <= re && re <= 255 && rs <= re)) {
          throw new CharClassSyntaxError(
            `Invalid code range: ${block}`,
            { source: pattern, index },
          );
        }
        setChars(range(rs, re), !!inverse);
      }
    }
  };
  parse(pattern);

  // Overrides with force pattern.
  const forcePattern = FORCE_CHAR_PATTERNS[type as PatternType];
  if (forcePattern) {
    parse(forcePattern);
  }
  // Remove Unicode ranges.
  if (!unicode) {
    setChars(range(0xa0, 0xff), true);
  }

  // Generate RegExp char class.
  const chars = [...charSet].toSorted((a, b) => a - b);
  const patterns: Array<string | number> = [];
  for (let i = 0; i < chars.length; ++i) {
    const start = chars[i];
    patterns.push(start);
    for (; chars[i] + 1 === chars[i + 1]; ++i);
    const end = chars[i];
    const len = end - start;
    if (len === 1) {
      patterns.push(end);
    } else if (len >= 2) {
      patterns.push("-", end);
    }
  }
  const charPattern = patterns.map((c) =>
    typeof c === "number" ? "\\x" + `0${c.toString(16)}`.slice(-2) : c
  ).join("");

  if (unicode) {
    // Add unicode class.
    const unicodeClass = UNICODE_CHAR_CLASSES[type as PatternType] ?? "";
    return `[${charPattern}${unicodeClass}]`;
  } else {
    return `[${charPattern}]`;
  }
}

function range(start: number, end: number): number[] {
  return Array.from({ length: end - start + 1 }, (_, i) => start + i);
}
