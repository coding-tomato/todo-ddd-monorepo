import { describe, expect, it } from "vitest";
import { createItemId } from "./ListItem.js";

describe("createItemId", () => {
  it("returns a string matching UUID v4 format", () => {
    const id = createItemId();
    const uuidV4Regex =
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
    expect(id).toMatch(uuidV4Regex);
  });

  it("returns different values on two consecutive calls", () => {
    const id1 = createItemId();
    const id2 = createItemId();
    expect(id1).not.toBe(id2);
  });
});
