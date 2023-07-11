import {
  assert,
  assertEquals,
  assertFalse,
  assertMatch,
  assertNotMatch,
  assertThrows,
} from "https://deno.land/std@0.193.0/testing/asserts.ts";
import { describe, it } from "https://deno.land/std@0.193.0/testing/bdd.ts";
import { VimRegExp } from "./regexp.ts";
import { UnsupportedSyntaxError, VimRegExpSyntaxError } from "./errors.ts";

/**
 * Make an assertion that `input` matches `actual` RegExp and result array
 * equals `expected`. If not then throw.
 */
function assertMatchResult(
  input: string,
  actual: RegExp,
  expected: [string, ...string[]],
  msg?: string,
) {
  const result = input.match(actual);
  const msgSuffix = msg ? `: ${msg}` : ".";
  msg = `Expected input: "${input}" to match: "${actual}"${msgSuffix}`;
  return assertEquals(result?.slice(), expected, msg);
}

describe("VimRegExp", () => {
  describe("constructor", () => {
    it("has valid @example in document.", () => {
      const regex = new VimRegExp("\\k\\+", { flags: "i" });
      assertEquals(regex.vimSource, "\\k\\+");
      assertEquals(regex.test("Foo"), true);
      assertEquals(regex.test("!!!"), false);
    });
    describe("arguments", () => {
      describe("pattern", () => {
        it("can specify empty string.", () => {
          new VimRegExp("");
        });
        it("can parse Vim's regular expression pattern.", () => {
          const regex = new VimRegExp("\\(foo\\|bar\\)");
          assertEquals(regex.source, "(foo|bar)");
        });
      });
      describe("options", () => {
        it("can be omitted.", () => {
          new VimRegExp("foo");
        });
        it("can specify empty object.", () => {
          new VimRegExp("foo", {});
        });
        describe(".flags", () => {
          describe("'' (empty)", () => {
            it("can be specified.", () => {
              const regex = new VimRegExp("foo", { flags: "" });
              assertEquals(regex.flags, "sv", "'sv' is specified internal.");
            });
            it("sets the properties to their default state.", () => {
              const regex = new VimRegExp("foo", { flags: "" });
              assertFalse(regex.hasIndices);
              assertFalse(regex.global);
              assertFalse(regex.ignoreCase);
              assertFalse(regex.sticky);
            });
          });
          describe("'d' (hasIndices)", () => {
            it("can be specified.", () => {
              const regex = new VimRegExp("foo", { flags: "d" });
              assertEquals(regex.flags, "dsv", "'sv' is specified internal.");
            });
            it("enables 'hasIndices' property.", () => {
              const regex = new VimRegExp("foo", { flags: "d" });
              assert(regex.hasIndices);
              assertFalse(regex.global);
              assertFalse(regex.ignoreCase);
              assertFalse(regex.sticky);
            });
          });
          describe("'g' (global)", () => {
            it("can be specified.", () => {
              const regex = new VimRegExp("foo", { flags: "g" });
              assertEquals(regex.flags, "gsv", "'sv' is specified internal.");
            });
            it("enables 'global' property.", () => {
              const regex = new VimRegExp("foo", { flags: "g" });
              assertFalse(regex.hasIndices);
              assert(regex.global);
              assertFalse(regex.ignoreCase);
              assertFalse(regex.sticky);
            });
          });
          describe("'i' (ignoreCase)", () => {
            it("can be specified.", () => {
              const regex = new VimRegExp("foo", { flags: "i" });
              assertEquals(regex.flags, "isv", "'sv' is specified internal.");
            });
            it("enables 'ignoreCase' property.", () => {
              const regex = new VimRegExp("foo", { flags: "i" });
              assertFalse(regex.hasIndices);
              assertFalse(regex.global);
              assert(regex.ignoreCase);
              assertFalse(regex.sticky);
            });
          });
          describe("'y' (sticky)", () => {
            it("can be specified.", () => {
              const regex = new VimRegExp("foo", { flags: "y" });
              assertEquals(regex.flags, "svy", "'sv' is specified internal.");
            });
            it("enables 'sticky' property.", () => {
              const regex = new VimRegExp("foo", { flags: "y" });
              assertFalse(regex.hasIndices);
              assertFalse(regex.global);
              assertFalse(regex.ignoreCase);
              assert(regex.sticky);
            });
          });
          describe("'s' (dotAll)", () => {
            it("can be specified, but no change.", () => {
              const regex = new VimRegExp("foo", { flags: "s" });
              assertEquals(regex.flags, "sv", "'sv' is specified internal.");
            });
          });
          describe("'v' (unicodeSet)", () => {
            it("can be specified, but no change.", () => {
              const regex = new VimRegExp("foo", { flags: "v" });
              assertEquals(regex.flags, "sv", "'sv' is specified internal.");
            });
          });
          describe("'m' (multiline)", () => {
            it("can not be specified.", () => {
              assertThrows(
                () => new VimRegExp("foo", { flags: "m" }),
                VimRegExpSyntaxError,
                "Invalid flags supplied to VimRegExp constructor 'm'",
              );
            });
          });
          describe("'u' (multiline)", () => {
            it("can not be specified.", () => {
              assertThrows(
                () => new VimRegExp("foo", { flags: "u" }),
                VimRegExpSyntaxError,
                "Invalid flags supplied to VimRegExp constructor 'u'",
              );
            });
          });
          describe("'X' (unknown)", () => {
            it("can not be specified.", () => {
              assertThrows(
                () => new VimRegExp("foo", { flags: "X" }),
                VimRegExpSyntaxError,
              );
            });
          });
        });
        describe(".isfname", () => {
          it("can speficy valid format.", () => {
            new VimRegExp("[[:fname:]]", { isfname: "X,Y,Z" });
          });
          it("throws error if specified invalid format when it is used in the pattern.", () => {
            assertThrows(
              () => new VimRegExp("[[:fname:]]", { isfname: "XYZ" }),
              VimRegExpSyntaxError,
              'Invalid Vim option format: "XYZ":0',
            );
          });
          it("can speficy invalid format when it is not used in the pattern.", () => {
            new VimRegExp("foo", { isfname: "XYZ" });
          });
        });
        describe(".isident", () => {
          it("can speficy valid format.", () => {
            new VimRegExp("[[:ident:]]", { isident: "X,Y,Z" });
          });
          it("throws error if specified invalid format when it is used in the pattern.", () => {
            assertThrows(
              () => new VimRegExp("[[:ident:]]", { isident: "XYZ" }),
              VimRegExpSyntaxError,
              'Invalid Vim option format: "XYZ":0',
            );
          });
          it("can speficy invalid format when it is not used in the pattern.", () => {
            new VimRegExp("foo", { isident: "XYZ" });
          });
        });
        describe(".iskeyword", () => {
          it("can speficy valid format.", () => {
            new VimRegExp("[[:keyword:]]", { iskeyword: "X,Y,Z" });
          });
          it("throws error if specified invalid format when it is used in the pattern.", () => {
            assertThrows(
              () => new VimRegExp("[[:keyword:]]", { iskeyword: "XYZ" }),
              VimRegExpSyntaxError,
              'Invalid Vim option format: "XYZ":0',
            );
          });
          it("can speficy invalid format when it is not used in the pattern.", () => {
            new VimRegExp("foo", { iskeyword: "XYZ" });
          });
        });
        describe(".isprint", () => {
          it("can speficy valid format.", () => {
            new VimRegExp("[[:print:]]", { isprint: "X,Y,Z" });
          });
          it("throws error if specified invalid format when it is used in the pattern.", () => {
            assertThrows(
              () => new VimRegExp("[[:print:]]", { isprint: "XYZ" }),
              VimRegExpSyntaxError,
              'Invalid Vim option format: "XYZ":0',
            );
          });
          it("can speficy invalid format when it is not used in the pattern.", () => {
            new VimRegExp("foo", { isprint: "XYZ" });
          });
        });
      });
    });
  });
  describe("parameters", () => {
    describe("vimSource", () => {
      it("returns a copy of the text of the Vim's regular expression pattern.", () => {
        const regex = new VimRegExp("\\V\\(foo\\)\\+\\v(bar)+");
        assertEquals(regex.vimSource, "\\V\\(foo\\)\\+\\v(bar)+");
      });
    });
    describe("options", () => {
      it("returns a copy of the options of the VimRegExp.", () => {
        const options = { flags: "dg" };
        const regex = new VimRegExp("foo", options);
        assertEquals(regex.options.flags, "dg");
        options.flags = "i";
        assertEquals(regex.options.flags, "dg");
        regex.options.flags = "i";
        assertEquals(regex.options.flags, "dg");
      });
      it("returns default values if 'options' argument is not specified.", () => {
        const regex1 = new VimRegExp("foo");
        assertEquals(regex1.options, {
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
      it("returns default values for unspecified options.", () => {
        const regex1 = new VimRegExp("foo", {
          flags: "dg",
          isfname: "1",
          isident: "2",
          smartcase: true,
          stringMatch: true,
        });
        assertEquals(regex1.options, {
          // Specified values.
          flags: "dg",
          isfname: "1",
          isident: "2",
          smartcase: true,
          stringMatch: true,
          // Default values.
          iskeyword: "@,48-57,_,192-255",
          isprint: "@,161-255",
          magic: true,
          ignorecase: false,
        });
      });
    });
  });
});

describe("Regular expression patterns in VimRegExp", () => {
  describe("Quantifiers", () => {
    describe("nothing", () => {
      it("matches atom as is.", () => {
        const regex = new VimRegExp("xyz");
        assertNotMatch("xz", regex);
        assertMatch("xyz", regex);
        assertNotMatch("xyyz", regex);
        assertNotMatch("xyyyz", regex);
      });
    });
    describe("*", () => {
      it("matches 0 or more of the preceding atom.", () => {
        const regex = new VimRegExp("xy*z");
        assertMatch("xz", regex);
        assertMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x*");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("matches literal '*' when use * without preceding atom", () => {
        const regex = new VimRegExp("*");
        assertMatchResult("*", regex, ["*"]);
      });
      it("throws error when use \\* without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\*", { magic: false }),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\* when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\*", { magic: false });
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use * when \\v was used.", () => {
        const regex = new VimRegExp("\\vx*");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use * when \\m was used.", () => {
        const regex = new VimRegExp("\\mx*");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use \\* when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\*");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use \\* when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\*");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
    });
    describe("\\+", () => {
      it("matches 1 or more of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\+z");
        assertNotMatch("xz", regex);
        assertMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x\\+");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("throws error when use + without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v+"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\+ without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\+"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\+ when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\+", { magic: false });
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use + when \\v was used.", () => {
        const regex = new VimRegExp("\\vx+");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use \\+ when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\+");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use \\+ when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\+");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
      it("use \\+ when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\+");
        assertMatchResult("xxx", regex, ["xxx"]);
      });
    });
    describe("\\=", () => {
      it("matches 0 or 1 of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\=z");
        assertMatch("xz", regex);
        assertMatch("xyz", regex);
        assertNotMatch("xyyz", regex);
        assertNotMatch("xyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x\\=");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("throws error when use + without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\+ without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\= when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\=", { magic: false });
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use = when \\v was used.", () => {
        const regex = new VimRegExp("\\vx=");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use \\= when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\=");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use \\= when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\=");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use \\= when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\=");
        assertMatchResult("xxx", regex, ["x"]);
      });
    });
    describe("\\?", () => {
      it("matches 0 or 1 of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\?z");
        assertMatch("xz", regex);
        assertMatch("xyz", regex);
        assertNotMatch("xyyz", regex);
        assertNotMatch("xyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x\\=");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("throws error when use ? without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v?"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\? without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\?"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\? when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\?", { magic: false });
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use ? when \\v was used.", () => {
        const regex = new VimRegExp("\\vx?");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use \\? when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\?");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use \\? when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\?");
        assertMatchResult("xxx", regex, ["x"]);
      });
      it("use \\? when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\?");
        assertMatchResult("xxx", regex, ["x"]);
      });
    });
    describe("\\{n,m}", () => {
      it("matches n to m of the preceding atom, as many as possible.", () => {
        const regex = new VimRegExp("xy\\{2,3}z");
        assertNotMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
        assertNotMatch("xyyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x\\{2,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("throws error when use {n,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{2,3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{n,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{2,3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{n,m} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{2,3}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use {n,m} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{2,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{n,m} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{2,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{n,m} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{2,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{n,m} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{2,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
    });
    describe("\\{n}", () => {
      it("matches n of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\{3}z");
        assertNotMatch("xyz", regex);
        assertNotMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
        assertNotMatch("xyyyyz", regex);
      });
      it("throws error when use {n} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{n} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{n} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{3}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use {n} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{n} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{n} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{n} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
    });
    describe("\\{n,}", () => {
      it("matches at least n of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\{2,}z");
        assertNotMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
        assertMatch("xyyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x\\{2,}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("throws error when use {n,} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{2,}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{n,} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{2,}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{n,} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{2,}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use {n,} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{2,}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use \\{n,} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{2,}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use \\{n,} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{2,}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use \\{n,} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{2,}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
    });
    describe("\\{,m}", () => {
      it("matches 0 to m of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\{,2}z");
        assertMatch("xz", regex);
        assertMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertNotMatch("xyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x\\{,2}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("throws error when use {,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{,3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{,3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{,m} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{,3}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use {,m} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{,m} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{,m} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{,m} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{,3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
    });
    describe("\\{}", () => {
      it("matches 0 or more of the preceding atom (like '*').", () => {
        const regex = new VimRegExp("xy\\{}z");
        assertMatch("xz", regex);
        assertMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
      });
      it("matches as many as possible.", () => {
        const regex = new VimRegExp("x\\{}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("throws error when use {} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use {} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use \\{} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use \\{} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
      it("use \\{} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{}");
        assertMatchResult("xxxxxx", regex, ["xxxxxx"]);
      });
    });
    describe("\\{-n,m}", () => {
      it("matches n to m of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\{-2,3}z");
        assertNotMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
        assertNotMatch("xyyyyz", regex);
      });
      it("matches as few as possible.", () => {
        const regex = new VimRegExp("x\\{-2,3}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("throws error when use {-n,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{-2,3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{-n,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{-2,3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{-n,m} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{-2,3}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use {-n,m} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{-2,3}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use \\{-n,m} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{-2,3}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use \\{-n,m} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{-2,3}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use \\{-n,m} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{-2,3}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
    });
    describe("\\{-n}", () => {
      it("matches n of the preceding atom (like '\\{n}').", () => {
        const regex = new VimRegExp("xy\\{-3}z");
        assertNotMatch("xyz", regex);
        assertNotMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
        assertNotMatch("xyyyyz", regex);
      });
      it("throws error when use \\{-n} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{-3}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{-n} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{-3}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use {-n} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{-3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{-n} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{-3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{-n} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{-3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
      it("use \\{-n} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{-3}");
        assertMatchResult("xxxxxx", regex, ["xxx"]);
      });
    });
    describe("\\{-n,}", () => {
      it("matches at least n of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\{-2,}z");
        assertNotMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
        assertMatch("xyyyyz", regex);
      });
      it("matches as few as possible.", () => {
        const regex1 = new VimRegExp("x\\{-2,}");
        assertMatchResult("xxxxxx", regex1, ["xx"]);
      });
      it("throws error when use {-n,} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{-2,}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{-n,} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{-2,}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{-n,} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{-2,}", { magic: false });
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use {-n,} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{-2,}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use \\{-n,} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{-2,}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use \\{-n,} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{-2,}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
      it("use \\{-n,} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{-2,}");
        assertMatchResult("xxxxxx", regex, ["xx"]);
      });
    });
    describe("\\{-,m}", () => {
      it("matches 0 to m of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\{-,2}z");
        assertMatch("xz", regex);
        assertMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertNotMatch("xyyyz", regex);
      });
      it("matches as few as possible.", () => {
        const regex = new VimRegExp("x\\{-,2}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("throws error when use {-,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{-,2}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{-,m} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{-,2}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{-,m} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{-,2}", { magic: false });
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use {-,m} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{-,2}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\{-,m} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{-,2}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\{-,m} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{-,2}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\{-,m} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{-,2}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
    });
    describe("\\{-}", () => {
      it("matches 0 or more of the preceding atom.", () => {
        const regex = new VimRegExp("xy\\{-}z");
        assertMatch("xz", regex);
        assertMatch("xyz", regex);
        assertMatch("xyyz", regex);
        assertMatch("xyyyz", regex);
      });
      it("matches as few as possible.", () => {
        const regex = new VimRegExp("x\\{-}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("throws error when use {-} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v{-}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\{-} without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\{-}"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\{-} when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\{-}", { magic: false });
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use {-} when \\v was used.", () => {
        const regex = new VimRegExp("\\vx{-}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\{-} when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\{-}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\{-} when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\{-}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\{-} when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\{-}");
        assertMatchResult("xxxxxx", regex, [""]);
      });
    });
    describe("\\@=", () => {
      it("matches the preceding atom with zero width.", () => {
        const regex = new VimRegExp("foo\\(bar\\)\\@=");
        assertMatchResult("foobar", regex, ["foo"]);
        assertNotMatch("foofoo", regex);
      });
      it("throws error when use @= without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v@="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\@= without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\@="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\@= when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\@=", { magic: false });
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use @= when \\v was used.", () => {
        const regex = new VimRegExp("\\vx@=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@= when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\@=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@= when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\@=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@= when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\@=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
    });
    describe("\\@!", () => {
      it("matches with zero width if the preceding atom does NOT match at the current position.", () => {
        const regex = new VimRegExp("foo\\(bar\\)\\@!");
        assertMatchResult("foofoo", regex, ["foo"]);
        assertNotMatch("foobar", regex);
      });
      it("throws error when use @! without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v@!"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\@! without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\@!"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\@! when 'magic' is not set.", () => {
        const regex = new VimRegExp("xy\\@!", { magic: false });
        assertMatchResult("xxxxxx", regex, ["x"]);
      });
      it("use @! when \\v was used.", () => {
        const regex = new VimRegExp("\\vxy@!");
        assertMatchResult("xxxxxx", regex, ["x"]);
      });
      it("use \\@! when \\m was used.", () => {
        const regex = new VimRegExp("\\mxy\\@!");
        assertMatchResult("xxxxxx", regex, ["x"]);
      });
      it("use \\@! when \\M was used.", () => {
        const regex = new VimRegExp("\\Mxy\\@!");
        assertMatchResult("xxxxxx", regex, ["x"]);
      });
      it("use \\@! when \\V was used.", () => {
        const regex = new VimRegExp("\\Vxy\\@!");
        assertMatchResult("xxxxxx", regex, ["x"]);
      });
    });
    describe("\\@<=", () => {
      it("matches with zero width if the preceding atom matches just before what follows.", () => {
        const regex = new VimRegExp("\\(foo\\)\\@<=bar");
        assertMatchResult("foobar", regex, ["bar"]);
        assertNotMatch("barbar", regex);
      });
      it("throws error when use @<= without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v@<="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\@<= without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\@<="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\@<= when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\@<=", { magic: false });
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use @<= when \\v was used.", () => {
        const regex = new VimRegExp("\\vx@<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@<= when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\@<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@<= when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\@<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@<= when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\@<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
    });
    describe("\\@123<=", () => {
      it("is same as '\\@<='.", () => {
        const regex = new VimRegExp("\\(foo\\)\\@123<=bar");
        assertMatchResult("foobar", regex, ["bar"]);
        assertNotMatch("barbar", regex);
      });
      it("does not limit lookbacks. (Different from Vim)", () => {
        const regex = new VimRegExp("\\(foo\\)\\@1<=bar");
        assertThrows(() => {
          assertNotMatch("foobar", regex, "Does not match in Vim");
        }, "Matches in VimRegExp");
      });
      it("throws error when use @123<= without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v@123<="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\@123<= without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\@123<="),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\@123<= when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\@123<=", { magic: false });
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use @123<= when \\v was used.", () => {
        const regex = new VimRegExp("\\vx@123<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@123<= when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\@123<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@123<= when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\@123<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@123<= when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\@123<=");
        assertMatchResult("xxxxxx", regex, [""]);
      });
    });
    describe("\\@<!", () => {
      it("matches with zero width if the preceding atom does NOT match just before what follows.", () => {
        const regex = new VimRegExp("\\(foo\\)\\@<!bar");
        assertNotMatch("foobar", regex);
        assertMatchResult("barbar", regex, ["bar"]);
      });
      it("throws error when use @<! without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v@<!"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\@<! without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\@<!"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\@<! when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\@<!", { magic: false });
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use @<! when \\v was used.", () => {
        const regex = new VimRegExp("\\vx@<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@<! when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\@<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@<! when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\@<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@<! when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\@<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
    });
    describe("\\@123<!", () => {
      it("is same as '\\@<!'.", () => {
        const regex = new VimRegExp("\\(foo\\)\\@123<!bar");
        assertNotMatch("foobar", regex);
        assertMatchResult("barbar", regex, ["bar"]);
      });
      it("does not limit lookbacks. (Different from Vim)", () => {
        const regex = new VimRegExp("\\(foo\\)\\@1<!bar");
        assertThrows(() => {
          assertMatch("foobar", regex, "Matches in Vim");
        }, "Does not matches in VimRegExp");
      });
      it("throws error when use @123<! without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\v@123<!"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("throws error when use \\@123<! without preceding atom.", () => {
        assertThrows(
          () => new VimRegExp("\\@123<!"),
          VimRegExpSyntaxError,
          "Nothing to repeat",
        );
      });
      it("use \\@123<! when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\@123<!", { magic: false });
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use @123<! when \\v was used.", () => {
        const regex = new VimRegExp("\\vx@123<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@123<! when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\@123<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@123<! when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\@123<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
      it("use \\@123<! when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\@123<!");
        assertMatchResult("xxxxxx", regex, [""]);
      });
    });
    describe("\\@>", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\(x*\\)\\@>y"),
          UnsupportedSyntaxError,
          ": \\@>",
        );
      });
    });
  });
  describe("Ordinary atoms", () => {
    describe("^", () => {
      describe("Without options (same as `{stringMatch: false}`)", () => {
        it("matches start-of-line when at beginning of pattern.", () => {
          const regex = new VimRegExp("^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches literal '^' when at middle of pattern.", () => {
          const regex = new VimRegExp("foo^bar");
          assertMatchResult("foo^bar", regex, ["foo^bar"]);
        });
        it("matches literal '^' when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo^");
          assertMatchResult("foo^", regex, ["foo^"]);
        });
        it("matches start-of-line when after '\\|' in pattern.", () => {
          const regex = new VimRegExp("bar\\|^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\(' in pattern.", () => {
          const regex = new VimRegExp("\\(^foo\\)");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\%(' in pattern.", () => {
          const regex = new VimRegExp("\\%(^foo\\)");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\&' in pattern.", () => {
          const regex = new VimRegExp(".\\&^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\n' in pattern.", () => {
          const regex = new VimRegExp("\\n^foo");
          assertMatch("bar\nfoo", regex);
          assertNotMatch("foo", regex);
        });
        it("matches after '\\n' in string.", () => {
          const regex = new VimRegExp("^foo");
          assertMatchResult("bar\nfoo", regex, ["foo"]);
        });
      });
      describe("With options `{stringMatch: true}`", () => {
        it("matches start-of-line when at beginning of pattern.", () => {
          const regex = new VimRegExp("^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches literal '^' when at middle of pattern.", () => {
          const regex = new VimRegExp("foo^bar", { stringMatch: true });
          assertMatchResult("foo^bar", regex, ["foo^bar"]);
        });
        it("matches literal '^' when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo^", { stringMatch: true });
          assertMatchResult("foo^", regex, ["foo^"]);
        });
        it("matches start-of-line when after '\\|' in pattern.", () => {
          const regex = new VimRegExp("bar\\|^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\(' in pattern.", () => {
          const regex = new VimRegExp("\\(^foo\\)", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\%(' in pattern.", () => {
          const regex = new VimRegExp("\\%(^foo\\)", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\&' in pattern.", () => {
          const regex = new VimRegExp(".\\&^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("does not matches start-of-line when after '\\n' in pattern.", () => {
          const regex = new VimRegExp("\\n^foo", { stringMatch: true });
          assertNotMatch("bar\nfoo", regex);
          assertNotMatch("foo", regex);
        });
        it("does not matches after '\\n' in string.", () => {
          const regex = new VimRegExp("^foo", { stringMatch: true });
          assertNotMatch("bar\nfoo", regex);
        });
      });
    });
    describe("\\^", () => {
      it("matches literal '^' when at beginning of pattern.", () => {
        const regex = new VimRegExp("\\^foo");
        assertMatch("^foo", regex);
        assertNotMatch("foo", regex);
      });
      it("matches literal '^' when at middle of pattern.", () => {
        const regex = new VimRegExp("foo\\^bar");
        assertMatchResult("foo^bar", regex, ["foo^bar"]);
      });
      it("matches literal '^' when at trailing of pattern.", () => {
        const regex = new VimRegExp("foo\\^");
        assertMatchResult("foo^", regex, ["foo^"]);
      });
    });
    describe("\\_^", () => {
      describe("Without options (same as `{stringMatch: false}`)", () => {
        it("matches start-of-line when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\_^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when at middle of pattern.", () => {
          const regex = new VimRegExp("x\\?\\_^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when at trailing of pattern.", () => {
          const regex = new VimRegExp("x\\?\\_^");
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 0);
        });
        it("matches start-of-line when after '\\|' in pattern.", () => {
          const regex = new VimRegExp("bar\\|\\_^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\(' in pattern.", () => {
          const regex = new VimRegExp("\\(\\_^foo\\)");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\%(' in pattern.", () => {
          const regex = new VimRegExp("\\%(\\_^foo\\)");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\&' in pattern.", () => {
          const regex = new VimRegExp(".\\&\\_^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\n' in pattern.", () => {
          const regex = new VimRegExp("\\n\\_^foo");
          assertMatch("bar\nfoo", regex);
          assertNotMatch("foo", regex);
        });
        it("matches after '\\n' in string.", () => {
          const regex = new VimRegExp("\\_^foo");
          assertMatch("bar\nfoo", regex);
        });
      });
      describe("With options `{stringMatch: true}`", () => {
        it("matches start-of-line when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\_^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when at middle of pattern.", () => {
          const regex = new VimRegExp("x\\?\\_^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when at trailing of pattern.", () => {
          const regex = new VimRegExp("x\\?\\_^", { stringMatch: true });
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 0);
        });
        it("matches start-of-line when after '\\|' in pattern.", () => {
          const regex = new VimRegExp("bar\\|\\_^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\(' in pattern.", () => {
          const regex = new VimRegExp("\\(\\_^foo\\)", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\%(' in pattern.", () => {
          const regex = new VimRegExp("\\%(\\_^foo\\)", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start-of-line when after '\\&' in pattern.", () => {
          const regex = new VimRegExp(".\\&\\_^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("does not matches start-of-line when after '\\n' in pattern.", () => {
          const regex = new VimRegExp("\\n\\_^foo", { stringMatch: true });
          assertNotMatch("bar\nfoo", regex);
          assertNotMatch("foo", regex);
        });
        it("does not matches after '\\n' in string.", () => {
          const regex = new VimRegExp("\\_^foo", { stringMatch: true });
          assertNotMatch("bar\nfoo", regex);
        });
      });
    });
    describe("$", () => {
      describe("Without options (same as `{stringMatch: false}`)", () => {
        it("matches end-of-line when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo$");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches literal '$' when at middle of pattern.", () => {
          const regex = new VimRegExp("foo$bar");
          assertMatchResult("foo$bar", regex, ["foo$bar"]);
        });
        it("matches literal '$' when at beginning of pattern.", () => {
          const regex = new VimRegExp("$foo");
          assertMatchResult("$foo", regex, ["$foo"]);
        });
        it("matches end-of-line when front of '\\|' in pattern.", () => {
          const regex = new VimRegExp("foo$\\|bar");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\)' in pattern.", () => {
          const regex = new VimRegExp("\\(foo$\\)");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\&' in pattern.", () => {
          const regex = new VimRegExp("foo$\\&.");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\n' in pattern.", () => {
          const regex = new VimRegExp("foo$\\n");
          assertMatch("foo\nbar", regex);
          assertNotMatch("foo", regex);
        });
        it("matches front of '\\n' in string.", () => {
          const regex = new VimRegExp("foo$");
          assertMatch("foo\nbar", regex);
        });
      });
      describe("With options `{stringMatch: true}`", () => {
        it("matches end-of-line when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo$", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches literal '$' when at middle of pattern.", () => {
          const regex = new VimRegExp("foo$bar", { stringMatch: true });
          assertMatchResult("foo$bar", regex, ["foo$bar"]);
        });
        it("matches literal '$' when at beginning of pattern.", () => {
          const regex = new VimRegExp("$foo", { stringMatch: true });
          assertMatchResult("$foo", regex, ["$foo"]);
        });
        it("matches end-of-line when front of '\\|' in pattern.", () => {
          const regex = new VimRegExp("foo$\\|bar", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\)' in pattern.", () => {
          const regex = new VimRegExp("\\(foo$\\)", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\&' in pattern.", () => {
          const regex = new VimRegExp("foo$\\&.", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("does not matches end-of-line when front of '\\n' in pattern.", () => {
          const regex = new VimRegExp("foo$\\n", { stringMatch: true });
          assertNotMatch("foo\nbar", regex);
          assertNotMatch("foo", regex);
        });
        it("does not matches front of '\\n' in string.", () => {
          const regex = new VimRegExp("foo$", { stringMatch: true });
          assertNotMatch("foo\nbar", regex);
        });
      });
    });
    describe("\\$", () => {
      it("matches literal '$' when at trailing of pattern.", () => {
        const regex = new VimRegExp("foo\\$");
        assertMatch("foo$", regex);
        assertNotMatch("foo", regex);
      });
      it("matches literal '$' when at middle of pattern.", () => {
        const regex = new VimRegExp("foo\\$bar");
        assertMatchResult("foo$bar", regex, ["foo$bar"]);
      });
      it("matches literal '$' when at trailing of pattern.", () => {
        const regex = new VimRegExp("foo\\$");
        assertMatchResult("foo$", regex, ["foo$"]);
      });
    });
    describe("\\_$", () => {
      describe("Without options (same as `{stringMatch: false}`)", () => {
        it("matches end-of-line when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo\\_$");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when at middle of pattern.", () => {
          const regex = new VimRegExp("foo\\_$x\\?");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\_$x\\?");
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 3);
        });
        it("matches end-of-line when front of '\\|' in pattern.", () => {
          const regex = new VimRegExp("foo\\_$\\|bar");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\)' in pattern.", () => {
          const regex = new VimRegExp("\\(foo\\_$\\)");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\&' in pattern.", () => {
          const regex = new VimRegExp("foo\\_$\\&.");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\n' in pattern.", () => {
          const regex = new VimRegExp("foo\\_$\\n");
          assertMatch("foo\nbar", regex);
          assertNotMatch("foo", regex);
        });
        it("matches front of '\\n' in string.", () => {
          const regex = new VimRegExp("foo\\_$");
          assertMatch("foo\nbar", regex);
        });
      });
      describe("With options `{stringMatch: true}`", () => {
        it("matches end-of-line when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo\\_$", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when at middle of pattern.", () => {
          const regex = new VimRegExp("foo\\_$x\\?", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\_$x\\?", { stringMatch: true });
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 3);
        });
        it("matches end-of-line when front of '\\|' in pattern.", () => {
          const regex = new VimRegExp("foo\\_$\\|bar", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\)' in pattern.", () => {
          const regex = new VimRegExp("\\(foo\\_$\\)", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end-of-line when front of '\\&' in pattern.", () => {
          const regex = new VimRegExp("foo\\_$\\&.", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("does not matches end-of-line when front of '\\n' in pattern.", () => {
          const regex = new VimRegExp("foo\\_$\\n", { stringMatch: true });
          assertNotMatch("foo\nbar", regex);
          assertNotMatch("foo", regex);
        });
        it("does not matches front of '\\n' in string.", () => {
          const regex = new VimRegExp("foo\\_$", { stringMatch: true });
          assertNotMatch("foo\nbar", regex);
        });
      });
    });
    describe(".", () => {
      it("matches any single character except '\\n'.", () => {
        const regex = new VimRegExp("x.z");
        assertMatch("xyz", regex);
        assertMatch("x.z", regex);
        assertMatch("x$z", regex);
        assertMatch("x\rz", regex);
        assertNotMatch("x\nz", regex);
        assertNotMatch("xz", regex);
        assertNotMatch("xyyz", regex);
      });
    });
    describe("\\_.", () => {
      it("matches any single character or '\\n'.", () => {
        const regex = new VimRegExp("x\\_.z");
        assertMatch("xyz", regex);
        assertMatch("x.z", regex);
        assertMatch("x$z", regex);
        assertMatch("x\rz", regex);
        assertMatch("x\nz", regex);
        assertNotMatch("xz", regex);
        assertNotMatch("xyyz", regex);
      });
    });
    describe("\\<", () => {
      it("matches beginning of word.", () => {
        const regex = new VimRegExp("\\<bar");
        assertMatch("bar", regex);
        assertMatch("foo bar", regex);
        assertMatch("foo\u3000bar", regex);
      });
      it("does not match except at beginning of word.", () => {
        const regex = new VimRegExp("\\<bar");
        assertNotMatch("foobar", regex);
      });
    });
    describe("\\>", () => {
      it("matches end of word.", () => {
        const regex = new VimRegExp("foo\\>");
        assertMatch("foo", regex);
        assertMatch("foo bar", regex);
        assertMatch("foo\u3000bar", regex);
      });
      it("does not match except at end of word.", () => {
        const regex = new VimRegExp("foo\\>");
        assertNotMatch("foobar", regex);
      });
    });
    describe("\\zs", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\zs"),
          UnsupportedSyntaxError,
          ": \\zs",
        );
      });
    });
    describe("\\ze", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\ze"),
          UnsupportedSyntaxError,
          ": \\ze",
        );
      });
    });
    describe("\\%^", () => {
      describe("Without options (same as `{stringMatch: false}`)", () => {
        it("matches start of the file when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\%^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start of the file when at middle of pattern.", () => {
          const regex = new VimRegExp("x\\?\\%^foo");
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start of the file when at trailing of pattern.", () => {
          const regex = new VimRegExp("x\\?\\%^");
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 0);
        });
        it("does not matches when after '\\n' in string.", () => {
          const regex = new VimRegExp("\\%^foo");
          assertNotMatch("bar\nfoo", regex);
        });
      });
      describe("With options `{stringMatch: true}`", () => {
        it("matches start of the file when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\%^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start of the file when at middle of pattern.", () => {
          const regex = new VimRegExp("x\\?\\%^foo", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("xfoo", regex);
        });
        it("matches start of the file when at trailing of pattern.", () => {
          const regex = new VimRegExp("x\\?\\%^", { stringMatch: true });
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 0);
        });
        it("does not matches when after '\\n' in string.", () => {
          const regex = new VimRegExp("\\%^foo", { stringMatch: true });
          assertNotMatch("bar\nfoo", regex);
        });
      });
    });
    describe("\\%$", () => {
      describe("Without options (same as `{stringMatch: false}`)", () => {
        it("matches end of the file when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo\\%$");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end of the file when at middle of pattern.", () => {
          const regex = new VimRegExp("foo\\%$x\\?");
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end of the file when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\%$x\\?");
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 3);
        });
        it("does not matches when front of '\\n' in string.", () => {
          const regex = new VimRegExp("foo\\%$");
          assertNotMatch("foo\nbar", regex);
        });
      });
      describe("With options `{stringMatch: true}`", () => {
        it("matches end of the file when at trailing of pattern.", () => {
          const regex = new VimRegExp("foo\\%$", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end of the file when at middle of pattern.", () => {
          const regex = new VimRegExp("foo\\%$x\\?", { stringMatch: true });
          assertMatch("foo", regex);
          assertNotMatch("foox", regex);
        });
        it("matches end of the file when at beginning of pattern.", () => {
          const regex = new VimRegExp("\\%$x\\?", { stringMatch: true });
          assertMatch("foo", regex);
          const actual = "foo".match(regex);
          assertEquals(actual!.index, 3);
        });
        it("does not matches when front of '\\n' in string.", () => {
          const regex = new VimRegExp("foo\\%$", { stringMatch: true });
          assertNotMatch("foo\nbar", regex);
        });
      });
    });
  });
  describe("Vim buffer dependent atoms", () => {
    describe("\\%V", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%V"),
          UnsupportedSyntaxError,
          ": \\%V",
        );
      });
    });
    describe("\\%#", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%#"),
          UnsupportedSyntaxError,
          ": \\%#",
        );
      });
    });
    describe("\\%'m", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%'m"),
          UnsupportedSyntaxError,
          ": \\%'m",
        );
      });
    });
    describe("\\%<'m", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%<'m"),
          UnsupportedSyntaxError,
          ": \\%<'m",
        );
      });
    });
    describe("\\%>'m", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%>'m"),
          UnsupportedSyntaxError,
          ": \\%>'m",
        );
      });
    });
    describe("\\%23l", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%23l"),
          UnsupportedSyntaxError,
          ": \\%23l",
        );
      });
    });
    describe("\\%<23l", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%<23l"),
          UnsupportedSyntaxError,
          ": \\%<23l",
        );
      });
    });
    describe("\\%>23l", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%>23l"),
          UnsupportedSyntaxError,
          ": \\%>23l",
        );
      });
    });
    describe("\\%.l", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%.l"),
          UnsupportedSyntaxError,
          ": \\%.l",
        );
      });
    });
    describe("\\%<.l", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%<.l"),
          UnsupportedSyntaxError,
          ": \\%<.l",
        );
      });
    });
    describe("\\%>.l", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%>.l"),
          UnsupportedSyntaxError,
          ": \\%>.l",
        );
      });
    });
    describe("\\%23c", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%23c"),
          UnsupportedSyntaxError,
          ": \\%23c",
        );
      });
    });
    describe("\\%<23c", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%<23c"),
          UnsupportedSyntaxError,
          ": \\%<23c",
        );
      });
    });
    describe("\\%>23c", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%>23c"),
          UnsupportedSyntaxError,
          ": \\%>23c",
        );
      });
    });
    describe("\\%.c", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%.c"),
          UnsupportedSyntaxError,
          ": \\%.c",
        );
      });
    });
    describe("\\%<.c", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%<.c"),
          UnsupportedSyntaxError,
          ": \\%<.c",
        );
      });
    });
    describe("\\%>.c", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%>.c"),
          UnsupportedSyntaxError,
          ": \\%>.c",
        );
      });
    });
    describe("\\%23v", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%23v"),
          UnsupportedSyntaxError,
          ": \\%23v",
        );
      });
    });
    describe("\\%<23v", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%<23v"),
          UnsupportedSyntaxError,
          ": \\%<23v",
        );
      });
    });
    describe("\\%>23v", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%>23v"),
          UnsupportedSyntaxError,
          ": \\%>23v",
        );
      });
    });
    describe("\\%.v", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%.v"),
          UnsupportedSyntaxError,
          ": \\%.v",
        );
      });
    });
    describe("\\%<.v", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%<.v"),
          UnsupportedSyntaxError,
          ": \\%<.v",
        );
      });
    });
    describe("\\%>.v", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%>.v"),
          UnsupportedSyntaxError,
          ": \\%>.v",
        );
      });
    });
  });
  describe("Character classes for ASCII and Unicode", () => {
    describe("\\i", () => {
      it("matches identifier characters.", () => {
        const regex = new VimRegExp("\\i");
        assertNotMatch(" ", regex, "Is not contains");
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\u03b1", regex, "Unicode Greek characters");
        assertNotMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertNotMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertNotMatch("\u4e9c", regex, "Unicode Han characters");
        assertNotMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertNotMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\i$");
        assertMatch("x", regex, "ASCII");
        assertNotMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\i\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\xff\xff\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isident' option.", () => {
        const regex = new VimRegExp("\\i", { isident: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertMatch("3", regex, "'48-57' is contains");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "'Is not contains");
        assertNotMatch("\xa0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertNotMatch("\u0100", regex, "Is over 255");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\i");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\I", () => {
      it("matches identifier character except digits.", () => {
        const regex = new VimRegExp("\\I");
        assertNotMatch(" ", regex, "Is not contains");
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\u03b1", regex, "Unicode Greek characters");
        assertNotMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertNotMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertNotMatch("\u4e9c", regex, "Unicode Han characters");
        assertNotMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertNotMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\I$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\I\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\xff\xff\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isident' option except digits.", () => {
        const regex = new VimRegExp("\\I", { isident: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "'Is not contains");
        assertNotMatch("\xc0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertNotMatch("\u0100", regex, "Is over 255");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\I");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\k", () => {
      it("matches keyword characters.", () => {
        const regex = new VimRegExp("\\k");
        assertNotMatch(" ", regex, "Is not contains");
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\f$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\k\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'iskeyword' option.", () => {
        const regex = new VimRegExp("\\k", { iskeyword: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertMatch("3", regex, "'48-57' is contains");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "Is not contains");
        assertNotMatch("\xc0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertMatch("\u0100", regex, "Is over 255, but Unicode word is always enabled");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\k");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\K", () => {
      it("matches keyword character except digits.", () => {
        const regex = new VimRegExp("\\K");
        assertNotMatch(" ", regex, "Is not contains");
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\K$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\K\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'iskeyword' option except digits.", () => {
        const regex = new VimRegExp("\\K", { iskeyword: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "'Is not contains");
        assertNotMatch("\xc0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertMatch("\u0100", regex, "Is over 255, but Unicode word is always enabled");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\K");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\f", () => {
      it("matches file name characters.", () => {
        const regex = new VimRegExp("\\f");
        assertNotMatch(" ", regex, "Is not contains");
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\f$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\f\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isfname' option.", () => {
        const regex = new VimRegExp("\\f", { isfname: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertMatch("3", regex, "'48-57' is contains");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\f");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\F", () => {
      it("matches file name character except digits.", () => {
        const regex = new VimRegExp("\\F");
        assertNotMatch(" ", regex, "Is not contains");
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\F$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\F\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isfname' option except digits.", () => {
        const regex = new VimRegExp("\\F", { isfname: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\F");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\p", () => {
      it("matches printable characters.", () => {
        const regex = new VimRegExp("\\p");
        assertMatch(" ", regex);
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\x9f", regex, "Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\p$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\p\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isprint' option.", () => {
        const regex = new VimRegExp("\\p", { isprint: "20,144" });
        assertMatch("\x14", regex, "'20' is contains");
        assertMatch("3", regex, "Is not contains, but it is always enabled");
        assertMatch("x", regex, "Is not contains, but it is always enabled");
        assertMatch("_", regex, "Is not contains, but it is always enabled");
        assertMatch(".", regex, "Is not contains, but it is always enabled");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\p");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\P", () => {
      it("matches printable character except digits.", () => {
        const regex = new VimRegExp("\\P");
        assertMatch(" ", regex);
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\P$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\P\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isprint' option except digits.", () => {
        const regex = new VimRegExp("\\P", { isprint: "20,48-57,144" });
        assertMatch("\x14", regex, "'20' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertMatch("x", regex, "Is not contains, but it is always enabled");
        assertMatch("_", regex, "Is not contains, but it is always enabled");
        assertMatch(".", regex, "Is not contains, but it is always enabled");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\P");
        assertNotMatch("\n", regex);
      });
    });
  });
  describe("Character classes for ASCII", () => {
    describe("\\s", () => {
      it("matches <Space> and <Tab>.", () => {
        const regex = new VimRegExp("\\s");
        assertMatch(" ", regex);
        assertMatch("\t", regex);
        assertNotMatch("3", regex);
        assertNotMatch("x", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\s$");
        assertMatch(" ", regex);
        assertMatch("\t", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("  ", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\s\\{3}$");
        assertMatch(" \t ", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("  ", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\s");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\S", () => {
      it("matches except <Space> and <Tab>.", () => {
        const regex = new VimRegExp("\\S");
        assertNotMatch(" ", regex);
        assertNotMatch("\t", regex);
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\S$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\S\\{3}$");
        assertMatch("3x\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\S");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\d", () => {
      it("matches digits.", () => {
        const regex = new VimRegExp("\\d");
        const digit = "0123456789";
        for (const c of digit) {
          assertMatch(c, regex);
        }
        assertNotMatch("x", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\d$");
        assertMatch("3", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("33", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\d\\{3}$");
        assertMatch("123", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("12", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\d");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\D", () => {
      it("matches non-digits.", () => {
        const regex = new VimRegExp("\\D");
        const digit = "0123456789";
        for (const c of digit) {
          assertNotMatch(c, regex);
        }
        assertMatch("x", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\D$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\D\\{3}$");
        assertMatch("x.\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\D");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\x", () => {
      it("matches hex digits.", () => {
        const regex = new VimRegExp("\\x");
        const hexDigit = "0123456789abcdefABCDEF";
        for (const c of hexDigit) {
          assertMatch(c, regex);
        }
        assertNotMatch("g", regex);
        assertNotMatch("G", regex);
        assertNotMatch("x", regex);
        assertNotMatch("X", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\x$");
        assertMatch("3", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("33", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\x\\{3}$");
        assertMatch("123", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("12", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\x");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\X", () => {
      it("matches non-hex digits.", () => {
        const regex = new VimRegExp("\\X");
        const hexDigit = "0123456789abcdefABCDEF";
        for (const c of hexDigit) {
          assertNotMatch(c, regex);
        }
        assertMatch("g", regex);
        assertMatch("G", regex);
        assertMatch("x", regex);
        assertMatch("X", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\X$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\X\\{3}$");
        assertMatch("x.\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\X");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\o", () => {
      it("matches octal digits.", () => {
        const regex = new VimRegExp("\\o");
        const octal = "01234567";
        for (const c of octal) {
          assertMatch(c, regex);
        }
        assertNotMatch("8", regex);
        assertNotMatch("9", regex);
        assertNotMatch("a", regex);
        assertNotMatch("x", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\o$");
        assertMatch("3", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("33", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\o\\{3}$");
        assertMatch("123", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("12", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\o");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\O", () => {
      it("matches non-octal digits.", () => {
        const regex = new VimRegExp("\\O");
        const octal = "01234567";
        for (const c of octal) {
          assertNotMatch(c, regex);
        }
        assertMatch("8", regex);
        assertMatch("9", regex);
        assertMatch("a", regex);
        assertMatch("x", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\O$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\O\\{3}$");
        assertMatch("x.\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\O");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\w", () => {
      it("matches word character.", () => {
        const regex = new VimRegExp("\\w");
        const word = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of word) {
          assertMatch(c, regex);
        }
        assertNotMatch(" ", regex);
        assertNotMatch("-", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\w$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\w\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\w");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\W", () => {
      it("matches non-word character.", () => {
        const regex = new VimRegExp("\\W");
        const word = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of word) {
          assertNotMatch(c, regex);
        }
        assertMatch(" ", regex);
        assertMatch("-", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\W$");
        assertMatch("-", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("--", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\W\\{3}$");
        assertMatch("-.!", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("-.", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\W");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\h", () => {
      it("matches head of word character.", () => {
        const regex = new VimRegExp("\\h");
        const head = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of head) {
          assertMatch(c, regex);
        }
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("-", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\h$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\h\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\h");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\H", () => {
      it("matches non-head of word character.", () => {
        const regex = new VimRegExp("\\H");
        const head = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of head) {
          assertNotMatch(c, regex);
        }
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("-", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\H$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\H\\{3}$");
        assertMatch("0-.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0-", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\H");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\a", () => {
      it("matches alphabetic character.", () => {
        const regex = new VimRegExp("\\a");
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of alphabet) {
          assertMatch(c, regex);
        }
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\a$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\a\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\a");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\A", () => {
      it("matches non-alphabetic character.", () => {
        const regex = new VimRegExp("\\A");
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of alphabet) {
          assertNotMatch(c, regex);
        }
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\A$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\A\\{3}$");
        assertMatch("0_.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0_", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\A");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\l", () => {
      it("matches lowercase character.", () => {
        const regex = new VimRegExp("\\l");
        const lower = "abcdefghijklmnopqrstuvwxyz";
        for (const c of lower) {
          assertMatch(c, regex);
        }
        assertNotMatch("A", regex);
        assertNotMatch("Z", regex);
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\l$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\l\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\l");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\L", () => {
      it("matches non-lowercase character.", () => {
        const regex = new VimRegExp("\\L");
        const lower = "abcdefghijklmnopqrstuvwxyz";
        for (const c of lower) {
          assertNotMatch(c, regex);
        }
        assertMatch("A", regex);
        assertMatch("Z", regex);
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\L$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\L\\{3}$");
        assertMatch("0_.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0_", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\L");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\u", () => {
      it("matches uppercase character.", () => {
        const regex = new VimRegExp("\\u");
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of upper) {
          assertMatch(c, regex);
        }
        assertNotMatch("a", regex);
        assertNotMatch("z", regex);
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff21", regex, "Unicode Fullwidth Latin Capital Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\u$");
        assertMatch("X", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("XX", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\u\\{3}$");
        assertMatch("ABC", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("AB", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\u");
        assertNotMatch("\n", regex);
      });
    });
    describe("\\U", () => {
      it("matches non-uppercase character.", () => {
        const regex = new VimRegExp("\\U");
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of upper) {
          assertNotMatch(c, regex);
        }
        assertMatch("a", regex);
        assertMatch("z", regex);
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff21", regex, "Unicode Fullwidth Latin Capital Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\U$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\U\\{3}$");
        assertMatch("0_.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0_", regex, "Do not match two characters");
      });
      it("should not match '\\n'.", () => {
        const regex = new VimRegExp("\\U");
        assertNotMatch("\n", regex);
      });
    });
  });
  describe("Character classes for ASCII and Unicode with LF", () => {
    describe("\\_i", () => {
      it("matches identifier characters.", () => {
        const regex = new VimRegExp("\\_i");
        assertNotMatch(" ", regex, "Is not contains");
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\u03b1", regex, "Unicode Greek characters");
        assertNotMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertNotMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertNotMatch("\u4e9c", regex, "Unicode Han characters");
        assertNotMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertNotMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_i$");
        assertMatch("x", regex, "ASCII");
        assertNotMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_i\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\xff\xff\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isident' option.", () => {
        const regex = new VimRegExp("\\_i", { isident: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertMatch("3", regex, "'48-57' is contains");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "'Is not contains");
        assertNotMatch("\xa0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertNotMatch("\u0100", regex, "Is over 255");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_i");
        assertMatch("\n", regex);
      });
    });
    describe("\\_I", () => {
      it("matches identifier character except digits.", () => {
        const regex = new VimRegExp("\\_I");
        assertNotMatch(" ", regex, "Is not contains");
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\u03b1", regex, "Unicode Greek characters");
        assertNotMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertNotMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertNotMatch("\u4e9c", regex, "Unicode Han characters");
        assertNotMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertNotMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_I$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_I\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\xff\xff\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isident' option except digits.", () => {
        const regex = new VimRegExp("\\_I", { isident: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "'Is not contains");
        assertNotMatch("\xc0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertNotMatch("\u0100", regex, "Is over 255");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_I");
        assertMatch("\n", regex);
      });
    });
    describe("\\_k", () => {
      it("matches keyword characters.", () => {
        const regex = new VimRegExp("\\_k");
        assertNotMatch(" ", regex, "Is not contains");
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_f$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_k\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'iskeyword' option.", () => {
        const regex = new VimRegExp("\\_k", { iskeyword: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertMatch("3", regex, "'48-57' is contains");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "Is not contains");
        assertNotMatch("\xc0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertMatch("\u0100", regex, "Is over 255, but Unicode word is always enabled");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_k");
        assertMatch("\n", regex);
      });
    });
    describe("\\_K", () => {
      it("matches keyword character except digits.", () => {
        const regex = new VimRegExp("\\_K");
        assertNotMatch(" ", regex, "Is not contains");
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertNotMatch(".", regex, "Is not contains");
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
        assertMatch("\xc0", regex, "Unicode word character inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_K$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_K\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'iskeyword' option except digits.", () => {
        const regex = new VimRegExp("\\_K", { iskeyword: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\xbf", regex, "'Is not contains");
        assertNotMatch("\xc0", regex, "Is not contains");
        assertNotMatch("\xff", regex, "Is not contains");
        assertMatch("\u0100", regex, "Is over 255, but Unicode word is always enabled");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_K");
        assertMatch("\n", regex);
      });
    });
    describe("\\_f", () => {
      it("matches file name characters.", () => {
        const regex = new VimRegExp("\\_f");
        assertNotMatch(" ", regex, "Is not contains");
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_f$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_f\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isfname' option.", () => {
        const regex = new VimRegExp("\\_f", { isfname: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertMatch("3", regex, "'48-57' is contains");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_f");
        assertMatch("\n", regex);
      });
    });
    describe("\\_F", () => {
      it("matches file name character except digits.", () => {
        const regex = new VimRegExp("\\_F");
        assertNotMatch(" ", regex, "Is not contains");
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_F$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_F\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isfname' option except digits.", () => {
        const regex = new VimRegExp("\\_F", { isfname: "48-57,32,.,144" });
        assertMatch(" ", regex, "'32' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertNotMatch("x", regex, "Is not contains");
        assertNotMatch("_", regex, "Is not contains");
        assertMatch(".", regex, "'.' is contains");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_F");
        assertMatch("\n", regex);
      });
    });
    describe("\\_p", () => {
      it("matches printable characters.", () => {
        const regex = new VimRegExp("\\_p");
        assertMatch(" ", regex);
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\x9f", regex, "Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_p$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_p\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isprint' option.", () => {
        const regex = new VimRegExp("\\_p", { isprint: "20,144" });
        assertMatch("\x14", regex, "'20' is contains");
        assertMatch("3", regex, "Is not contains, but it is always enabled");
        assertMatch("x", regex, "Is not contains, but it is always enabled");
        assertMatch("_", regex, "Is not contains, but it is always enabled");
        assertMatch(".", regex, "Is not contains, but it is always enabled");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_p");
        assertMatch("\n", regex);
      });
    });
    describe("\\_P", () => {
      it("matches printable character except digits.", () => {
        const regex = new VimRegExp("\\_P");
        assertMatch(" ", regex);
        assertNotMatch("3", regex, "Is digits");
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertNotMatch("\x90", regex, "Is not contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u03b1", regex, "Unicode Greek characters");
        assertMatch("\u0414", regex, "Unicode Cyrillic characters");
        assertMatch("\u2764", regex, "Unicode Emoji");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
        assertMatch("\u4e9c", regex, "Unicode Han characters");
        assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_P$");
        assertMatch("x", regex, "ASCII");
        assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_P\\{3}$");
        assertMatch("abc", regex, "ASCII");
        assertMatch("\u{1f680}\u{1f681}\u{1f682}", regex, "Unicode Emoji (surrogate pairs)");
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches characters given by 'isprint' option except digits.", () => {
        const regex = new VimRegExp("\\_P", { isprint: "20,48-57,144" });
        assertMatch("\x14", regex, "'20' is contains");
        assertNotMatch("3", regex, "'48-57' is contains, but it is digits");
        assertMatch("x", regex, "Is not contains, but it is always enabled");
        assertMatch("_", regex, "Is not contains, but it is always enabled");
        assertMatch(".", regex, "Is not contains, but it is always enabled");
        assertMatch("\x90", regex, "'144' is contains");
        assertNotMatch("\x9f", regex, "'Is not contains");
        assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
        assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
        assertMatch("\u{10ffff}", regex, "Unicode maximum value");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_P");
        assertMatch("\n", regex);
      });
    });
  });
  describe("Character classes for ASCII with LF", () => {
    describe("\\_s", () => {
      it("matches <Space> and <Tab>.", () => {
        const regex = new VimRegExp("\\_s");
        assertMatch(" ", regex);
        assertMatch("\t", regex);
        assertNotMatch("3", regex);
        assertNotMatch("x", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_s$");
        assertMatch(" ", regex);
        assertMatch("\t", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("  ", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_s\\{3}$");
        assertMatch(" \t ", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("  ", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_s");
        assertMatch("\n", regex);
      });
    });
    describe("\\_S", () => {
      it("matches except <Space> and <Tab>.", () => {
        const regex = new VimRegExp("\\_S");
        assertNotMatch(" ", regex);
        assertNotMatch("\t", regex);
        assertMatch("3", regex);
        assertMatch("x", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\u3000", regex, "Unicode Ideographic Space");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_S$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_S\\{3}$");
        assertMatch("3x\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_S");
        assertMatch("\n", regex);
      });
    });
    describe("\\_d", () => {
      it("matches digits.", () => {
        const regex = new VimRegExp("\\_d");
        const digit = "0123456789";
        for (const c of digit) {
          assertMatch(c, regex);
        }
        assertNotMatch("x", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_d$");
        assertMatch("3", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("33", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_d\\{3}$");
        assertMatch("123", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("12", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_d");
        assertMatch("\n", regex);
      });
    });
    describe("\\_D", () => {
      it("matches non-digits.", () => {
        const regex = new VimRegExp("\\_D");
        const digit = "0123456789";
        for (const c of digit) {
          assertNotMatch(c, regex);
        }
        assertMatch("x", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_D$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_D\\{3}$");
        assertMatch("x.\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_D");
        assertMatch("\n", regex);
      });
    });
    describe("\\_x", () => {
      it("matches hex digits.", () => {
        const regex = new VimRegExp("\\_x");
        const hexDigit = "0123456789abcdefABCDEF";
        for (const c of hexDigit) {
          assertMatch(c, regex);
        }
        assertNotMatch("g", regex);
        assertNotMatch("G", regex);
        assertNotMatch("x", regex);
        assertNotMatch("X", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_x$");
        assertMatch("3", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("33", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_x\\{3}$");
        assertMatch("123", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("12", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_x");
        assertMatch("\n", regex);
      });
    });
    describe("\\_X", () => {
      it("matches non-hex digits.", () => {
        const regex = new VimRegExp("\\_X");
        const hexDigit = "0123456789abcdefABCDEF";
        for (const c of hexDigit) {
          assertNotMatch(c, regex);
        }
        assertMatch("g", regex);
        assertMatch("G", regex);
        assertMatch("x", regex);
        assertMatch("X", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_X$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_X\\{3}$");
        assertMatch("x.\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_X");
        assertMatch("\n", regex);
      });
    });
    describe("\\_o", () => {
      it("matches octal digits.", () => {
        const regex = new VimRegExp("\\_o");
        const octal = "01234567";
        for (const c of octal) {
          assertMatch(c, regex);
        }
        assertNotMatch("8", regex);
        assertNotMatch("9", regex);
        assertNotMatch("a", regex);
        assertNotMatch("x", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_o$");
        assertMatch("3", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("33", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_o\\{3}$");
        assertMatch("123", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("12", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_o");
        assertMatch("\n", regex);
      });
    });
    describe("\\_O", () => {
      it("matches non-octal digits.", () => {
        const regex = new VimRegExp("\\_O");
        const octal = "01234567";
        for (const c of octal) {
          assertNotMatch(c, regex);
        }
        assertMatch("8", regex);
        assertMatch("9", regex);
        assertMatch("a", regex);
        assertMatch("x", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_O$");
        assertMatch("x", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_O\\{3}$");
        assertMatch("x.\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_O");
        assertMatch("\n", regex);
      });
    });
    describe("\\_w", () => {
      it("matches word character.", () => {
        const regex = new VimRegExp("\\_w");
        const word = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of word) {
          assertMatch(c, regex);
        }
        assertNotMatch(" ", regex);
        assertNotMatch("-", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_w$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_w\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_w");
        assertMatch("\n", regex);
      });
    });
    describe("\\_W", () => {
      it("matches non-word character.", () => {
        const regex = new VimRegExp("\\_W");
        const word = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of word) {
          assertNotMatch(c, regex);
        }
        assertMatch(" ", regex);
        assertMatch("-", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_W$");
        assertMatch("-", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("--", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_W\\{3}$");
        assertMatch("-.!", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("-.", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_W");
        assertMatch("\n", regex);
      });
    });
    describe("\\_h", () => {
      it("matches head of word character.", () => {
        const regex = new VimRegExp("\\_h");
        const head = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of head) {
          assertMatch(c, regex);
        }
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("-", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_h$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_h\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_h");
        assertMatch("\n", regex);
      });
    });
    describe("\\_H", () => {
      it("matches non-head of word character.", () => {
        const regex = new VimRegExp("\\_H");
        const head = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_";
        for (const c of head) {
          assertNotMatch(c, regex);
        }
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("-", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_H$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_H\\{3}$");
        assertMatch("0-.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0-", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_H");
        assertMatch("\n", regex);
      });
    });
    describe("\\_a", () => {
      it("matches alphabetic character.", () => {
        const regex = new VimRegExp("\\_a");
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of alphabet) {
          assertMatch(c, regex);
        }
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_a$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_a\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_a");
        assertMatch("\n", regex);
      });
    });
    describe("\\_A", () => {
      it("matches non-alphabetic character.", () => {
        const regex = new VimRegExp("\\_A");
        const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of alphabet) {
          assertNotMatch(c, regex);
        }
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_A$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_A\\{3}$");
        assertMatch("0_.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0_", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_A");
        assertMatch("\n", regex);
      });
    });
    describe("\\_l", () => {
      it("matches lowercase character.", () => {
        const regex = new VimRegExp("\\_l");
        const lower = "abcdefghijklmnopqrstuvwxyz";
        for (const c of lower) {
          assertMatch(c, regex);
        }
        assertNotMatch("A", regex);
        assertNotMatch("Z", regex);
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_l$");
        assertMatch("x", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("xx", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_l\\{3}$");
        assertMatch("abc", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("ab", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_l");
        assertMatch("\n", regex);
      });
    });
    describe("\\_L", () => {
      it("matches non-lowercase character.", () => {
        const regex = new VimRegExp("\\_L");
        const lower = "abcdefghijklmnopqrstuvwxyz";
        for (const c of lower) {
          assertNotMatch(c, regex);
        }
        assertMatch("A", regex);
        assertMatch("Z", regex);
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff41", regex, "Unicode Fullwidth Latin Small Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_L$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_L\\{3}$");
        assertMatch("0_.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0_", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_L");
        assertMatch("\n", regex);
      });
    });
    describe("\\_u", () => {
      it("matches uppercase character.", () => {
        const regex = new VimRegExp("\\_u");
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of upper) {
          assertMatch(c, regex);
        }
        assertNotMatch("a", regex);
        assertNotMatch("z", regex);
        assertNotMatch("0", regex);
        assertNotMatch("9", regex);
        assertNotMatch(" ", regex);
        assertNotMatch("_", regex);
        assertNotMatch(".", regex);
        assertNotMatch("\x90", regex);
        assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertNotMatch("\xb2", regex, "Unicode Superscript Two");
        assertNotMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertNotMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertNotMatch("\uff21", regex, "Unicode Fullwidth Latin Capital Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_u$");
        assertMatch("X", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("XX", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_u\\{3}$");
        assertMatch("ABC", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("AB", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_u");
        assertMatch("\n", regex);
      });
    });
    describe("\\_U", () => {
      it("matches non-uppercase character.", () => {
        const regex = new VimRegExp("\\_U");
        const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        for (const c of upper) {
          assertNotMatch(c, regex);
        }
        assertMatch("a", regex);
        assertMatch("z", regex);
        assertMatch("0", regex);
        assertMatch("9", regex);
        assertMatch(" ", regex);
        assertMatch("_", regex);
        assertMatch(".", regex);
        assertMatch("\x90", regex);
        assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
        assertMatch("\xb2", regex, "Unicode Superscript Two");
        assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
        assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
        assertMatch("\uff10", regex, "Unicode Fullwidth Digit Zero");
        assertMatch("\uff21", regex, "Unicode Fullwidth Latin Capital Letter A");
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\_U$");
        assertMatch("0", regex);
        assertMatch("\u0100", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("00", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\_U\\{3}$");
        assertMatch("0_.", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("0_", regex, "Do not match two characters");
      });
      it("should match '\\_n'.", () => {
        const regex = new VimRegExp("\\_U");
        assertMatch("\n", regex);
      });
    });
  });
  describe("Escaped characters", () => {
    describe("\\e", () => {
      it("matches <Esc>.", () => {
        const regex = new VimRegExp("\\e");
        assertMatch("\x1b", regex);
        assertNotMatch("\x01", regex);
        assertNotMatch("\x1a", regex);
        assertNotMatch("\x1c", regex);
        assertNotMatch("a", regex);
        assertNotMatch("0", regex);
        assertNotMatch(".", regex);
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\e$");
        assertMatch("\x1b", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x1b\x1b", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\e\\{3}$");
        assertMatch("\x1b\x1b\x1b", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x1b\x1b", regex, "Do not match two characters");
      });
    });
    describe("\\t", () => {
      it("matches <Tab>.", () => {
        const regex = new VimRegExp("\\t");
        assertMatch("\x09", regex, "HT");
        assertNotMatch("\x01", regex, "SOH");
        assertNotMatch("\x08", regex, "BS");
        assertNotMatch("\x0a", regex, "LF");
        assertNotMatch("a", regex);
        assertNotMatch("0", regex);
        assertNotMatch(".", regex);
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\t$");
        assertMatch("\x09", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x09\x09", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\t\\{3}$");
        assertMatch("\x09\x09\x09", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x09\x09", regex, "Do not match two characters");
      });
    });
    describe("\\r", () => {
      it("matches <CR>.", () => {
        const regex = new VimRegExp("\\r");
        assertMatch("\x0d", regex, "CR");
        assertNotMatch("\x01", regex, "SOH");
        assertNotMatch("\x0a", regex, "LF");
        assertNotMatch("\x0c", regex, "FF");
        assertNotMatch("\x0e", regex, "SO");
        assertNotMatch("a", regex);
        assertNotMatch("0", regex);
        assertNotMatch(".", regex);
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\r$");
        assertMatch("\x0d", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x0d\x0d", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\r\\{3}$");
        assertMatch("\x0d\x0d\x0d", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x0d\x0d", regex, "Do not match two characters");
      });
    });
    describe("\\b", () => {
      it("matches <BS>.", () => {
        const regex = new VimRegExp("\\b");
        assertMatch("\x08", regex, "BS");
        assertNotMatch("\x01", regex, "SOH");
        assertNotMatch("\x07", regex, "BEL");
        assertNotMatch("\x09", regex, "HT");
        assertNotMatch("a", regex);
        assertNotMatch("0", regex);
        assertNotMatch(".", regex);
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("^\\b$");
        assertMatch("\x08", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x08\x08", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("^\\b\\{3}$");
        assertMatch("\x08\x08\x08", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("\x08\x08", regex, "Do not match two characters");
      });
    });
    describe("\\n", () => {
      it("matches <LF>.", () => {
        const regex = new VimRegExp("\\n");
        assertMatch("\x0a", regex, "LF");
        assertNotMatch("\x01", regex, "SOH");
        assertNotMatch("\x09", regex, "HT");
        assertNotMatch("\x0b", regex, "VT");
        assertNotMatch("\x0d", regex, "CR");
        assertNotMatch("a", regex);
        assertNotMatch("0", regex);
        assertNotMatch(".", regex);
      });
      it("matches only single character.", () => {
        const regex = new VimRegExp("/\\n/");
        assertMatch("/\x0a/", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("/\x0a\x0a/", regex, "Do not match two characters");
      });
      it("matches specified count of characters.", () => {
        const regex = new VimRegExp("/\\n\\{3}/");
        assertMatch("/\x0a\x0a\x0a/", regex);
        assertNotMatch("", regex, "Do not match empty");
        assertNotMatch("/\x0a\x0a/", regex, "Do not match two characters");
      });
    });
  });
  describe("Replaced string", () => {
    describe("~", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("~"),
          UnsupportedSyntaxError,
          ": ~",
        );
      });
      it("matches literal '~' when use \\~.", () => {
        const regex = new VimRegExp("\\~");
        assertMatchResult("~", regex, ["~"]);
      });
      it("use \\~ when 'magic' is not set.", () => {
        assertThrows(
          () => new VimRegExp("\\~", { magic: false }),
          UnsupportedSyntaxError,
          ": ~",
        );
      });
      it("use ~ when \\v was used.", () => {
        assertThrows(
          () => new VimRegExp("\\v~"),
          UnsupportedSyntaxError,
          ": ~",
        );
      });
      it("use ~ when \\m was used.", () => {
        assertThrows(
          () => new VimRegExp("\\m~"),
          UnsupportedSyntaxError,
          ": ~",
        );
      });
      it("use \\~ when \\M was used.", () => {
        assertThrows(
          () => new VimRegExp("\\M\\~"),
          UnsupportedSyntaxError,
          ": ~",
        );
      });
      it("use \\~ when \\V was used.", () => {
        assertThrows(
          () => new VimRegExp("\\V\\~"),
          UnsupportedSyntaxError,
          ": ~",
        );
      });
    });
  });
  describe("Grouping", () => {
    describe("\\(\\)", () => {
      it("encloses a pattern and returns sub-expressions.", () => {
        const regex = new VimRegExp("f\\(..\\)");
        assertMatchResult("foo", regex, ["foo", "oo"]);
      });
      it("can be nested and returns multiple sub-expressions.", () => {
        const regex = new VimRegExp("\\(foo\\)\\(bar\\(baz\\)\\)");
        assertMatchResult("foobarbaz", regex, ["foobarbaz", "foo", "barbaz", "baz"]);
      });
      it("makes the enclosed pattern into one atom.", () => {
        const regex = new VimRegExp("\\(foo\\)*");
        assertMatchResult("foofoo", regex, ["foofoo", "foo"]);
      });
      it("use \\(\\) when 'magic' is not set.", () => {
        const regex = new VimRegExp("f\\(oo\\)", { magic: false });
        assertMatchResult("foo", regex, ["foo", "oo"]);
      });
      it("use () when \\v was used.", () => {
        const regex = new VimRegExp("\\vf(oo)");
        assertMatchResult("foo", regex, ["foo", "oo"]);
      });
      it("use \\(\\) when \\m was used.", () => {
        const regex = new VimRegExp("\\mf\\(oo\\)");
        assertMatchResult("foo", regex, ["foo", "oo"]);
      });
      it("use \\(\\) when \\M was used.", () => {
        const regex = new VimRegExp("\\Mf\\(oo\\)");
        assertMatchResult("foo", regex, ["foo", "oo"]);
      });
      it("use \\(\\) when \\V was used.", () => {
        const regex = new VimRegExp("\\Vf\\(oo\\)");
        assertMatchResult("foo", regex, ["foo", "oo"]);
      });
    });
    describe("\\1 \\2 ... \\9", () => {
      it("matches same string that was matched by first sub-expression.", () => {
        const regex = new VimRegExp("\\([a-z]\\)x\\1");
        assertMatch("axa", regex);
        assertMatch("bxb", regex);
        assertNotMatch("axb", regex);
      });
      it("matches second sub-expression when uses \\2.", () => {
        const regex = new VimRegExp("\\([a-z]\\)\\([a-z]\\)\\2");
        assertMatch("abb", regex);
        assertMatch("acc", regex);
        assertNotMatch("aca", regex);
      });
      it("matches ninth sub-expression when uses \\9.", () => {
        const regex = new VimRegExp(
          "\\(a\\)\\(b\\)\\(c\\)\\(d\\)\\(e\\)\\(f\\)\\(g\\)\\(h\\)\\(i\\)\\9",
        );
        assertMatch("abcdefghii", regex);
        assertNotMatch("abcdefghij", regex);
      });
      it("is only one digit.", () => {
        const regex = new VimRegExp("\\(foo\\)\\10");
        assertMatch("foofoo0", regex, "Matches 'foo' + \\1 + '0'.");
      });
    });
    describe("\\|", () => {
      it("splits the pattern into branches.", () => {
        const regex = new VimRegExp("foo\\|bar");
        assertMatch("foo", regex);
        assertMatch("bar", regex);
        assertNotMatch("baz", regex);
      });
      it("splits the pattern into many branches.", () => {
        const regex = new VimRegExp("foo\\|bar\\|baz\\|qux");
        assertMatch("foo", regex);
        assertMatch("bar", regex);
        assertMatch("baz", regex);
        assertMatch("qux", regex);
        assertNotMatch("quux", regex);
      });
      it("splits the pattern in the group.", () => {
        const regex = new VimRegExp("foo\\(X\\|Y\\|Z\\)bar");
        assertMatch("fooXbar", regex);
        assertMatch("fooYbar", regex);
        assertMatch("fooZbar", regex);
        assertNotMatch("fooXYZbar", regex);
      });
      it("splits the pattern inside and outside the group.", () => {
        const regex = new VimRegExp("foo\\|bar\\(X\\|Y\\)\\|baz");
        assertMatch("foo", regex);
        assertMatch("barX", regex);
        assertMatch("barY", regex);
        assertMatch("baz", regex);
        assertNotMatch("", regex);
      });
      it("use \\| when 'magic' is not set.", () => {
        const regex = new VimRegExp("foo\\|bar", { magic: false });
        assertMatch("foo", regex);
        assertMatch("bar", regex);
        assertNotMatch("baz", regex);
      });
      it("use | when \\v was used.", () => {
        const regex = new VimRegExp("\\vfoo|bar");
        assertMatch("foo", regex);
        assertMatch("bar", regex);
        assertNotMatch("baz", regex);
      });
      it("use \\| when \\m was used.", () => {
        const regex = new VimRegExp("\\mfoo\\|bar");
        assertMatch("foo", regex);
        assertMatch("bar", regex);
        assertNotMatch("baz", regex);
      });
      it("use \\| when \\M was used.", () => {
        const regex = new VimRegExp("\\Mfoo\\|bar");
        assertMatch("foo", regex);
        assertMatch("bar", regex);
        assertNotMatch("baz", regex);
      });
      it("use \\| when \\V was used.", () => {
        const regex = new VimRegExp("\\Vfoo\\|bar");
        assertMatch("foo", regex);
        assertMatch("bar", regex);
        assertNotMatch("baz", regex);
      });
    });
    describe("\\&", () => {
      it("splits the branch into concats.", () => {
        const regex = new VimRegExp("f\\&..o");
        assertMatch("foo", regex);
        assertNotMatch("fox", regex);
      });
      it("splits the branch into many concats.", () => {
        const regex = new VimRegExp("f\\&..o\\&.o.\\&...");
        assertMatch("foo", regex);
        assertNotMatch("fox", regex);
      });
      it("splits the branch in the group.", () => {
        const regex = new VimRegExp("foo\\(X\\&.\\&[A-Z]\\)bar");
        assertMatch("fooXbar", regex);
        assertNotMatch("fooAbar", regex);
      });
      it("splits the branch inside and outside the group.", () => {
        const regex = new VimRegExp(
          "f\\&.o\\([ox]\\&\\([go]\\&.b\\)a\\&...r\\)b\\&.......a.$\\&f.*z",
        );
        assertMatch("foobarbaz", regex);
        assertNotMatch("foxbarbaz", regex);
        assertNotMatch("fogbarbaz", regex);
      });
      it("use \\& when 'magic' is not set.", () => {
        const regex = new VimRegExp("f\\&\\.\\.o", { magic: false });
        assertMatch("foo", regex);
        assertNotMatch("fox", regex);
      });
      it("use & when \\v was used.", () => {
        const regex = new VimRegExp("\\vf&..o");
        assertMatch("foo", regex);
        assertNotMatch("fox", regex);
      });
      it("use \\& when \\m was used.", () => {
        const regex = new VimRegExp("\\mf\\&..o");
        assertMatch("foo", regex);
        assertNotMatch("fox", regex);
      });
      it("use \\& when \\M was used.", () => {
        const regex = new VimRegExp("\\Mf\\&\\.\\.o");
        assertMatch("foo", regex);
        assertNotMatch("fox", regex);
      });
      it("use \\& when \\V was used.", () => {
        const regex = new VimRegExp("\\Vf\\&\\.\\.o");
        assertMatch("foo", regex);
        assertNotMatch("fox", regex);
      });
    });
  });
  describe("Collection", () => {
    describe("[]", () => {
      it("matches any single character in the collection sequence.", () => {
        const regex = new VimRegExp("x[ab]");
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
        assertNotMatch("x\n", regex);
      });
      it("matchs literal '[' when ']' is missing.", () => {
        const regex = new VimRegExp("x[ab");
        assertMatchResult("x[ab", regex, ["x[ab"]);
      });
      it("use \\[] when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\[ab]", { magic: false });
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use [] when \\v was used.", () => {
        const regex = new VimRegExp("\\vx[ab]");
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use [] when \\m was used.", () => {
        const regex = new VimRegExp("\\mx[ab]");
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use \\[] when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\[ab]");
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use \\[] when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\[ab]");
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
    });
    describe("\\_[]", () => {
      it("matches '\\n' and any single character in the collection sequence.", () => {
        const regex = new VimRegExp("x\\_[ab]");
        assertMatch("x\n", regex);
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
        assertNotMatch("x\x0d", regex, "CR");
      });
      it("matches '\\n' and any single character NOT in the collection sequence when '^' is at beginning of the sequence.", () => {
        const regex = new VimRegExp("x\\_[^ab]");
        assertMatch("x\n", regex, "'\\n' always matches.");
        assertNotMatch("xa", regex);
        assertNotMatch("xb", regex);
        assertMatch("xc", regex);
        assertMatch("x\x0d", regex, "CR");
      });
      it("matchs literal '[' when ']' is missing.", () => {
        const regex = new VimRegExp("x\\_[ab");
        assertMatchResult("x[ab", regex, ["x[ab"]);
      });
      it("use \\_[] when 'magic' is not set.", () => {
        const regex = new VimRegExp("x\\_[ab]", { magic: false });
        assertMatch("x\n", regex);
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use _[] when \\v was used.", () => {
        const regex = new VimRegExp("\\vx_[ab]");
        assertMatch("x\n", regex);
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use \\_[] when \\m was used.", () => {
        const regex = new VimRegExp("\\mx\\_[ab]");
        assertMatch("x\n", regex);
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use \\_[] when \\M was used.", () => {
        const regex = new VimRegExp("\\Mx\\_[ab]");
        assertMatch("x\n", regex);
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
      it("use \\_[] when \\V was used.", () => {
        const regex = new VimRegExp("\\Vx\\_[ab]");
        assertMatch("x\n", regex);
        assertMatch("xa", regex);
        assertMatch("xb", regex);
        assertNotMatch("xc", regex);
      });
    });
    describe("Collection sequence", () => {
      describe("\\", () => {
        it("matches literal '\\' when prefixed with '\\'.", () => {
          const regex = new VimRegExp("x[a\\\\c]");
          assertMatch("x\\", regex);
          assertMatch("xa", regex);
          assertMatch("xc", regex);
          assertNotMatch("xb", regex);
        });
        it("can be placed at the start of the range when prefixed with '\\'.", () => {
          const regex = new VimRegExp("x[\\\\-b]");
          assertMatch("x\\", regex);
          assertMatch("xa", regex);
          assertMatch("xb", regex);
          assertNotMatch("xc", regex);
        });
        it("can be placed at the end of the range when prefixed with '\\'.", () => {
          const regex = new VimRegExp("x[Y-\\\\]");
          assertMatch("xY", regex);
          assertMatch("xZ", regex);
          assertMatch("x\\", regex);
          assertNotMatch("xX", regex);
        });
      });
      describe("^", () => {
        it("matches any single character NOT in the collection when at beginning of sequence.", () => {
          const regex = new VimRegExp("x[^ab]");
          assertNotMatch("xa", regex);
          assertNotMatch("xb", regex);
          assertMatch("xc", regex);
        });
        it("matches literal '^' when at middle of sequence.", () => {
          const regex = new VimRegExp("x[a^b]");
          assertMatch("x^", regex);
          assertMatch("xa", regex);
          assertMatch("xb", regex);
          assertNotMatch("xc", regex);
        });
        it("matches literal '^' when at trailing of sequence.", () => {
          const regex = new VimRegExp("x[ab^]");
          assertMatch("x^", regex);
          assertMatch("xa", regex);
          assertMatch("xb", regex);
          assertNotMatch("xc", regex);
        });
        it("matches literal '^' when prefixed with '\\'.", () => {
          const regex = new VimRegExp("x[\\^ab]");
          assertMatch("x^", regex);
          assertMatch("xa", regex);
          assertMatch("xb", regex);
          assertNotMatch("xc", regex);
        });
        it("matches literal '^' when after '^' at beginning of sequence.", () => {
          const regex = new VimRegExp("x[^^ac]");
          assertNotMatch("x^", regex);
          assertNotMatch("xa", regex);
          assertNotMatch("xc", regex);
          assertMatch("xb", regex);
        });
        it("can be placed at the start of the range.", () => {
          const regex = new VimRegExp("x[A^-b]");
          assertMatch("x^", regex);
          assertMatch("xa", regex);
          assertMatch("xb", regex);
          assertNotMatch("xc", regex);
        });
        it("can be placed at the end of the range.", () => {
          const regex = new VimRegExp("x[Y-^]");
          assertMatch("x^", regex);
          assertMatch("xY", regex);
          assertMatch("xZ", regex);
          assertNotMatch("xX", regex);
        });
      });
      describe("-", () => {
        it("matches character code range when two characters in the sequence are separated by '-'.", () => {
          const regex = new VimRegExp("x[a-c]");
          assertMatch("xa", regex);
          assertMatch("xb", regex);
          assertMatch("xc", regex);
          assertNotMatch("xd", regex);
        });
        it("matches literal '-' when at beginning of sequence.", () => {
          const regex = new VimRegExp("x[-ac]");
          assertMatch("x-", regex);
          assertMatch("xa", regex);
          assertMatch("xc", regex);
          assertNotMatch("xb", regex);
        });
        it("matches literal '-' when at trailing of sequence.", () => {
          const regex = new VimRegExp("x[ac-]");
          assertMatch("x-", regex);
          assertMatch("xa", regex);
          assertMatch("xc", regex);
          assertNotMatch("xb", regex);
        });
        it("matches literal '-' when prefixed with '\\'.", () => {
          const regex = new VimRegExp("x[a\\-c]");
          assertMatch("x-", regex);
          assertMatch("xa", regex);
          assertMatch("xc", regex);
          assertNotMatch("xb", regex);
        });
        it("matches literal '-' when after '^' at beginning of sequence.", () => {
          const regex = new VimRegExp("x[^-ac]");
          assertNotMatch("x-", regex);
          assertNotMatch("xa", regex);
          assertNotMatch("xc", regex);
          assertMatch("xb", regex);
        });
        it("can be placed at the start of the range.", () => {
          const regex = new VimRegExp("x[--/]");
          assertMatch("x-", regex);
          assertMatch("x.", regex);
          assertMatch("x/", regex);
          assertNotMatch("xx", regex);
        });
        it("can be placed at the end of the range.", () => {
          const regex = new VimRegExp("x[+--]");
          assertMatch("x+", regex);
          assertMatch("x,", regex);
          assertMatch("x-", regex);
          assertNotMatch("xx", regex);
        });
      });
      describe("]", () => {
        it("matches literal ']' when at beginning of sequence.", () => {
          const regex = new VimRegExp("x[]ac]");
          assertMatch("x]", regex);
          assertMatch("xa", regex);
          assertMatch("xc", regex);
          assertNotMatch("xb", regex);
        });
        it("matches literal ']' when after '^' at beginning of sequence.", () => {
          const regex = new VimRegExp("x[^]ac]");
          assertNotMatch("x]", regex);
          assertNotMatch("xa", regex);
          assertNotMatch("xc", regex);
          assertMatch("xb", regex);
        });
        it("matches literal ']' when prefixed with '\\'.", () => {
          const regex = new VimRegExp("x[a\\]c]");
          assertMatch("x]", regex);
          assertMatch("xa", regex);
          assertMatch("xc", regex);
          assertNotMatch("xb", regex);
        });
        it("can be placed at the start of the range.", () => {
          const regex = new VimRegExp("x[]-b]");
          assertMatch("x]", regex);
          assertMatch("xa", regex);
          assertMatch("xb", regex);
          assertNotMatch("xc", regex);
        });
        it("can be placed at the end of the range when prefixed with '\\'.", () => {
          const regex = new VimRegExp("x[Y-\\]]");
          assertMatch("xY", regex);
          assertMatch("xZ", regex);
          assertMatch("x]", regex);
          assertNotMatch("xX", regex);
        });
      });
      const otherSpecialChars = "!#$%&()*+,./:;<=>?@[`{|}~";
      for (const target of otherSpecialChars) {
        describe(target, () => {
          it(`matches literal '${target}' when at beginning of sequence.`, () => {
            const regex = new VimRegExp(`x[${target}ac]`);
            assertMatch(`x${target}`, regex);
            assertMatch("xa", regex);
            assertMatch("xc", regex);
            assertNotMatch("xb", regex);
          });
          it(`matches literal '${target}' when at middle of sequence.`, () => {
            const regex = new VimRegExp(`x[a${target}c]`);
            assertMatch(`x${target}`, regex);
            assertMatch("xa", regex);
            assertMatch("xc", regex);
            assertNotMatch("xb", regex);
          });
          it(`matches literal '${target}' when at trailing of sequence.`, () => {
            const regex = new VimRegExp(`x[ac${target}]`);
            assertMatch(`x${target}`, regex);
            assertMatch("xa", regex);
            assertMatch("xc", regex);
            assertNotMatch("xb", regex);
          });
          it(`matches literal '${target}' when after '^' at beginning of sequence.`, () => {
            const regex = new VimRegExp(`x[^${target}ac]`);
            assertNotMatch(`x${target}`, regex);
            assertNotMatch("xa", regex);
            assertNotMatch("xc", regex);
            assertMatch("xb", regex);
          });
          it("can be placed at the start of the range.", () => {
            const regex = new VimRegExp(`x[${target}-\\x7f]`);
            assertMatch(`x${target}`, regex);
            assertMatch("x\x7f", regex);
            assertNotMatch("x\t", regex);
          });
          it("can be placed at the end of the range.", () => {
            const regex = new VimRegExp(`x[ -${target}]`);
            assertMatch(`x${target}`, regex);
            assertMatch("x ", regex);
            assertNotMatch("x\t", regex);
          });
        });
      }
      describe("[:alnum:]", () => {
        it("matches ASCII letters and digits.", () => {
          const regex = new VimRegExp("[[:alnum:]]");
          const alnum = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
          for (const c of alnum) {
            assertMatch(c, regex);
          }
          assertNotMatch("\x01", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:alpha:]", () => {
        it("matches ASCII letters.", () => {
          const regex = new VimRegExp("[[:alpha:]]");
          const alphabet = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
          for (const c of alphabet) {
            assertMatch(c, regex);
          }
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:backspace:]", () => {
        it("matches the <BS> character.", () => {
          const regex = new VimRegExp("[[:backspace:]]");
          assertMatch("\x08", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:blank:]", () => {
        it("matches <Space> and <Tab> characters.", () => {
          const regex = new VimRegExp("[[:blank:]]");
          assertMatch(" ", regex);
          assertMatch("\t", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:cntrl:]", () => {
        it("matches ASCII control characters.", () => {
          const regex = new VimRegExp("[[:cntrl:]]");
          assertMatch("\x00", regex);
          assertMatch("\x01", regex, "SOH");
          assertMatch("\x02", regex);
          assertMatch("\x03", regex);
          assertMatch("\x04", regex);
          assertMatch("\x05", regex);
          assertMatch("\x06", regex);
          assertMatch("\x07", regex);
          assertMatch("\x08", regex);
          assertMatch("\x09", regex);
          assertMatch("\x0a", regex);
          assertMatch("\x0b", regex);
          assertMatch("\x0c", regex);
          assertMatch("\x0d", regex);
          assertMatch("\x0e", regex);
          assertMatch("\x0f", regex);
          assertMatch("\x10", regex);
          assertMatch("\x11", regex);
          assertMatch("\x12", regex);
          assertMatch("\x13", regex);
          assertMatch("\x14", regex);
          assertMatch("\x15", regex);
          assertMatch("\x16", regex);
          assertMatch("\x17", regex);
          assertMatch("\x18", regex);
          assertMatch("\x19", regex);
          assertMatch("\x1a", regex);
          assertMatch("\x1b", regex);
          assertMatch("\x1c", regex);
          assertMatch("\x1d", regex);
          assertMatch("\x1e", regex);
          assertMatch("\x1f", regex);
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:digit:]", () => {
        it("matches ASCII decimal digits.", () => {
          const regex = new VimRegExp("[[:digit:]]");
          const digit = "0123456789";
          for (const c of digit) {
            assertMatch(c, regex);
          }
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:escape:]", () => {
        it("matches <Esc> character.", () => {
          const regex = new VimRegExp("[[:escape:]]");
          assertMatch("\x1b", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:fname:]", () => {
        it("matches file name characters.", () => {
          const regex = new VimRegExp("[[:fname:]]");
          assertNotMatch(" ", regex, "Is not contains");
          assertMatch("3", regex);
          assertMatch("x", regex);
          assertMatch("_", regex);
          assertMatch(".", regex);
          assertNotMatch("\x90", regex, "Is not contains");
          assertNotMatch("\x9f", regex, "'Is not contains");
          assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
          assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
          assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
          assertMatch("\u03b1", regex, "Unicode Greek characters");
          assertMatch("\u0414", regex, "Unicode Cyrillic characters");
          assertMatch("\u2764", regex, "Unicode Emoji");
          assertMatch("\u3000", regex, "Unicode Ideographic Space");
          assertMatch("\u4e9c", regex, "Unicode Han characters");
          assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
          assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
          assertMatch("\u{10ffff}", regex, "Unicode maximum value");
        });
        it("matches characters given by 'isfname' option.", () => {
          const regex = new VimRegExp("[[:fname:]]", { isfname: "48-57,32,.,144" });
          assertMatch(" ", regex, "'32' is contains");
          assertMatch("3", regex, "'48-57' is contains");
          assertNotMatch("x", regex, "Is not contains");
          assertNotMatch("_", regex, "Is not contains");
          assertMatch(".", regex, "'.' is contains");
          assertMatch("\x90", regex, "'144' is contains");
          assertNotMatch("\x9f", regex, "'Is not contains");
          assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
          assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
          assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
          assertMatch("\u{10ffff}", regex, "Unicode maximum value");
        });
      });
      describe("[:graph:]", () => {
        it("matches ASCII printable characters excluding space.", () => {
          const regex = new VimRegExp("[[:graph:]]");
          const printable =
            "!\"#$%&'()*+,-./0123456789:;<=>?@ABCDEFGHIJKLMNOPQRSTUVWXYZ[\\]^_`abcdefghijklmnopqrstuvwxyz{|}~";
          for (const c of printable) {
            assertMatch(c, regex);
          }
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("\x7f", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:ident:]", () => {
        it("matches identifier characters.", () => {
          const regex = new VimRegExp("[[:ident:]]");
          assertNotMatch(" ", regex, "Is not contains");
          assertMatch("3", regex);
          assertMatch("x", regex);
          assertMatch("_", regex);
          assertNotMatch(".", regex, "Is not contains");
          assertNotMatch("\x90", regex, "Is not contains");
          assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
          assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
          assertMatch("\xc0", regex, "Unicode word character inside ASCII");
          assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
          assertNotMatch("\u0100", regex, "Unicode minimum value outside ASCII");
          assertNotMatch("\u03b1", regex, "Unicode Greek characters");
          assertNotMatch("\u0414", regex, "Unicode Cyrillic characters");
          assertNotMatch("\u2764", regex, "Unicode Emoji");
          assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
          assertNotMatch("\u4e9c", regex, "Unicode Han characters");
          assertNotMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
          assertNotMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
          assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
        });
        it("matches characters given by 'isident' option.", () => {
          const regex = new VimRegExp("[[:ident:]]", { isident: "48-57,32,.,144" });
          assertMatch(" ", regex, "'32' is contains");
          assertMatch("3", regex, "'48-57' is contains");
          assertNotMatch("x", regex, "Is not contains");
          assertNotMatch("_", regex, "Is not contains");
          assertMatch(".", regex, "'.' is contains");
          assertMatch("\x90", regex, "'144' is contains");
          assertNotMatch("\xbf", regex, "'Is not contains");
          assertNotMatch("\xa0", regex, "Is not contains");
          assertNotMatch("\xff", regex, "Is not contains");
          assertNotMatch("\u0100", regex, "Is over 255");
        });
      });
      describe("[:keyword:]", () => {
        it("matches keyword characters.", () => {
          const regex = new VimRegExp("[[:keyword:]]");
          assertNotMatch(" ", regex, "Is not contains");
          assertMatch("3", regex);
          assertMatch("x", regex);
          assertMatch("_", regex);
          assertNotMatch(".", regex, "Is not contains");
          assertNotMatch("\x90", regex, "Is not contains");
          assertNotMatch("\xa0", regex, "Unicode minimum value inside ASCII");
          assertNotMatch("\xbf", regex, "Unicode not word character inside ASCII");
          assertMatch("\xc0", regex, "Unicode word character inside ASCII");
          assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
          assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
          assertMatch("\u03b1", regex, "Unicode Greek characters");
          assertMatch("\u0414", regex, "Unicode Cyrillic characters");
          assertMatch("\u2764", regex, "Unicode Emoji");
          assertNotMatch("\u3000", regex, "Unicode Ideographic Space");
          assertMatch("\u4e9c", regex, "Unicode Han characters");
          assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
          assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
          assertNotMatch("\u{10ffff}", regex, "Unicode maximum value");
        });
        it("matches characters given by 'iskeyword' option.", () => {
          const regex = new VimRegExp("[[:keyword:]]", { iskeyword: "48-57,32,.,144" });
          assertMatch(" ", regex, "'32' is contains");
          assertMatch("3", regex, "'48-57' is contains");
          assertNotMatch("x", regex, "Is not contains");
          assertNotMatch("_", regex, "Is not contains");
          assertMatch(".", regex, "'.' is contains");
          assertMatch("\x90", regex, "'144' is contains");
          assertNotMatch("\xbf", regex, "Is not contains");
          assertNotMatch("\xc0", regex, "Is not contains");
          assertNotMatch("\xff", regex, "Is not contains");
          assertMatch("\u0100", regex, "Is over 255, but Unicode word is always enabled");
        });
      });
      describe("[:lower:]", () => {
        it("matches lowercase letters.", () => {
          const regex = new VimRegExp("[[:lower:]]");
          const lower = "abcdefghijklmnopqrstuvwxyz";
          for (const c of lower) {
            assertMatch(c, regex);
          }
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
          assertMatch("\u00e1", regex, "Latin Small Letter A With Acute");
        });
      });
      describe("[:print:]", () => {
        it("matches printable characters.", () => {
          const regex = new VimRegExp("[[:print:]]");
          assertMatch(" ", regex);
          assertMatch("3", regex);
          assertMatch("x", regex);
          assertMatch("_", regex);
          assertMatch(".", regex);
          assertNotMatch("\x90", regex, "Is not contains");
          assertNotMatch("\x9f", regex, "Is not contains");
          assertMatch("\xa0", regex, "Unicode minimum value inside ASCII");
          assertMatch("\xff", regex, "Unicode maximum value inside ASCII");
          assertMatch("\u0100", regex, "Unicode minimum value outside ASCII");
          assertMatch("\u03b1", regex, "Unicode Greek characters");
          assertMatch("\u0414", regex, "Unicode Cyrillic characters");
          assertMatch("\u2764", regex, "Unicode Emoji");
          assertMatch("\u3000", regex, "Unicode Ideographic Space");
          assertMatch("\u4e9c", regex, "Unicode Han characters");
          assertMatch("\uff21", regex, "Unicode Halfwidth and Fullwidth Forms");
          assertMatch("\u{1f680}", regex, "Unicode Emoji (surrogate pairs)");
          assertMatch("\u{10ffff}", regex, "Unicode maximum value");
        });
        it("matches characters given by 'isprint' option.", () => {
          const regex = new VimRegExp("[[:print:]]", { isprint: "20,144" });
          assertMatch("\x14", regex, "'20' is contains");
          assertMatch("3", regex, "Is not contains, but it is always enabled");
          assertMatch("x", regex, "Is not contains, but it is always enabled");
          assertMatch("_", regex, "Is not contains, but it is always enabled");
          assertMatch(".", regex, "Is not contains, but it is always enabled");
          assertMatch("\x90", regex, "'144' is contains");
          assertNotMatch("\x9f", regex, "'Is not contains");
          assertMatch("\xa0", regex, "Is not contains, but Unicode range is always enabled");
          assertMatch("\xff", regex, "Is not contains, but Unicode range is always enabled");
          assertMatch("\u0100", regex, "Is over 255, but Unicode range is always enabled");
          assertMatch("\u{10ffff}", regex, "Unicode maximum value");
        });
      });
      describe("[:punct:]", () => {
        it("matches ASCII punctuation characters.", () => {
          const regex = new VimRegExp("[[:punct:]]");
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertMatch("_", regex);
          assertMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:return:]", () => {
        it("matches <CR> character.", () => {
          const regex = new VimRegExp("[[:return:]]");
          assertMatch("\x0d", regex);
          assertNotMatch("\x0a", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:space:]", () => {
        it("matches ASCII whitespace characters.", () => {
          const regex = new VimRegExp("[[:space:]]");
          assertMatch(" ", regex);
          assertMatch("\x09", regex, "HT");
          assertMatch("\x0a", regex, "LF");
          assertMatch("\x0b", regex, "VT");
          assertMatch("\x0c", regex, "FF");
          assertMatch("\x0d", regex, "CR");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:tab:]", () => {
        it("matches <Tab> character.", () => {
          const regex = new VimRegExp("[[:tab:]]");
          assertMatch("\t", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("\x0b", regex, "VT");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch("A", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[:upper:]", () => {
        it("matches uppercase letters.", () => {
          const regex = new VimRegExp("[[:upper:]]");
          const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
          for (const c of upper) {
            assertMatch(c, regex);
          }
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("0", regex);
          assertNotMatch("a", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
          assertNotMatch("\u00e1", regex, "Latin Small Letter A With Acute");
        });
      });
      describe("[:xdigit:]", () => {
        it("matches ASCII hexadecimal digits.", () => {
          const regex = new VimRegExp("[[:xdigit:]]");
          const hexDigit = "0123456789abcdefABCDEF";
          for (const c of hexDigit) {
            assertMatch(c, regex);
          }
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("g", regex);
          assertNotMatch("G", regex);
          assertNotMatch(" ", regex);
          assertNotMatch("_", regex);
          assertNotMatch(".", regex);
          assertNotMatch("\u00c1", regex, "Latin Capital Letter A With Acute");
        });
      });
      describe("[=a=]", () => {
        it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
          assertThrows(
            () => new VimRegExp("[[=a=]]"),
            UnsupportedSyntaxError,
            ": [[=a=]]",
          );
        });
      });
      describe("[.a.]", () => {
        it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
          assertThrows(
            () => new VimRegExp("[[.a.]]"),
            UnsupportedSyntaxError,
            ": [[.a.]]",
          );
        });
      });
      describe("\\e", () => {
        it("represents <Esc>.", () => {
          const regex = new VimRegExp("[\\e]");
          assertMatch("\x1b", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("a", regex);
        });
      });
      describe("\\t", () => {
        it("represents <Tab>.", () => {
          const regex = new VimRegExp("[\\t]");
          assertMatch("\x09", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("a", regex);
        });
      });
      describe("\\r", () => {
        it("represents <CR>.", () => {
          const regex = new VimRegExp("[\\r]");
          assertMatch("\x0d", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("a", regex);
        });
      });
      describe("\\b", () => {
        it("represents <BS>.", () => {
          const regex = new VimRegExp("[\\b]");
          assertMatch("\x08", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("a", regex);
        });
      });
      describe("\\n", () => {
        it("represents <LF>.", () => {
          const regex = new VimRegExp("[\\n]");
          assertMatch("\x0a", regex);
          assertNotMatch("\x01", regex, "SOH");
          assertNotMatch("a", regex);
        });
      });
      describe("\\d123", () => {
        it("represents decimal number of character.", () => {
          const regex = new VimRegExp("[\\d123]");
          assertMatch("\x7b", regex);
          assertNotMatch("\x7a", regex);
          assertNotMatch("\x7c", regex);
        });
      });
      describe("\\o40", () => {
        it("represents octal number of character.", () => {
          const regex = new VimRegExp("[\\o40]");
          assertMatch("\x20", regex);
          assertNotMatch("\x1f", regex);
          assertNotMatch("\x21", regex);
        });
        it("can parse up to \\o377.", () => {
          const regex = new VimRegExp("[\\o377]");
          assertMatch("\xff", regex);
          assertNotMatch("\xfe", regex);
          assertNotMatch("\u0100", regex);
        });
        it("should not include trailing digits.", () => {
          const regex = new VimRegExp("[\\o400]");
          assertMatch("\x20", regex, "Matches '\\o40'");
          assertMatch("0", regex);
          assertNotMatch("\x1f", regex);
          assertNotMatch("\x21", regex);
        });
      });
      describe("\\x20", () => {
        it("represents hexadecimal number of character.", () => {
          const regex = new VimRegExp("[\\x20]");
          assertMatch("\x20", regex);
          assertNotMatch("\x1f", regex);
          assertNotMatch("\x21", regex);
        });
        it("can parse up to \\xff.", () => {
          const regex = new VimRegExp("[\\xff]");
          assertMatch("\xff", regex);
          assertNotMatch("\xfe", regex);
          assertNotMatch("\u0100", regex);
        });
        it("should not include trailing digits.", () => {
          const regex = new VimRegExp("[\\x200]");
          assertMatch("\x20", regex, "Matches '\\x20'");
          assertMatch("0", regex);
          assertNotMatch("\x1f", regex);
          assertNotMatch("\x21", regex);
        });
      });
      describe("\\u20AC", () => {
        it("represents hexadecimal number of Unicode character.", () => {
          const regex = new VimRegExp("[\\u20AC]");
          assertMatch("\u20ac", regex);
          assertNotMatch("\x1f", regex);
          assertNotMatch("\x21", regex);
        });
        it("can parse up to \\uffff.", () => {
          const regex = new VimRegExp("[\\uffff]");
          assertMatch("\uffff", regex);
          assertNotMatch("\xfe", regex);
          assertNotMatch("\u0100", regex);
        });
        it("should not include trailing digits.", () => {
          const regex = new VimRegExp("[\\u20AC0]");
          assertMatch("\u20AC", regex, "Matches '\\u20AC'");
          assertMatch("0", regex);
          assertNotMatch("\u20AB", regex);
          assertNotMatch("\u20AD", regex);
        });
      });
      describe("\\U1234abcd", () => {
        it("represents hexadecimal number of Unicode character.", () => {
          const regex = new VimRegExp("[\\U1234a]");
          assertMatch("\u{1234a}", regex);
          assertNotMatch("\x1f", regex);
          assertNotMatch("\x21", regex);
        });
        it("can parse up to \\Uffffffff.", () => {
          const regex = new VimRegExp("[\\Uffffffff]");
          assertEquals(regex.source, "[]", "It is empty because it can not be Unicode.");
        });
        it("should not include trailing digits.", () => {
          const regex = new VimRegExp("[\\U1234abcd0]");
          assertMatch("0", regex);
        });
      });
    });
  });
  describe("Optionally matched atom sequence", () => {
    describe("\\%[]", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%[foo]"),
          UnsupportedSyntaxError,
          ": \\%[]",
        );
      });
    });
  });
  describe("Character code", () => {
    describe("\\%d123", () => {
      it("represents decimal number of character.", () => {
        const regex = new VimRegExp("\\%d123");
        assertMatch("\x7b", regex);
        assertNotMatch("\x7a", regex);
        assertNotMatch("\x7c", regex);
      });
    });
    describe("\\%o40", () => {
      it("represents octal number of character.", () => {
        const regex = new VimRegExp("\\%o40");
        assertMatch("\x20", regex);
        assertNotMatch("\x1f", regex);
        assertNotMatch("\x21", regex);
      });
      it("can parse up to \\%o377.", () => {
        const regex = new VimRegExp("\\%o377");
        assertMatch("\xff", regex);
        assertNotMatch("\xfe", regex);
        assertNotMatch("\u0100", regex);
      });
      it("should not include trailing digits.", () => {
        const regex = new VimRegExp("\\%o400");
        assertMatch(" 0", regex);
      });
    });
    describe("\\%x20", () => {
      it("represents hexadecimal number of character.", () => {
        const regex = new VimRegExp("\\%x20");
        assertMatch("\x20", regex);
        assertNotMatch("\x1f", regex);
        assertNotMatch("\x21", regex);
      });
      it("can parse up to \\%xff.", () => {
        const regex = new VimRegExp("\\%xff");
        assertMatch("\xff", regex);
        assertNotMatch("\xfe", regex);
        assertNotMatch("\u0100", regex);
      });
      it("should not include trailing digits.", () => {
        const regex = new VimRegExp("\\%x200");
        assertMatch(" 0", regex);
      });
    });
    describe("\\%u20AC", () => {
      it("represents hexadecimal number of Unicode character.", () => {
        const regex = new VimRegExp("\\%u20AC");
        assertMatch("\u20ac", regex);
        assertNotMatch("\x1f", regex);
        assertNotMatch("\x21", regex);
      });
      it("can parse up to \\%uffff.", () => {
        const regex = new VimRegExp("\\%uffff");
        assertMatch("\uffff", regex);
        assertNotMatch("\xfe", regex);
        assertNotMatch("\u0100", regex);
      });
      it("should not include trailing digits.", () => {
        const regex = new VimRegExp("\\%u20AC0");
        assertMatch("\u{20AC}0", regex);
      });
    });
    describe("\\%U1234abcd", () => {
      it("represents hexadecimal number of Unicode character.", () => {
        const regex = new VimRegExp("\\%U1234a");
        assertMatch("\u{1234a}", regex);
        assertNotMatch("\x1f", regex);
        assertNotMatch("\x21", regex);
      });
      it("can parse up to \\%Uffffffff.", () => {
        const regex = new VimRegExp("\\%Uffffffff");
        assertEquals(
          regex.source,
          "[]",
          "It is never matched regex because it can not be Unicode.",
        );
      });
      it("should not include trailing digits.", () => {
        const regex = new VimRegExp("\\%U1234abcd0");
        assertEquals(regex.source, "[]0");
      });
    });
  });
  describe("Composing characters", () => {
    describe("\\Z", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\Z"),
          UnsupportedSyntaxError,
          ": \\Z",
        );
      });
    });
    describe("\\%C", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%C"),
          UnsupportedSyntaxError,
          ": \\%C",
        );
      });
    });
  });
  describe("Regexp modes", () => {
    describe("\\m", () => {
      it("should turn on 'magic' for the pattern after it.", () => {
        const regex = new VimRegExp("\\m^a*$", { magic: false });
        assertMatch("aaa", regex);
        assertNotMatch("a*", regex);
      });
      it("should NOT turn on 'magic' for the pattern before it.", () => {
        const regex = new VimRegExp("^a*$\\m", { magic: false });
        assertNotMatch("aaa", regex);
        assertMatch("a*", regex);
      });
    });
    describe("\\M", () => {
      it("should turn off 'magic' for the pattern after it.", () => {
        const regex = new VimRegExp("\\M^a\\*$", { magic: true });
        assertMatch("aaa", regex);
        assertNotMatch("a*", regex);
      });
      it("should NOT turn off 'magic' for the pattern before it.", () => {
        const regex = new VimRegExp("^a\\*$\\M", { magic: true });
        assertNotMatch("aaa", regex);
        assertMatch("a*", regex);
      });
    });
    describe("\\v", () => {
      it("should turn on 'very magic' for the pattern after it.", () => {
        const regex = new VimRegExp("\\v^a+$", { magic: true });
        assertMatch("aaa", regex);
        assertNotMatch("a+", regex);
      });
      it("should NOT turn on 'very magic' for the pattern before it.", () => {
        const regex = new VimRegExp("^a+$\\v", { magic: true });
        assertNotMatch("aaa", regex);
        assertMatch("a+", regex);
      });
    });
    describe("\\V", () => {
      it("should turn on 'very nomagic' for the pattern after it.", () => {
        const regex = new VimRegExp("\\V\\^aaa\\$", { magic: false });
        assertMatch("aaa", regex);
        assertNotMatch("^aaa$", regex);
      });
      it("should NOT turn on 'very nomagic' for the pattern before it.", () => {
        const regex = new VimRegExp("\\^aaa\\$\\V", { magic: false });
        assertNotMatch("aaa", regex);
        assertMatch("^aaa$", regex);
      });
    });
    describe("\\%#=", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\%#=1"),
          UnsupportedSyntaxError,
          ": \\%#=",
        );
      });
    });
  });
  describe("Ignore case", () => {
    describe("\\c", () => {
      it("should turn on 'ignorecase' when at beginning of pattern.", () => {
        const regex = new VimRegExp("\\cfoobar");
        assertMatch("FooBar", regex);
      });
      it("should turn on 'ignorecase' when at middle of pattern.", () => {
        const regex = new VimRegExp("foo\\cbar");
        assertMatch("FooBar", regex);
      });
      it("should turn on 'ignorecase' when at trailing of pattern.", () => {
        const regex = new VimRegExp("foobar\\c");
        assertMatch("FooBar", regex);
      });
      it("overrides the option to turn on 'ignorecase'.", () => {
        const regex = new VimRegExp("\\cfoobar", { ignorecase: false });
        assertMatch("FooBar", regex);
      });
    });
    describe("\\C", () => {
      it("should turn off 'ignorecase' when at beginning of pattern.", () => {
        const regex = new VimRegExp("\\Cfoobar");
        assertMatch("foobar", regex);
        assertNotMatch("FooBar", regex);
      });
      it("should turn off 'ignorecase' when at middle of pattern.", () => {
        const regex = new VimRegExp("foo\\Cbar");
        assertMatch("foobar", regex);
        assertNotMatch("FooBar", regex);
      });
      it("should turn off 'ignorecase' when at trailing of pattern.", () => {
        const regex = new VimRegExp("foobar\\C");
        assertMatch("foobar", regex);
        assertNotMatch("FooBar", regex);
      });
      it("overrides the option to turn off 'ignorecase'.", () => {
        const regex = new VimRegExp("\\Cfoobar", { ignorecase: true });
        assertMatch("foobar", regex);
        assertNotMatch("FooBar", regex);
      });
      it("is overridden by 'i' flag of the option.", () => {
        const regex = new VimRegExp("\\Cfoobar", { flags: "i" });
        assertMatch("FooBar", regex);
      });
    });
  });
  describe("External matches", () => {
    describe("\\z(\\)", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\z(x\\)"),
          UnsupportedSyntaxError,
          ": \\z(",
        );
      });
    });
    describe("\\z1 \\z2 ... \\z9", () => {
      it("throws UnsupportedSyntaxError. (Different from Vim)", () => {
        assertThrows(
          () => new VimRegExp("\\z1"),
          UnsupportedSyntaxError,
          ": \\z1",
        );
      });
    });
  });
});
