import { describe, expect, it, vi } from "vitest";
import { InMemoryListRepository } from "../__tests__/InMemoryListRepository.js";
import { TextList } from "../domain/TextList.js";
import type { Command } from "./Command.js";
import { CommandHistory } from "./CommandHistory.js";
import { AddItemCommand } from "./commands/AddItemCommand.js";

/** Build a fake Command that tracks calls without touching a real list. */
function makeStubCommand(list: TextList): Command {
  return {
    execute: vi.fn(() => list),
    undo: vi.fn(() => list),
  };
}

describe("CommandHistory", () => {
  it("execute() returns the post-mutation TextList (the value from command.execute)", () => {
    const history = new CommandHistory();
    const list = new TextList();
    const cmd = makeStubCommand(list);

    const result = history.execute(cmd);

    expect(result).toBe(list);
  });

  it("canUndo is false initially", () => {
    const history = new CommandHistory();
    expect(history.canUndo).toBe(false);
  });

  it("canUndo is true after first execute()", () => {
    const history = new CommandHistory();
    const list = new TextList();
    history.execute(makeStubCommand(list));
    expect(history.canUndo).toBe(true);
  });

  it("undo() returns null when stack is empty", () => {
    const history = new CommandHistory();
    expect(history.undo()).toBeNull();
  });

  it("undo() returns the restored list and decrements stack", () => {
    const history = new CommandHistory();
    const list = new TextList();
    const cmd = makeStubCommand(list);

    history.execute(cmd);
    expect(history.canUndo).toBe(true);

    const result = history.undo();

    expect(result).toBe(list);
    expect(cmd.undo).toHaveBeenCalledOnce();
    expect(history.canUndo).toBe(false);
  });

  it("stack cap: executing 51 commands keeps only 50; the 51st undo returns null", () => {
    const history = new CommandHistory();
    const repo = new InMemoryListRepository();
    const list = new TextList();

    // Execute 51 real AddItemCommands so each one actually mutates the list
    for (let i = 1; i <= 51; i++) {
      history.execute(new AddItemCommand(list, `item ${i}`, repo));
    }

    expect(history.canUndo).toBe(true);

    // Undo 50 times — all should succeed
    for (let i = 0; i < 50; i++) {
      const result = history.undo();
      expect(result).not.toBeNull();
    }

    // The 51st undo must return null (oldest command was dropped)
    expect(history.undo()).toBeNull();
  });
});
