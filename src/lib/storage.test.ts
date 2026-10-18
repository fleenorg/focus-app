import { afterEach, describe, expect, it } from "vitest";
import { readJson, writeJson } from "./storage";

describe("storage adapter", () => {
  afterEach(() => {
    window.localStorage.clear();
  });

  it("round-trips JSON", () => {
    writeJson("lumen.test", { hello: "world" });
    const value = readJson("lumen.test", (raw) => {
      if (typeof raw === "object" && raw !== null && "hello" in raw) {
        return raw as { hello: string };
      }
      return null;
    });
    expect(value).toEqual({ hello: "world" });
  });

  it("returns null for malformed JSON and missing keys", () => {
    window.localStorage.setItem("lumen.bad", "{not json");
    expect(readJson("lumen.bad", () => ({ ok: true }))).toBeNull();
    expect(readJson("lumen.missing", () => ({ ok: true }))).toBeNull();
  });

  it("returns null when the schema parser rejects the payload", () => {
    writeJson("lumen.schema", { unexpected: true });
    expect(readJson("lumen.schema", () => null)).toBeNull();
  });
});
