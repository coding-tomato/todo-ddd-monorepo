import type { ListRepository } from '../domain/repositories/ListRepository.js';
import { TextList } from '../domain/TextList.js';

export function loadList(repo: ListRepository): TextList {
  return repo.load() ?? new TextList();
}
