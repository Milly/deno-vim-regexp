import {
  assertEquals,
  assertInstanceOf,
  assertNotStrictEquals,
  assertObjectMatch,
  assertThrows,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.193.0/testing/bdd.ts";
import { buildVimPatternTemplate, vimpattern } from "./pattern.ts";
import { VimRegExp } from "./regexp.ts";
import { VimRegExpSyntaxError } from "./errors.ts";

describe("vimpattern", () => {
  it("has valid @example in document.", () => {
    const regex = vimpattern`\k\+`.opt("g");
    assertEquals(regex.vimSource, "\\k\\+");
    assertEquals(regex.test("Foo"), true);
  });
  it("returns VimRegExp object with specified pattern.", () => {
    const regex = vimpattern`foo`;
    assertInstanceOf(regex, VimRegExp);
    assertEquals(regex.vimSource, "foo");
  });
  describe(".options", () => {
    it("returns a copy of default options.", () => {
      assertEquals(vimpattern.options, {
        flags: "",
        isfname: "@,48-57,/,.,-,_,+,,,#,$,%,~,=",
        isident: "@,48-57,_,192-255",
        iskeyword: "@,48-57,_,192-255",
        isprint: "@,161-255",
        magic: true,
        ignorecase: false,
        smartcase: false,
        stringMatch: false,
      });
    });
    it("can not be changed.", () => {
      assertEquals(vimpattern.options.stringMatch, false);
      vimpattern.options.stringMatch = true;
      assertEquals(vimpattern.options.stringMatch, false);
    });
  });
  describe("Returned VimRegExp object", () => {
    describe(".opt()", () => {
      it("returns new VimRegExp object.", () => {
        const parent = vimpattern`foo`;
        const regex = parent.opt({});
        assertNotStrictEquals(regex, parent);
      });
      it("returns new VimRegExp object with the parent pattern.", () => {
        const parent = vimpattern`foo`;
        const regex = parent.opt({});
        assertEquals(regex.vimSource, "foo");
      });
      it("returns new VimRegExp object with specified options.", () => {
        const parent = vimpattern`foo`;
        const regex = parent.opt({
          flags: "ig",
          isfname: "48,50,@,_",
          smartcase: true,
        });
        assertObjectMatch(regex.options, {
          flags: "ig",
          isfname: "48,50,@,_",
          smartcase: true,
        });
      });
      it("returns new VimRegExp object with specified flags.", () => {
        const parent = vimpattern`foo`;
        const regex = parent.opt("dg");
        assertObjectMatch(regex.options, {
          flags: "dg",
        });
      });
    });
  });
});

describe("buildVimPatternTemplate", () => {
  it("returns new tagged template function.", () => {
    const template = buildVimPatternTemplate({});
    assertInstanceOf(template, Function);
    const regex = template`foo`;
    assertInstanceOf(regex, VimRegExp);
  });
  it("returns new tagged template function with specified options.", () => {
    const template = buildVimPatternTemplate({
      flags: "ig",
      isfname: "48,50,@,_",
      smartcase: true,
    });
    assertObjectMatch(template.options, {
      flags: "ig",
      isfname: "48,50,@,_",
      smartcase: true,
    });
  });
  it("throws an error if specified an invalid option.", () => {
    assertThrows(
      () => buildVimPatternTemplate({ flags: "X" }),
      VimRegExpSyntaxError,
      "Invalid flags supplied",
    );
  });
  describe("Returned tagged tempate function", () => {
    it("returns new VimRegExp object with the options specified in builder.", () => {
      const template = buildVimPatternTemplate({
        flags: "ig",
        isfname: "48,50,@,_",
        smartcase: true,
      });
      const regex = template`foo`;
      assertObjectMatch(regex.options, {
        flags: "ig",
        isfname: "48,50,@,_",
        smartcase: true,
      });
    });
  });
});
