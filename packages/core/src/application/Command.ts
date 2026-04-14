import type { TextList } from "../domain/TextList.js";

export interface Command {
  execute(): TextList;
  undo(): TextList;
}
