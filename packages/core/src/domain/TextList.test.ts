import { describe, it, expect, beforeEach } from 'vitest';
import { TextList } from './TextList.js';
import type { ListItem } from './ListItem.js';

describe('TextList', () => {
  let list: TextList;

  beforeEach(() => {
    list = new TextList();
  });

  describe('addItem', () => {
    it('returns an item with a UUID id and appends it to getItems()', () => {
      const item = list.addItem('hello');
      const uuidV4Regex =
        /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
      expect(item.id).toMatch(uuidV4Regex);
      expect(item.text).toBe('hello');
      expect(item.isSelected).toBe(false);
      expect(list.getItems()).toHaveLength(1);
      expect(list.getItems()[0]).toBe(item);
    });

    it('throws "Item text cannot be empty" when given an empty string', () => {
      expect(() => list.addItem('')).toThrow('Item text cannot be empty');
    });

    it('throws "Item text cannot be empty" when given whitespace-only text', () => {
      expect(() => list.addItem('   ')).toThrow('Item text cannot be empty');
    });

    it('trims text before storing', () => {
      const item = list.addItem('  hello  ');
      expect(item.text).toBe('hello');
    });
  });

  describe('deleteSelected', () => {
    it('throws "No items selected" when no items are selected', () => {
      list.addItem('a');
      list.addItem('b');
      expect(() => list.deleteSelected()).toThrow('No items selected');
    });

    it('throws "No items selected" when list is empty', () => {
      expect(() => list.deleteSelected()).toThrow('No items selected');
    });

    it('removes all selected items and returns them with correct original indices', () => {
      const a = list.addItem('a'); // index 0
      const b = list.addItem('b'); // index 1
      const c = list.addItem('c'); // index 2
      const d = list.addItem('d'); // index 3
      const e = list.addItem('e'); // index 4

      // Select items at indices 0, 2, 4
      list.toggleItem(a.id);
      list.toggleItem(c.id);
      list.toggleItem(e.id);

      const removed = list.deleteSelected();

      // Returns 3 removed items
      expect(removed).toHaveLength(3);

      // Each entry carries the pre-removal index
      const removedById = Object.fromEntries(removed.map((r) => [r.item.id, r]));
      expect(removedById[a.id].index).toBe(0);
      expect(removedById[c.id].index).toBe(2);
      expect(removedById[e.id].index).toBe(4);

      // Removed items are gone from the list
      const remaining = list.getItems();
      expect(remaining).toHaveLength(2);
      expect(remaining.map((i) => i.id)).toEqual([b.id, d.id]);
    });
  });

  describe('deleteById', () => {
    it('removes the correct item and returns it with its original index', () => {
      const a = list.addItem('a'); // index 0
      const b = list.addItem('b'); // index 1
      const c = list.addItem('c'); // index 2

      const result = list.deleteById(b.id);

      expect(result.item).toEqual(b);
      expect(result.index).toBe(1);
      expect(list.getItems()).toHaveLength(2);
      expect(list.getItems().map((i) => i.id)).toEqual([a.id, c.id]);
    });

    it('throws "Item not found" for an unknown id', () => {
      list.addItem('a');
      expect(() => list.deleteById('nonexistent-id')).toThrow('Item not found');
    });
  });

  describe('selectItem', () => {
    it('deselects all other items and selects only the target', () => {
      const a = list.addItem('a');
      const b = list.addItem('b');
      const c = list.addItem('c');

      // Pre-select a and b via toggle (multi-select)
      list.toggleItem(a.id);
      list.toggleItem(b.id);

      // Now single-select c
      list.selectItem(c.id);

      const items = list.getItems();
      const byId = Object.fromEntries(items.map((i) => [i.id, i]));

      expect(byId[a.id].isSelected).toBe(false);
      expect(byId[b.id].isSelected).toBe(false);
      expect(byId[c.id].isSelected).toBe(true);
    });
  });

  describe('toggleItem', () => {
    it('toggles only the target item and does not affect others', () => {
      const a = list.addItem('a');
      const b = list.addItem('b');
      const c = list.addItem('c');

      // Start: all unselected
      list.toggleItem(b.id);

      let items = list.getItems();
      let byId = Object.fromEntries(items.map((i) => [i.id, i]));
      expect(byId[a.id].isSelected).toBe(false);
      expect(byId[b.id].isSelected).toBe(true);
      expect(byId[c.id].isSelected).toBe(false);

      // Toggle b off again
      list.toggleItem(b.id);

      items = list.getItems();
      byId = Object.fromEntries(items.map((i) => [i.id, i]));
      expect(byId[a.id].isSelected).toBe(false);
      expect(byId[b.id].isSelected).toBe(false);
      expect(byId[c.id].isSelected).toBe(false);
    });
  });

  describe('restoreItem', () => {
    it('re-inserts an item at index 0, shifting existing items', () => {
      const a = list.addItem('a');
      const b = list.addItem('b');

      const ghost: ListItem = { id: 'ghost-id', text: 'ghost', isSelected: false };
      list.restoreItem(ghost, 0);

      const items = list.getItems();
      expect(items).toHaveLength(3);
      expect(items[0].id).toBe('ghost-id');
      expect(items[1].id).toBe(a.id);
      expect(items[2].id).toBe(b.id);
    });

    it('re-inserts an item at the specified index in the middle of the list', () => {
      const a = list.addItem('a');
      const b = list.addItem('b');
      const c = list.addItem('c');

      const ghost: ListItem = { id: 'ghost-id', text: 'ghost', isSelected: false };
      list.restoreItem(ghost, 2);

      const items = list.getItems();
      expect(items).toHaveLength(4);
      expect(items[0].id).toBe(a.id);
      expect(items[1].id).toBe(b.id);
      expect(items[2].id).toBe('ghost-id');
      expect(items[3].id).toBe(c.id);
    });
  });

  describe('deleteSelected + restoreItem round-trip', () => {
    it('restores list to original state after deleteSelected + ascending-order restoreItem', () => {
      const a = list.addItem('a'); // 0
      const _b = list.addItem('b'); // 1
      const c = list.addItem('c'); // 2
      const _d = list.addItem('d'); // 3
      const e = list.addItem('e'); // 4

      const originalSnapshot = list.getItems().map((i) => ({ ...i }));

      // Select items at positions 0, 2, 4
      list.toggleItem(a.id);
      list.toggleItem(c.id);
      list.toggleItem(e.id);

      const removed = list.deleteSelected();

      // Sort removed in ascending index order (lowest index first) so each
      // splice inserts at the correct position without disturbing later indices.
      const sortedAsc = [...removed].sort((x, y) => x.index - y.index);

      for (const { item, index } of sortedAsc) {
        list.restoreItem(item, index);
      }

      const restored = list.getItems();
      expect(restored).toHaveLength(5);
      for (let i = 0; i < 5; i++) {
        expect(restored[i].id).toBe(originalSnapshot[i].id);
        expect(restored[i].text).toBe(originalSnapshot[i].text);
      }
    });
  });
});
