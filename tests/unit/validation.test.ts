import { describe, expect, it } from "vitest";
import { clamp, safeJsonParse, asArray, truncate, initials, pluralize, cn } from "@/lib/utils";

describe("clamp", () => {
  it("bounds values", () => {
    expect(clamp(5, 0, 10)).toBe(5);
    expect(clamp(-5, 0, 10)).toBe(0);
    expect(clamp(15, 0, 10)).toBe(10);
  });
});

describe("safeJsonParse", () => {
  it("parses valid JSON strings", () => {
    expect(safeJsonParse<number[]>("[1,2,3]", [])).toEqual([1, 2, 3]);
  });

  it("returns the fallback for invalid input", () => {
    expect(safeJsonParse<number[]>("not json", [])).toEqual([]);
    expect(safeJsonParse<number[]>(null, [])).toEqual([]);
    expect(safeJsonParse<number[]>(undefined, [])).toEqual([]);
  });

  it("passes through objects", () => {
    const obj = { a: 1 };
    expect(safeJsonParse(obj, {})).toBe(obj);
  });
});

describe("asArray", () => {
  it("normalizes arrays and comma lists", () => {
    expect(asArray(["a", "b"])).toEqual(["a", "b"]);
    expect(asArray("a, b, c")).toEqual(["a", "b", "c"]);
    expect(asArray("")).toEqual([]);
    expect(asArray(null)).toEqual([]);
  });
});

describe("truncate / initials / pluralize / cn", () => {
  it("truncates long text", () => {
    expect(truncate("short")).toBe("short");
    expect(truncate("x".repeat(200)).length).toBeLessThan(200);
  });

  it("builds initials", () => {
    expect(initials("Aarav Sharma")).toBe("AS");
    expect(initials("Ada")).toBe("A");
  });

  it("pluralizes", () => {
    expect(pluralize(1, "student")).toBe("student");
    expect(pluralize(3, "student")).toBe("students");
  });

  it("joins class names", () => {
    expect(cn("a", false && "b", null, "c")).toBe("a c");
  });
});
