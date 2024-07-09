import {
  assert,
  assertEquals,
  assertFalse,
  assertMatch,
  assertNotMatch,
  assertThrows,
} from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";

import { DEFAULT_CHAR_PATTERNS, patternToCharClass } from "./charclass.ts";

describe("DEFAULT_CHAR_PATTERNS", () => {
  it("has valid @example in document.", () => {
    const charClass = patternToCharClass(DEFAULT_CHAR_PATTERNS.isprint);
    const regex = new RegExp(`@${charClass}+@`, "v");
    assert(regex.test("@foo@"));
    assertFalse(regex.test("@!!!@"));
  });
  describe(".isfname", () => {
    it("should be parsable.", () => {
      const actual = patternToCharClass(DEFAULT_CHAR_PATTERNS.isfname);
      assertEquals(
        actual,
        "[\\x23-\\x25\\x2b-\\x39\\x3d\\x41-\\x5a\\x5f\\x61-\\x7a\\x7e\\xb5\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\xff]",
      );
    });
  });
  describe(".isident", () => {
    it("should be parsable.", () => {
      const actual = patternToCharClass(DEFAULT_CHAR_PATTERNS.isident);
      assertEquals(
        actual,
        "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a\\xb5\\xc0-\\xff]",
      );
    });
  });
  describe(".iskeyword", () => {
    it("should be parsable.", () => {
      const actual = patternToCharClass(DEFAULT_CHAR_PATTERNS.iskeyword);
      assertEquals(
        actual,
        "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a\\xb5\\xc0-\\xff]",
      );
    });
  });
  describe(".isprint", () => {
    it("should be parsable.", () => {
      const actual = patternToCharClass(DEFAULT_CHAR_PATTERNS.isprint);
      assertEquals(actual, "[\\x41-\\x5a\\x61-\\x7a\\xa1-\\xff]");
    });
  });
});

describe("patternToCharClass", () => {
  it("has valid @example in document.", () => {
    const isfname = "@,48-57,/,.,-,_,+,,,#,$,%,~,=";
    const fnameRegex = new RegExp(`${patternToCharClass(isfname)}+`, "v");
    const fname = "   /path/to/filename.ext  ".match(fnameRegex);
    assertEquals(fname?.[0], "/path/to/filename.ext");
  });
  describe("pattern", () => {
    describe("empty", () => {
      it("is convertd to an empty class.", () => {
        assertEquals(patternToCharClass(""), "[]");
      });
    });
    describe("' ' (space)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass(" "), "[\\x20]");
        assertEquals(patternToCharClass(" ,A"), "[\\x20\\x41]");
      });
      it("can be specified as a range.", () => {
        assertEquals(patternToCharClass(" - "), "[\\x20]");
        assertEquals(patternToCharClass(" -A"), "[\\x20-\\x41]");
        assertEquals(patternToCharClass("32- "), "[\\x20]");
      });
      it("throws an error when inverse code range.", () => {
        assertThrows(
          () => patternToCharClass("A- "),
          SyntaxError,
          ":0: Invalid code range",
        );
      });
      it("is trimmed after commas.", () => {
        assertEquals(patternToCharClass("a,  c"), "[\\x61\\x63]");
        assertThrows(
          () => patternToCharClass("x, ,A"),
          SyntaxError,
          ":3: Invalid keyword",
          "Spaces after comma are trimed and ',A' gives an error.",
        );
        assertThrows(
          () => patternToCharClass("x, -A"),
          SyntaxError,
          ":3: Invalid keyword",
          "Spaces after comma are trimed and '-A' gives an error.",
        );
      });
      it("is not trimmed before commas.", () => {
        assertThrows(
          () => patternToCharClass("a ,c"),
          SyntaxError,
          ":0: Invalid keyword",
        );
        assertEquals(patternToCharClass("32- ,A"), "[\\x20\\x41]");
      });
    });
    describe("'a' (characters except digits)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("a"), "[\\x61]");
        assertEquals(patternToCharClass("a,c"), "[\\x61\\x63]");
      });
      it("can be specified as a range.", () => {
        assertEquals(patternToCharClass("a-a"), "[\\x61]");
        assertEquals(patternToCharClass("a-c"), "[\\x61-\\x63]");
      });
      it("throws an error when inverse code range.", () => {
        assertThrows(
          () => patternToCharClass("c-a"),
          SyntaxError,
          ":0: Invalid code range",
        );
      });
      it("throws an error if the character code is outside 1-255.", () => {
        assertThrows(
          () => patternToCharClass("\0"),
          SyntaxError,
          ":0: Invalid code range",
          "A code of 0 is not allowd.",
        );
        assertEquals(patternToCharClass("\x01"), "[\\x01]");
        assertEquals(patternToCharClass("\xff"), "[\\xff]");
        assertThrows(
          () => patternToCharClass("\u0100"),
          SyntaxError,
          ":0: Invalid code range",
          "Codes 256 and above is not allowd.",
        );
      });
    });
    describe("'97' (digits)", () => {
      it("can be specified as a character code.", () => {
        assertEquals(patternToCharClass("97"), "[\\x61]");
        assertEquals(patternToCharClass("97,99"), "[\\x61\\x63]");
      });
      it("can be specified as a range.", () => {
        assertEquals(patternToCharClass("97-97"), "[\\x61]");
        assertEquals(patternToCharClass("97-99"), "[\\x61-\\x63]");
      });
      it("throws an error when inverse code range.", () => {
        assertThrows(
          () => patternToCharClass("99-97"),
          SyntaxError,
          ":0: Invalid code range",
        );
      });
      it("throws an error if the character code is outside 1-255.", () => {
        assertThrows(
          () => patternToCharClass("0"),
          SyntaxError,
          ":0: Invalid code range",
          "A code of 0 is not allowd.",
        );
        assertEquals(patternToCharClass("1"), "[\\x01]");
        assertEquals(patternToCharClass("255"), "[\\xff]");
        assertThrows(
          () => patternToCharClass("256"),
          SyntaxError,
          ":0: Invalid code range",
          "Codes 256 and above is not allowd.",
        );
      });
    });
    describe("'a-97' (range with characters and digits)", () => {
      it("can be parsed.", () => {
        assertEquals(patternToCharClass("a-97"), "[\\x61]");
        assertEquals(patternToCharClass("97-a"), "[\\x61]");
        assertEquals(patternToCharClass("a-99"), "[\\x61-\\x63]");
        assertEquals(patternToCharClass("97-c"), "[\\x61-\\x63]");
      });
      it("throws an error when inverse code range.", () => {
        assertThrows(
          () => patternToCharClass("c-97"),
          SyntaxError,
          ":0: Invalid code range",
        );
        assertThrows(
          () => patternToCharClass("99-a"),
          SyntaxError,
          ":0: Invalid code range",
        );
      });
    });
    describe("'@'", () => {
      it("expands to 'isalpha()' when it is used alone.", () => {
        assertEquals(
          patternToCharClass("@"),
          "[\\x41-\\x5a\\x61-\\x7a\\xb5\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\xff]",
        );
      });
      it("can be specified as a range.", () => {
        assertEquals(patternToCharClass("@-@"), "[\\x40]");
        assertEquals(patternToCharClass("@-B"), "[\\x40-\\x42]");
        assertEquals(patternToCharClass("<-@"), "[\\x3c-\\x40]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("@,A-Z,a-z,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a\\xb5\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\xff]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,@,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a\\xb5\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\xff]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,@"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a\\xb5\\xc0-\\xd6\\xd8-\\xf6\\xf8-\\xff]",
        );
      });
    });
    describe("'\\'", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("\\"), "[\\x5c]");
      });
      it("can be specified as a range.", () => {
        assertEquals(patternToCharClass("\\-\\"), "[\\x5c]");
        assertEquals(patternToCharClass("\\-_"), "[\\x5c-\\x5f]");
        assertEquals(patternToCharClass("X-\\"), "[\\x58-\\x5c]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("\\,A-Z,a-z,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5c\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,\\,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5c\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,\\"),
          "[\\x30-\\x39\\x41-\\x5a\\x5c\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("'-'", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("-"), "[\\x2d]");
      });
      it("can be specified as a range.", () => {
        assertEquals(patternToCharClass("---"), "[\\x2d]");
        assertEquals(patternToCharClass("--/"), "[\\x2d-\\x2f]");
        assertEquals(patternToCharClass("+--"), "[\\x2b-\\x2d]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("-,A-Z,a-z,48-57,_"),
          "[\\x2d\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,-,48-57,_"),
          "[\\x2d\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,-"),
          "[\\x2d\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("','", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass(","), "[\\x2c]");
      });
      it("can be specified as a range.", () => {
        assertEquals(patternToCharClass(",-,"), "[\\x2c]");
        assertEquals(patternToCharClass(",-."), "[\\x2c-\\x2e]");
        assertEquals(patternToCharClass(")-,"), "[\\x29-\\x2c]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass(",,A-Z,a-z,48-57,_"),
          "[\\x2c\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,,,48-57,_"),
          "[\\x2c\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,,"),
          "[\\x2c\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("'^'", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^"), "[\\x5e]");
      });
      it("is not allowed at start of range.", () => {
        assertThrows(
          () => patternToCharClass("^-^"),
          SyntaxError,
          ":0: Invalid keyword",
        );
        assertThrows(
          () => patternToCharClass("^-`"),
          SyntaxError,
          ":0: Invalid keyword",
        );
      });
      it("can be specified at end of range.", () => {
        assertEquals(patternToCharClass("[-^"), "[\\x5b-\\x5e]");
      });
      it("is not allowed at beginning of pattern.", () => {
        assertThrows(
          () => patternToCharClass("^,A-Z,a-z,48-57,_"),
          SyntaxError,
          ":0: Invalid keyword",
        );
      });
      it("is not allowed at middle of pattern.", () => {
        assertThrows(
          () => patternToCharClass("A-Z,a-z,^,48-57,_"),
          SyntaxError,
          ":8: Invalid keyword",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,^"),
          "[\\x30-\\x39\\x41-\\x5a\\x5e\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("'^A' (characters with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^A"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^A,A-Z,a-z,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,^A,a-z,48-57,_"),
          "[\\x30-\\x39\\x42-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,^A"),
          "[\\x30-\\x39\\x42-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("'^A-C' (characters range with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^A-C"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^A-C,A-Z,a-z,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,^A-C,a-z,48-57,_"),
          "[\\x30-\\x39\\x44-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,^A-C"),
          "[\\x30-\\x39\\x44-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("'^65' (digits with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^65"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^65,A-Z,a-z,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,^65,a-z,48-57,_"),
          "[\\x30-\\x39\\x42-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,^65"),
          "[\\x30-\\x39\\x42-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("'^65-67' (digits range with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^65-67"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^65-67,A-Z,a-z,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,^65-67,a-z,48-57,_"),
          "[\\x30-\\x39\\x44-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,^65-67"),
          "[\\x30-\\x39\\x44-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
    });
    describe("'^@' ('@' with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^@"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^@,A-Z,a-z,48-57,_"),
          "[\\x30-\\x39\\x41-\\x5a\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,^@,a-z,48-57,_"),
          "[\\x30-\\x39\\x5f\\x61-\\x7a]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-Z,a-z,48-57,_,^@"),
          "[\\x30-\\x39\\x5f]",
        );
      });
    });
    describe("'^\\' ('\\' with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^\\"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^\\,A-~,48-57"),
          "[\\x30-\\x39\\x41-\\x7e]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-~,^\\,48-57"),
          "[\\x30-\\x39\\x41-\\x5b\\x5d-\\x7e]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-~,48-57,^\\"),
          "[\\x30-\\x39\\x41-\\x5b\\x5d-\\x7e]",
        );
      });
    });
    describe("'^,' ('^' with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^,"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^,,32-57,A-~"),
          "[\\x20-\\x39\\x41-\\x7e]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("32-57,^,,A-~"),
          "[\\x20-\\x2b\\x2d-\\x39\\x41-\\x7e]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("32-57,A-~,^,"),
          "[\\x20-\\x2b\\x2d-\\x39\\x41-\\x7e]",
        );
      });
    });
    describe("'^-' ('^' with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^-"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^-,32-57,A-~"),
          "[\\x20-\\x39\\x41-\\x7e]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("32-57,^-,A-~"),
          "[\\x20-\\x2c\\x2e-\\x39\\x41-\\x7e]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("32-57,A-~,^-"),
          "[\\x20-\\x2c\\x2e-\\x39\\x41-\\x7e]",
        );
      });
    });
    describe("'^^' ('^' with inverse)", () => {
      it("can be specified as a single character.", () => {
        assertEquals(patternToCharClass("^^"), "[]");
      });
      it("can be specified at beginning of pattern.", () => {
        assertEquals(
          patternToCharClass("^^,A-~,48-57"),
          "[\\x30-\\x39\\x41-\\x7e]",
        );
      });
      it("can be specified at middle of pattern.", () => {
        assertEquals(
          patternToCharClass("A-~,^^,48-57"),
          "[\\x30-\\x39\\x41-\\x5d\\x5f-\\x7e]",
        );
      });
      it("can be specified at trailing of pattern.", () => {
        assertEquals(
          patternToCharClass("A-~,48-57,^^"),
          "[\\x30-\\x39\\x41-\\x5d\\x5f-\\x7e]",
        );
      });
    });
  });
  describe("options", () => {
    it("can be omitted.", () => {
      assertEquals(patternToCharClass(""), "[]");
    });
    it("can specify empty object.", () => {
      assertEquals(patternToCharClass("", {}), "[]");
    });
    describe(".type", () => {
      it("is allowed to specify undefined.", () => {
        assertEquals(patternToCharClass("", { type: undefined }), "[]");
      });
      describe("'isfname'", () => {
        it("returns Unicode range.", () => {
          assertEquals(
            patternToCharClass("", { type: "isfname" }),
            "[[\\xa0-\\u{10ffff}]]",
          );
        });
        it("merges with specified pattern.", () => {
          assertEquals(
            patternToCharClass("9,28-47,180-200", { type: "isfname" }),
            "[\\x09\\x1c-\\x2f[\\xa0-\\u{10ffff}]]",
          );
        });
        it("is not affected by inverse pattern.", () => {
          assertEquals(
            patternToCharClass("^20-127", { type: "isfname" }),
            "[[\\xa0-\\u{10ffff}]]",
          );
        });
        it("should (not) matche the following characters.", () => {
          const regex = new RegExp(
            `^${patternToCharClass("", { type: "isfname" })}$`,
            "v",
          );
          assertNotMatch("\0", regex); // Control:
          assertNotMatch("\x01", regex); // Control:
          assertNotMatch("\b", regex); // Control:
          assertNotMatch("\t", regex); // Control:
          assertNotMatch("\n", regex); // Control:
          assertNotMatch("\v", regex); // Control:
          assertNotMatch("\r", regex); // Control:
          assertNotMatch("\u0020", regex); // Space: SPACE
          assertNotMatch("0", regex); // Digit:
          assertNotMatch("-", regex); // Punctuation:
          assertNotMatch("A", regex); // Letter:
          assertNotMatch("a", regex); // Letter:
          assertNotMatch("\x7f", regex); // Control:
          assertNotMatch("\x80", regex); // Control:
          assertNotMatch("\x9f", regex); // Control:
          assertMatch("\xa0", regex); // Space: NO-BREAK SPACE
          assertMatch("\xff", regex); // Letter: LATIN SMALL LETTER Y WITH DIAERESIS
          assertMatch("\u0100", regex); // Letter: LATIN CAPITAL LETTER A WITH MACRON
          assertMatch("\u1680", regex); // Space: OGHAM SPACE MARK
          assertMatch("\u180e", regex); // Space: MONGOLIAN VOWEL SEPARATOR
          assertMatch("\u2000", regex); // Space: EN QUAD
          assertMatch("\u2001", regex); // Space: EM QUAD
          assertMatch("\u2002", regex); // Space: EN SPACE
          assertMatch("\u2003", regex); // Space: EM SPACE
          assertMatch("\u2004", regex); // Space: THREE-PER-EM SPACE
          assertMatch("\u2005", regex); // Space: FOUR-PER-EM SPACE
          assertMatch("\u2006", regex); // Space: SIX-PER-EM SPACE
          assertMatch("\u2007", regex); // Space: FIGURE SPACE
          assertMatch("\u2008", regex); // Space: PUNCTUATION SPACE
          assertMatch("\u2009", regex); // Space: THIN SPACE
          assertMatch("\u200a", regex); // Space: HAIR SPACE
          assertMatch("\u200b", regex); // Space: ZERO WIDTH SPACE
          assertMatch("\u2013", regex); // Punctuation: EN DASH
          assertMatch("\u202f", regex); // Space: NARROW NO-BREAK SPACE
          assertMatch("\u205f", regex); // Space: MEDIUM MATHEMATICAL SPACE
          assertMatch("\u3000", regex); // Space: IDEOGRAPHIC SPACE
          assertMatch("\ufeff", regex); // Space: ZERO WIDTH NO-BREAK SPACE
          assertMatch("\uff10", regex); // Digit: FULLWIDTH DIGIT ZERO
          assertMatch("\uff21", regex); // Letter: FULLWIDTH LATIN CAPITAL LETTER A
          assertMatch("\uff41", regex); // Letter: FULLWIDTH LATIN SMALL LETTER A
          assertMatch("\u{1f680}", regex); // Emoji: ROCKET
          assertMatch("\u{10ffff}", regex); // Unknown:
        });
      });
      describe("'isident'", () => {
        it("returns empty.", () => {
          assertEquals(patternToCharClass("", { type: "isident" }), "[]");
        });
        it("merges with specified pattern.", () => {
          assertEquals(
            patternToCharClass("9,28-47,180-200", { type: "isident" }),
            "[\\x09\\x1c-\\x2f\\xb4-\\xc8]",
          );
        });
        it("is not affected by inverse pattern.", () => {
          assertEquals(
            patternToCharClass("^20-127", { type: "isident" }),
            "[]",
          );
        });
        it("should (not) matche the following characters.", () => {
          const regex = new RegExp(
            `^${patternToCharClass("", { type: "isident" })}$`,
            "v",
          );
          assertNotMatch("\0", regex); // Control:
          assertNotMatch("\x01", regex); // Control:
          assertNotMatch("\b", regex); // Control:
          assertNotMatch("\t", regex); // Control:
          assertNotMatch("\n", regex); // Control:
          assertNotMatch("\v", regex); // Control:
          assertNotMatch("\r", regex); // Control:
          assertNotMatch("\u0020", regex); // Space: SPACE
          assertNotMatch("0", regex); // Digit:
          assertNotMatch("-", regex); // Punctuation:
          assertNotMatch("A", regex); // Letter:
          assertNotMatch("a", regex); // Letter:
          assertNotMatch("\x7f", regex); // Control:
          assertNotMatch("\x80", regex); // Control:
          assertNotMatch("\x9f", regex); // Control:
          assertNotMatch("\xa0", regex); // Space: NO-BREAK SPACE
          assertNotMatch("\xff", regex); // Letter: LATIN SMALL LETTER Y WITH DIAERESIS
          assertNotMatch("\u0100", regex); // Letter: LATIN CAPITAL LETTER A WITH MACRON
          assertNotMatch("\u1680", regex); // Space: OGHAM SPACE MARK
          assertNotMatch("\u180e", regex); // Space: MONGOLIAN VOWEL SEPARATOR
          assertNotMatch("\u2000", regex); // Space: EN QUAD
          assertNotMatch("\u2001", regex); // Space: EM QUAD
          assertNotMatch("\u2002", regex); // Space: EN SPACE
          assertNotMatch("\u2003", regex); // Space: EM SPACE
          assertNotMatch("\u2004", regex); // Space: THREE-PER-EM SPACE
          assertNotMatch("\u2005", regex); // Space: FOUR-PER-EM SPACE
          assertNotMatch("\u2006", regex); // Space: SIX-PER-EM SPACE
          assertNotMatch("\u2007", regex); // Space: FIGURE SPACE
          assertNotMatch("\u2008", regex); // Space: PUNCTUATION SPACE
          assertNotMatch("\u2009", regex); // Space: THIN SPACE
          assertNotMatch("\u200a", regex); // Space: HAIR SPACE
          assertNotMatch("\u200b", regex); // Space: ZERO WIDTH SPACE
          assertNotMatch("\u2013", regex); // Punctuation: EN DASH
          assertNotMatch("\u202f", regex); // Space: NARROW NO-BREAK SPACE
          assertNotMatch("\u205f", regex); // Space: MEDIUM MATHEMATICAL SPACE
          assertNotMatch("\u3000", regex); // Space: IDEOGRAPHIC SPACE
          assertNotMatch("\ufeff", regex); // Space: ZERO WIDTH NO-BREAK SPACE
          assertNotMatch("\uff10", regex); // Digit: FULLWIDTH DIGIT ZERO
          assertNotMatch("\uff21", regex); // Letter: FULLWIDTH LATIN CAPITAL LETTER A
          assertNotMatch("\uff41", regex); // Letter: FULLWIDTH LATIN SMALL LETTER A
          assertNotMatch("\u{1f680}", regex); // Emoji: ROCKET
          assertNotMatch("\u{10ffff}", regex); // Unknown:
        });
      });
      describe("'iskeyword'", () => {
        it("returns Unicode word range.", () => {
          assertEquals(
            patternToCharClass("", { type: "iskeyword" }),
            "[[[\\p{L}\\p{N}\\p{Emoji}]--[\\x00-\\xff]]]",
          );
        });
        it("merges with specified pattern.", () => {
          assertEquals(
            patternToCharClass("9,28-47,180-200", { type: "iskeyword" }),
            "[\\x09\\x1c-\\x2f\\xb4-\\xc8[[\\p{L}\\p{N}\\p{Emoji}]--[\\x00-\\xff]]]",
          );
        });
        it("is not affected by inverse pattern.", () => {
          assertEquals(
            patternToCharClass("^20-127", { type: "iskeyword" }),
            "[[[\\p{L}\\p{N}\\p{Emoji}]--[\\x00-\\xff]]]",
          );
        });
        it("should (not) matche the following characters.", () => {
          const regex = new RegExp(
            `^${patternToCharClass("", { type: "iskeyword" })}$`,
            "v",
          );
          assertNotMatch("\0", regex); // Control:
          assertNotMatch("\x01", regex); // Control:
          assertNotMatch("\b", regex); // Control:
          assertNotMatch("\t", regex); // Control:
          assertNotMatch("\n", regex); // Control:
          assertNotMatch("\v", regex); // Control:
          assertNotMatch("\r", regex); // Control:
          assertNotMatch("\u0020", regex); // Space: SPACE
          assertNotMatch("0", regex); // Digit:
          assertNotMatch("-", regex); // Punctuation:
          assertNotMatch("A", regex); // Letter:
          assertNotMatch("a", regex); // Letter:
          assertNotMatch("\x7f", regex); // Control:
          assertNotMatch("\x80", regex); // Control:
          assertNotMatch("\x9f", regex); // Control:
          assertNotMatch("\xa0", regex); // Space: NO-BREAK SPACE
          assertNotMatch("\xff", regex); // Letter: LATIN SMALL LETTER Y WITH DIAERESIS
          assertMatch("\u0100", regex); // Letter: LATIN CAPITAL LETTER A WITH MACRON
          assertNotMatch("\u1680", regex); // Space: OGHAM SPACE MARK
          assertNotMatch("\u180e", regex); // Space: MONGOLIAN VOWEL SEPARATOR
          assertNotMatch("\u2000", regex); // Space: EN QUAD
          assertNotMatch("\u2001", regex); // Space: EM QUAD
          assertNotMatch("\u2002", regex); // Space: EN SPACE
          assertNotMatch("\u2003", regex); // Space: EM SPACE
          assertNotMatch("\u2004", regex); // Space: THREE-PER-EM SPACE
          assertNotMatch("\u2005", regex); // Space: FOUR-PER-EM SPACE
          assertNotMatch("\u2006", regex); // Space: SIX-PER-EM SPACE
          assertNotMatch("\u2007", regex); // Space: FIGURE SPACE
          assertNotMatch("\u2008", regex); // Space: PUNCTUATION SPACE
          assertNotMatch("\u2009", regex); // Space: THIN SPACE
          assertNotMatch("\u200a", regex); // Space: HAIR SPACE
          assertNotMatch("\u200b", regex); // Space: ZERO WIDTH SPACE
          assertNotMatch("\u2013", regex); // Punctuation: EN DASH
          assertNotMatch("\u202f", regex); // Space: NARROW NO-BREAK SPACE
          assertNotMatch("\u205f", regex); // Space: MEDIUM MATHEMATICAL SPACE
          assertNotMatch("\u3000", regex); // Space: IDEOGRAPHIC SPACE
          assertNotMatch("\ufeff", regex); // Space: ZERO WIDTH NO-BREAK SPACE
          assertMatch("\uff10", regex); // Digit: FULLWIDTH DIGIT ZERO
          assertMatch("\uff21", regex); // Letter: FULLWIDTH LATIN CAPITAL LETTER A
          assertMatch("\uff41", regex); // Letter: FULLWIDTH LATIN SMALL LETTER A
          assertMatch("\u{1f680}", regex); // Emoji: ROCKET
          assertNotMatch("\u{10ffff}", regex); // Unknown:
        });
      });
      describe("'isprint'", () => {
        it("returns ASCII range and Unicode range.", () => {
          assertEquals(
            patternToCharClass("", { type: "isprint" }),
            "[\\x20-\\x7e[\\xa0-\\u{10ffff}]]",
          );
        });
        it("merges with specified pattern.", () => {
          assertEquals(
            patternToCharClass("9,28-47,180-200", { type: "isprint" }),
            "[\\x09\\x1c-\\x7e[\\xa0-\\u{10ffff}]]",
          );
        });
        it("is not affected by inverse pattern.", () => {
          assertEquals(
            patternToCharClass("^20-127", { type: "isprint" }),
            "[\\x20-\\x7e[\\xa0-\\u{10ffff}]]",
          );
        });
        it("should (not) matche the following characters.", () => {
          const regex = new RegExp(
            `^${patternToCharClass("", { type: "isprint" })}$`,
            "v",
          );
          assertNotMatch("\0", regex); // Control:
          assertNotMatch("\x01", regex); // Control:
          assertNotMatch("\b", regex); // Control:
          assertNotMatch("\t", regex); // Control:
          assertNotMatch("\n", regex); // Control:
          assertNotMatch("\v", regex); // Control:
          assertNotMatch("\r", regex); // Control:
          assertMatch("\u0020", regex); // Space: SPACE
          assertMatch("0", regex); // Digit:
          assertMatch("-", regex); // Punctuation:
          assertMatch("A", regex); // Letter:
          assertMatch("a", regex); // Letter:
          assertNotMatch("\x7f", regex); // Control:
          assertNotMatch("\x80", regex); // Control:
          assertNotMatch("\x9f", regex); // Control:
          assertMatch("\xa0", regex); // Space: NO-BREAK SPACE
          assertMatch("\xff", regex); // Letter: LATIN SMALL LETTER Y WITH DIAERESIS
          assertMatch("\u0100", regex); // Letter: LATIN CAPITAL LETTER A WITH MACRON
          assertMatch("\u1680", regex); // Space: OGHAM SPACE MARK
          assertMatch("\u180e", regex); // Space: MONGOLIAN VOWEL SEPARATOR
          assertMatch("\u2000", regex); // Space: EN QUAD
          assertMatch("\u2001", regex); // Space: EM QUAD
          assertMatch("\u2002", regex); // Space: EN SPACE
          assertMatch("\u2003", regex); // Space: EM SPACE
          assertMatch("\u2004", regex); // Space: THREE-PER-EM SPACE
          assertMatch("\u2005", regex); // Space: FOUR-PER-EM SPACE
          assertMatch("\u2006", regex); // Space: SIX-PER-EM SPACE
          assertMatch("\u2007", regex); // Space: FIGURE SPACE
          assertMatch("\u2008", regex); // Space: PUNCTUATION SPACE
          assertMatch("\u2009", regex); // Space: THIN SPACE
          assertMatch("\u200a", regex); // Space: HAIR SPACE
          assertMatch("\u200b", regex); // Space: ZERO WIDTH SPACE
          assertMatch("\u2013", regex); // Punctuation: EN DASH
          assertMatch("\u202f", regex); // Space: NARROW NO-BREAK SPACE
          assertMatch("\u205f", regex); // Space: MEDIUM MATHEMATICAL SPACE
          assertMatch("\u3000", regex); // Space: IDEOGRAPHIC SPACE
          assertMatch("\ufeff", regex); // Space: ZERO WIDTH NO-BREAK SPACE
          assertMatch("\uff10", regex); // Digit: FULLWIDTH DIGIT ZERO
          assertMatch("\uff21", regex); // Letter: FULLWIDTH LATIN CAPITAL LETTER A
          assertMatch("\uff41", regex); // Letter: FULLWIDTH LATIN SMALL LETTER A
          assertMatch("\u{1f680}", regex); // Emoji: ROCKET
          assertMatch("\u{10ffff}", regex); // Unknown:
        });
      });
    });
    describe(".unicode", () => {
      describe("without type options", () => {
        it("is allowed to specify undefined.", () => {
          assertEquals(
            patternToCharClass("9,28-47,128-255", { unicode: undefined }),
            "[\\x09\\x1c-\\x2f\\x80-\\xff]",
          );
        });
        it("does not omits unicode range when true.", () => {
          assertEquals(
            patternToCharClass("9,28-47,128-255", { unicode: true }),
            "[\\x09\\x1c-\\x2f\\x80-\\xff]",
          );
        });
        it("omits unicode ranges when false.", () => {
          assertEquals(
            patternToCharClass("9,28-47,128-255", { unicode: false }),
            "[\\x09\\x1c-\\x2f\\x80-\\x9f]",
          );
        });
      });
      describe("with type options", () => {
        it("is allowed to specify undefined.", () => {
          assertEquals(
            patternToCharClass("9,28-47,128-255", { unicode: undefined, type: "iskeyword" }),
            "[\\x09\\x1c-\\x2f\\x80-\\xff[[\\p{L}\\p{N}\\p{Emoji}]--[\\x00-\\xff]]]",
          );
        });
        it("does not omits unicode ranges when true.", () => {
          assertEquals(
            patternToCharClass("9,28-47,128-255", { unicode: true, type: "iskeyword" }),
            "[\\x09\\x1c-\\x2f\\x80-\\xff[[\\p{L}\\p{N}\\p{Emoji}]--[\\x00-\\xff]]]",
          );
        });
        it("omits unicode ranges when false.", () => {
          assertEquals(
            patternToCharClass("9,28-47,128-255", { unicode: false, type: "iskeyword" }),
            "[\\x09\\x1c-\\x2f\\x80-\\x9f]",
          );
        });
      });
    });
  });
});
