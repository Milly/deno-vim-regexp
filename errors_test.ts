import { assertEquals } from "jsr:@std/assert";
import { describe, it } from "jsr:@std/testing/bdd";

import { CharClassSyntaxError, VimRegExpSyntaxError } from "./errors.ts";

describe("VimRegExpSyntaxError", () => {
  describe("constructor", () => {
    it("can omit 'message'", () => {
      const error = new VimRegExpSyntaxError();
      assertEquals(error.message, "Invalid Vim regular expression");
      assertEquals(error.source, undefined);
      assertEquals(error.index, undefined);
    });
    it("can omit 'options'", () => {
      const error = new VimRegExpSyntaxError("foobar");
      assertEquals(error.message, "Invalid Vim regular expression: foobar");
      assertEquals(error.source, undefined);
      assertEquals(error.index, undefined);
    });
    it("stores value of 'source' option into the message.", () => {
      const error = new VimRegExpSyntaxError("foobar", { source: "abc*" });
      assertEquals(error.message, "Invalid Vim regular expression: /abc*/: foobar");
      assertEquals(error.source, "abc*");
      assertEquals(error.index, undefined);
    });
    it("stores value of 'source' and 'index' option into the message.", () => {
      const error = new VimRegExpSyntaxError("foobar", { source: "abc*", index: 42 });
      assertEquals(error.message, "Invalid Vim regular expression: /abc*/:42: foobar");
      assertEquals(error.source, "abc*");
      assertEquals(error.index, 42);
    });
    it("does not stores value of 'index' option into the message.", () => {
      const error = new VimRegExpSyntaxError("foobar", { index: 42 });
      assertEquals(error.message, "Invalid Vim regular expression: foobar");
      assertEquals(error.source, undefined);
      assertEquals(error.index, 42);
    });
  });
});

describe("CharClassSyntaxError", () => {
  describe("constructor", () => {
    it("can omit 'message'", () => {
      const error = new CharClassSyntaxError();
      assertEquals(error.message, "Invalid Vim option format");
      assertEquals(error.source, undefined);
      assertEquals(error.index, undefined);
    });
    it("can omit 'options'", () => {
      const error = new CharClassSyntaxError("foobar");
      assertEquals(error.message, "Invalid Vim option format: foobar");
      assertEquals(error.source, undefined);
      assertEquals(error.index, undefined);
    });
    it("stores value of 'source' option into the message.", () => {
      const error = new CharClassSyntaxError("foobar", { source: "@,48-58" });
      assertEquals(error.message, 'Invalid Vim option format: "@,48-58": foobar');
      assertEquals(error.source, "@,48-58");
      assertEquals(error.index, undefined);
    });
    it("stores value of 'source' and 'index' option into the message.", () => {
      const error = new CharClassSyntaxError("foobar", { source: "@,48-58", index: 3 });
      assertEquals(error.message, 'Invalid Vim option format: "@,48-58":3: foobar');
      assertEquals(error.source, "@,48-58");
      assertEquals(error.index, 3);
    });
    it("does not stores value of 'index' option into the message.", () => {
      const error = new CharClassSyntaxError("foobar", { index: 3 });
      assertEquals(error.message, "Invalid Vim option format: foobar");
      assertEquals(error.source, undefined);
      assertEquals(error.index, 3);
    });
  });
});
