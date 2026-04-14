import type { ListRepository, TextList } from "@repo/core";

export class InMemoryListRepository implements ListRepository {
  private stored: TextList | null = null;

  save(list: TextList): void {
    this.stored = list;
  }

  load(): TextList | null {
    return this.stored;
  }
}
