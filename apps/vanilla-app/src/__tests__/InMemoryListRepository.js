

export class InMemoryListRepository {
  constructor() {
    this._saved = null;
  }

  save(list) {
    this._saved = list;
  }

  load() {
    return this._saved;
  }
}
