import type { ListItem } from './ListItem.js';
import { createItemId } from './ListItem.js';

export class TextList {
  private items: ListItem[] = [];

  getItems(): ReadonlyArray<ListItem> {
    return this.items;
  }

  addItem(text: string): ListItem {
    const trimmed = text.trim();
    if (trimmed === '') {
      throw new Error('Item text cannot be empty');
    }
    const item: ListItem = {
      id: createItemId(),
      text: trimmed,
      isSelected: false,
    };
    this.items.push(item);
    return item;
  }

  deleteSelected(): { item: ListItem; index: number }[] {
    const selected = this.items
      .map((item, index) => ({ item, index }))
      .filter(({ item }) => item.isSelected);

    if (selected.length === 0) {
      throw new Error('No items selected');
    }

    const selectedIds = new Set(selected.map(({ item }) => item.id));
    this.items = this.items.filter((item) => !selectedIds.has(item.id));

    return selected;
  }

  deleteById(id: string): { item: ListItem; index: number } {
    const index = this.items.findIndex((item) => item.id === id);
    if (index === -1) {
      throw new Error('Item not found');
    }
    const [item] = this.items.splice(index, 1);
    return { item, index };
  }

  selectItem(id: string): void {
    this.items = this.items.map((item) => ({
      ...item,
      isSelected: item.id === id,
    }));
  }

  toggleItem(id: string): void {
    this.items = this.items.map((item) =>
      item.id === id ? { ...item, isSelected: !item.isSelected } : item,
    );
  }

  restoreItem(item: ListItem, index: number): void {
    this.items.splice(index, 0, item);
  }
}
