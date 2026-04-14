import { describe, expect, it } from "vitest";
import { InMemoryListRepository } from "../__tests__/InMemoryListRepository.js";
import { TextList } from "../domain/TextList.js";
import { loadList } from "./loadList.js";

describe("loadList", () => {
  it("returns a new empty TextList when repo.load() returns null", () => {
    const repo = new InMemoryListRepository();
    // repo has nothing stored → load() returns null

    const result = loadList(repo);

    expect(result).toBeInstanceOf(TextList);
    expect(result.getItems()).toHaveLength(0);
  });

  it("returns the persisted TextList when repository has data", () => {
    const repo = new InMemoryListRepository();
    const existing = new TextList();
    existing.addItem("persisted item");
    repo.save(existing);

    const result = loadList(repo);

    expect(result).toBe(existing);
    expect(result.getItems()[0].text).toBe("persisted item");
  });
});
