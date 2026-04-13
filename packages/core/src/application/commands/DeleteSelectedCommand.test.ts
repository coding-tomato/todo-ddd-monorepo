import { describe, it, expect } from 'vitest';
import { DeleteSelectedCommand } from './DeleteSelectedCommand.js';
import { TextList } from '../../domain/TextList.js';
import { InMemoryListRepository } from '../../__tests__/InMemoryListRepository.js';

function buildListWithItems(texts: string[]): TextList {
  const list = new TextList();
  for (const t of texts) {
    list.addItem(t);
  }
  return list;
}

describe('DeleteSelectedCommand', () => {
  it('execute() removes all selected items and saves to repo', () => {
    const list = buildListWithItems(['a', 'b', 'c']);
    const repo = new InMemoryListRepository();

    // Select items at index 0 and 2 (non-contiguous)
    list.toggleItem(list.getItems()[0].id);
    list.toggleItem(list.getItems()[2].id);

    const cmd = new DeleteSelectedCommand(list, repo);
    const result = cmd.execute();

    expect(result.getItems()).toHaveLength(1);
    expect(result.getItems()[0].text).toBe('b');
    expect(repo.getStored()).toBe(list);
  });

  it('undo() restores items at correct original positions (non-contiguous selected)', () => {
    const list = buildListWithItems(['a', 'b', 'c', 'd']);
    const repo = new InMemoryListRepository();

    // Select items at original indices 0 ('a') and 2 ('c')
    list.toggleItem(list.getItems()[0].id);
    list.toggleItem(list.getItems()[2].id);

    const cmd = new DeleteSelectedCommand(list, repo);
    cmd.execute();
    // After delete, list should be ['b', 'd']
    expect(list.getItems().map((i) => i.text)).toEqual(['b', 'd']);

    const result = cmd.undo();

    // After undo, original order should be restored: ['a', 'b', 'c', 'd']
    expect(result.getItems().map((i) => i.text)).toEqual(['a', 'b', 'c', 'd']);
    expect(repo.getStored()).toBe(list);
  });

  it('execute() throws if no items are selected', () => {
    const list = buildListWithItems(['a', 'b']);
    const repo = new InMemoryListRepository();
    const cmd = new DeleteSelectedCommand(list, repo);

    expect(() => cmd.execute()).toThrow('No items selected');
  });
});
