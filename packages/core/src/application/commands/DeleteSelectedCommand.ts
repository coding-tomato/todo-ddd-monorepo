import type { ListItem } from "../../domain/ListItem.js";
import type { ListRepository } from "../../domain/repositories/ListRepository.js";
import type { TextList } from "../../domain/TextList.js";

export class DeleteSelectedCommand {
  private removed: { item: ListItem; index: number }[] = [];

  constructor(
    private readonly list: TextList,
    private readonly repo: ListRepository
  ) {}

  execute(): TextList {
    this.removed = this.list.deleteSelected();
    this.repo.save(this.list);
    return this.list;
  }

  undo(): TextList {
    // Restore in forward (ascending index) order so each insertion at the
    // original index is valid — earlier insertions shift later indices up correctly.
    const sorted = [...this.removed].sort((a, b) => a.index - b.index);
    for (const { item, index } of sorted) {
      this.list.restoreItem(item, index);
    }
    this.repo.save(this.list);
    return this.list;
  }
}
