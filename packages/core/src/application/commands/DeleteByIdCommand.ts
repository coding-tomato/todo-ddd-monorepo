import type { ListItem } from "../../domain/ListItem.js";
import type { ListRepository } from "../../domain/repositories/ListRepository.js";
import type { TextList } from "../../domain/TextList.js";

export class DeleteByIdCommand {
  private deleted: { item: ListItem; index: number } | null = null;

  constructor(
    private readonly list: TextList,
    private readonly id: string,
    private readonly repo: ListRepository
  ) {}

  execute(): TextList {
    this.deleted = this.list.deleteById(this.id);
    this.repo.save(this.list);
    return this.list;
  }

  undo(): TextList {
    if (this.deleted === null) {
      throw new Error("Cannot undo: execute() was not called");
    }
    this.list.restoreItem(this.deleted.item, this.deleted.index);
    this.repo.save(this.list);
    return this.list;
  }
}
