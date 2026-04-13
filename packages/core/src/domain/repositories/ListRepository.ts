import type { TextList } from '../TextList.js';

export interface ListRepository {
  save(list: TextList): void;
  load(): TextList | null;
}
