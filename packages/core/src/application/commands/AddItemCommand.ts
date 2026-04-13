import type { ListItem } from '../../domain/ListItem.js';
import type { TextList } from '../../domain/TextList.js';
import type { ListRepository } from '../../domain/repositories/ListRepository.js';

export class AddItemCommand {
  private addedId: string | null = null;

  constructor(
    private readonly list: TextList,
    private readonly text: string,
    private readonly repo: ListRepository,
  ) {}

  execute(): TextList {
    const item: ListItem = this.list.addItem(this.text);
    this.addedId = item.id;
    this.repo.save(this.list);
    return this.list;
  }

  undo(): TextList {
    if (this.addedId === null) {
      throw new Error('Cannot undo: execute() was not called');
    }
    this.list.deleteById(this.addedId);
    this.repo.save(this.list);
    return this.list;
  }
}
