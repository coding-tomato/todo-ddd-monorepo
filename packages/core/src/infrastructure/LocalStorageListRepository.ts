import type { ListItem } from "../domain/ListItem.js";
import type { ListRepository } from "../domain/repositories/ListRepository.js";
import { TextList } from "../domain/TextList.js";

const STORAGE_KEY = "text-list-manager";

export class LocalStorageListRepository implements ListRepository {
  save(list: TextList): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(list.getItems()));
    } catch {
      // swallow quota / security errors
    }
  }

  load(): TextList | null {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const items = JSON.parse(raw);
      const list = new TextList();
      items.forEach((item: ListItem, index: number) => {
        list.restoreItem(item, index);
      });
      return list;
    } catch {
      return null;
    }
  }
}
