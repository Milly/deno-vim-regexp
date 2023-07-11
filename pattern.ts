/**
 * This module provides tagged template functions.
 *
 * @module
 */

import { VimRegExp, VimRegExpOptions } from "./regexp.ts";

// deno-lint-ignore no-explicit-any
type TemplateExpressions = any[];

export type VimPattern = {
  /**
   * Constructs a VimRegExp object using the provided template and expressions.
   *
   * @param template - The template strings array.
   * @param exprs - The expressions to be inserted into the template.
   * @returns A new VimRegExp object.
   *
   * @throws VimRegExpSyntaxError
   * Thrown if `template` is invalid format.
   */
  (
    template: TemplateStringsArray,
    ...exprs: TemplateExpressions
  ): VimRegExp & OptionMethod;

  /**
   * Optional values used in VimPattern.
   */
  readonly options: VimRegExpOptions;
};

type OptionMethod = {
  /**
   * Returns a VimRegExp object with the specified flags.
   *
   * @param options - The options or the flags.
   * @returns A new VimRegExp object.
   *
   * @throws VimRegExpSyntaxError
   * Thrown if `options` contains invalid value.
   */
  opt(options: VimRegExpOptions | string): VimRegExp;
};

/**
 * Builds a VimPattern template function with the specified options.
 *
 * @param options - The VimRegExpOptions to be used.
 * @returns The built VimPattern template function.
 *
 * @throws VimRegExpSyntaxError
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
 * A tagged template function that creates a VimRegExp object.
 *
 * @returns A new VimRegExp object.
 *
 * @example
 * ```typescript
 * import { vimpattern } from "https://deno.land/x/vim_regexp@VERSION/pattern.ts";
 *
 * const regex = vimpattern`\k\+`.opt("i");
 * console.log(regex.vimSource); // Output: "\\k\\+"
 * console.log(regex.test("Foo")); // Output: true
 * ```
 */
export const vimpattern = buildVimPatternTemplate({});
