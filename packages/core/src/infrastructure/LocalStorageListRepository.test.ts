import { describe, it, expect, beforeEach, vi } from 'vitest';
import { TextList } from '../domain/TextList.js';
import { LocalStorageListRepository } from './LocalStorageListRepository.js';

describe('LocalStorageListRepository', () => {
  let repo: LocalStorageListRepository;

  beforeEach(() => {
    localStorage.clear();
    repo = new LocalStorageListRepository();
  });

  it('save() + load() round-trip: returns list with same items and IDs', () => {
    const list = new TextList();
    const item1 = list.addItem('first');
    const item2 = list.addItem('second');

    repo.save(list);
    const loaded = repo.load();

    expect(loaded).not.toBeNull();
    const items = loaded!.getItems();
    expect(items).toHaveLength(2);
    expect(items[0].id).toBe(item1.id);
    expect(items[0].text).toBe(item1.text);
    expect(items[1].id).toBe(item2.id);
    expect(items[1].text).toBe(item2.text);
  });

  it('load() returns null when localStorage is empty', () => {
    const result = repo.load();
    expect(result).toBeNull();
  });

  it('load() returns null when localStorage contains invalid JSON', () => {
    localStorage.setItem('text-list-manager', 'not-valid-json{{{');
    const result = repo.load();
    expect(result).toBeNull();
  });

  it('save() does not throw when localStorage.setItem throws QuotaExceededError', () => {
    const error = new DOMException('QuotaExceededError', 'QuotaExceededError');
    vi.spyOn(Storage.prototype, 'setItem').mockImplementationOnce(() => {
      throw error;
    });

    const list = new TextList();
    list.addItem('item');

    expect(() => repo.save(list)).not.toThrow();
  });
});
