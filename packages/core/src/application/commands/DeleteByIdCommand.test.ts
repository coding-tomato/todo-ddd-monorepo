import { describe, expect, it } from "vitest";
import { InMemoryListRepository } from "../../__tests__/InMemoryListRepository.js";
import { TextList } from "../../domain/TextList.js";
import { DeleteByIdCommand } from "./DeleteByIdCommand.js";

describe("DeleteByIdCommand", () => {
  it("execute() removes item by id and saves to repo", () => {
    const list = new TextList();
    list.addItem("first");
    list.addItem("second");
    list.addItem("third");
    const repo = new InMemoryListRepository();

    const targetId = list.getItems()[1].id; // 'second' at index 1
    const cmd = new DeleteByIdCommand(list, targetId, repo);
    const result = cmd.execute();

    expect(result.getItems().map((i) => i.text)).toEqual(["first", "third"]);
    expect(repo.getStored()).toBe(list);
  });

  it("undo() restores item at its original position", () => {
    const list = new TextList();
    list.addItem("first");
    list.addItem("second");
    list.addItem("third");
    const repo = new InMemoryListRepository();

    const targetId = list.getItems()[1].id; // 'second' at index 1
    const cmd = new DeleteByIdCommand(list, targetId, repo);
    cmd.execute();
    // list is now ['first', 'third']
    expect(list.getItems().map((i) => i.text)).toEqual(["first", "third"]);

    const result = cmd.undo();

    // 'second' should be back at index 1
    expect(result.getItems().map((i) => i.text)).toEqual([
      "first",
      "second",
      "third",
    ]);
    expect(repo.getStored()).toBe(list);
  });
});
