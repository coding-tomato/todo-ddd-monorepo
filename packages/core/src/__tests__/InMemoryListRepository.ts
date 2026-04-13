import type { TextList } from '../domain/TextList.js';
import type { ListRepository } from '../domain/repositories/ListRepository.js';

export class InMemoryListRepository implements ListRepository {
  private stored: TextList | null = null;

  save(list: TextList): void {
    this.stored = list;
  }

  load(): TextList | null {
    return this.stored;
  }

  /** Convenience: inspect what was last saved */
  getStored(): TextList | null {
    return this.stored;
  }
}
