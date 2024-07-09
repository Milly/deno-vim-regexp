/**
 * This module provides tagged template functions.
 *
 * @module
 */

import { VimRegExp, type VimRegExpOptions } from "./regexp.ts";

// deno-lint-ignore no-explicit-any
type TemplateExpressions = any[];

/**
 * Represents a Vim's regular expression template function.
 */
export type VimPattern = {
  /**
   * Constructs a {@linkcode VimRegExp} object using the provided template and
   * expressions.
   *
   * @param template - The template strings array.
   * @param exprs - The expressions to be inserted into the template.
   * @returns A new VimRegExp object.
   *
   * @throws {VimRegExpSyntaxError}
   * Thrown if `template` is invalid format.
   */
  (
    template: TemplateStringsArray,
    ...exprs: TemplateExpressions
  ): VimRegExp & OptionMethod;

  /**
   * Optional parameters applied to this {@linkcode VimPattern}.
   */
  readonly options: VimRegExpOptions;
};

type OptionMethod = {
  /**
   * Returns a {@linkcode VimRegExp} object with the specified flags.
   *
   * @param options - Optional parameters or {@linkcode VimRegExpOptions.flags}.
   * @returns A new `VimRegExp` object.
   *
   * @throws {VimRegExpSyntaxError}
   * Thrown if `options` contains invalid value.
   */
  opt(options: VimRegExpOptions | string): VimRegExp;
};

/**
 * Builds a {@linkcode VimPattern} template function with the specified options.
 *
 * @param options - Optional parameters.
 * @returns A `VimPattern` template function.
 *
 * @throws {VimRegExpSyntaxError}
 * Thrown if `options` contains invalid value.
 *
 * @__NO_SIDE_EFFECTS__
 */
export function buildVimPatternTemplate(
  options: VimRegExpOptions,
): VimPattern {
  const { options: vimOptions } = new VimRegExp("\\f\\i\\k\\p", options);
  const vimpattern = (
    template: TemplateStringsArray,
    ...exprs: TemplateExpressions
  ): VimRegExp & OptionMethod => {
    const raw = String.raw(template, exprs);
    const regex = new VimRegExp(raw, vimOptions);
    return Object.assign(regex, {
      opt(options: VimRegExpOptions | string): VimRegExp {
        return new VimRegExp(regex, options);
      },
    });
  };
  return Object.defineProperty(
    vimpattern,
    "options",
    {
      configurable: false,
      enumerable: true,
      get(): VimRegExpOptions {
        return { ...vimOptions };
      },
      set: undefined,
    },
  ) as VimPattern;
}

/**
 * A tagged template function that creates a {@linkcode VimRegExp} object.
 *
 * @returns A `VimRegExp` object.
 *
 * @example
 * ```typescript
 * import { vimpattern } from "@milly/vimregexp/pattern";
 * import { assert, assertFalse } from "@std/assert";
 *
 * const regex = vimpattern`\k\+`.opt("i");
 * assert(regex.test("Foo"));
 * assertFalse(regex.test("!!!"));
 * ```
 */
export const vimpattern: VimPattern = buildVimPatternTemplate({});
