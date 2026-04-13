import type { TextList } from '../domain/TextList.js';
import type { Command } from './Command.js';

export class CommandHistory {
  private stack: Command[] = [];
  private readonly MAX_HISTORY = 50;

  get canUndo(): boolean {
    return this.stack.length > 0;
  }

  execute(command: Command): TextList {
    const result = command.execute();
    this.stack.push(command);
    if (this.stack.length > this.MAX_HISTORY) {
      this.stack.shift();
    }
    return result;
  }

  undo(): TextList | null {
    const command = this.stack.pop();
    if (command === undefined) {
      return null;
    }
    return command.undo();
  }
}
