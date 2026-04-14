import { describe, expect, it } from "vitest";
import {
  AddItemCommand,
  CommandHistory,
  createItemId,
  DeleteByIdCommand,
  DeleteSelectedCommand,
  LocalStorageListRepository,
  loadList,
  TextList,
} from "./index";

describe("index barrel exports", () => {
  it("exports TextList as a non-undefined value", () => {
    expect(TextList).toBeDefined();
  });

  it("exports TextList as a constructor/class", () => {
    expect(typeof TextList).toBe("function");
  });

  it("exports createItemId as a non-undefined value", () => {
    expect(createItemId).toBeDefined();
  });

  it("exports createItemId as a function", () => {
    expect(typeof createItemId).toBe("function");
  });

  it("exports CommandHistory as a non-undefined value", () => {
    expect(CommandHistory).toBeDefined();
  });

  it("exports CommandHistory as a constructor/class", () => {
    expect(typeof CommandHistory).toBe("function");
  });

  it("exports AddItemCommand as a non-undefined value", () => {
    expect(AddItemCommand).toBeDefined();
  });

  it("exports AddItemCommand as a constructor/class", () => {
    expect(typeof AddItemCommand).toBe("function");
  });

  it("exports DeleteSelectedCommand as a non-undefined value", () => {
    expect(DeleteSelectedCommand).toBeDefined();
  });

  it("exports DeleteSelectedCommand as a constructor/class", () => {
    expect(typeof DeleteSelectedCommand).toBe("function");
  });

  it("exports DeleteByIdCommand as a non-undefined value", () => {
    expect(DeleteByIdCommand).toBeDefined();
  });

  it("exports DeleteByIdCommand as a constructor/class", () => {
    expect(typeof DeleteByIdCommand).toBe("function");
  });

  it("exports loadList as a non-undefined value", () => {
    expect(loadList).toBeDefined();
  });

  it("exports loadList as a function", () => {
    expect(typeof loadList).toBe("function");
  });

  it("exports LocalStorageListRepository as a non-undefined value", () => {
    expect(LocalStorageListRepository).toBeDefined();
  });

  it("exports LocalStorageListRepository as a constructor/class", () => {
    expect(typeof LocalStorageListRepository).toBe("function");
  });
});
