import { describe, it, expect } from 'vitest';
import { AddItemCommand } from './AddItemCommand.js';
import { TextList } from '../../domain/TextList.js';
import { InMemoryListRepository } from '../../__tests__/InMemoryListRepository.js';

describe('AddItemCommand', () => {
  it('execute() adds the item to the list and saves to repo', () => {
    const list = new TextList();
    const repo = new InMemoryListRepository();
    const cmd = new AddItemCommand(list, 'hello', repo);

    const result = cmd.execute();

    expect(result.getItems()).toHaveLength(1);
    expect(result.getItems()[0].text).toBe('hello');
    expect(repo.getStored()).toBe(list);
  });

  it('undo() removes the previously added item and saves to repo', () => {
    const list = new TextList();
    const repo = new InMemoryListRepository();
    const cmd = new AddItemCommand(list, 'hello', repo);

    cmd.execute();
    expect(list.getItems()).toHaveLength(1);

    const result = cmd.undo();

    expect(result.getItems()).toHaveLength(0);
    // repo.save was called again after undo
    expect(repo.getStored()).toBe(list);
  });

  it('execute() throws if text is empty (propagates domain invariant)', () => {
    const list = new TextList();
    const repo = new InMemoryListRepository();
    const cmd = new AddItemCommand(list, '   ', repo);

    expect(() => cmd.execute()).toThrow('Item text cannot be empty');
  });
});
