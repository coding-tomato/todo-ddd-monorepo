import { Component } from './Component.js';
import { LocalStorageListRepository, CommandHistory, loadList,
         AddItemCommand, DeleteSelectedCommand, DeleteByIdCommand } from '@repo/core';
import { ItemListComponent } from './ItemListComponent.js';
import { ActionBarComponent } from './ActionBarComponent.js';
import { AddItemModal } from './AddItemModal.js';
import { withErrorHandling } from '../errorHandler.js';

export class AppComponent extends Component {
  constructor($root, repo = null) {
    super($root);
    this._repo = repo ?? new LocalStorageListRepository();
    this._history = new CommandHistory();
    this._list = loadList(this._repo);
    this._initDOM();
    this._initComponents();
    this._renderAll();
  }
  _initDOM() {
    this.$root.innerHTML = `
      <div class="card">
        <h1 class="card__heading">This is a technical proof</h1>
        <p class="card__description">A Text List Manager built with DDD and clean architecture.</p>
        <div class="item-list-container"></div>
        <div class="action-bar">
          <button class="action-bar__undo-btn" aria-label="Undo">↩</button>
          <button class="action-bar__delete-btn">DELETE</button>
          <button class="action-bar__add-btn">ADD</button>
        </div>
      </div>
      <div class="modal-overlay modal-overlay--hidden">
        <div class="modal">
          <label class="modal__label">Add item to list</label>
          <input class="modal__input" type="text" placeholder="Type the text here…" />
          <div class="modal__actions">
            <button class="modal__add-btn" disabled>ADD</button>
            <button class="modal__cancel-btn">CANCEL</button>
          </div>
        </div>
      </div>
    `;
  }
  _initComponents() {
    this._itemList = new ItemListComponent(
      this.$root.querySelector('.item-list-container'),
      {
        onSelect: withErrorHandling((id) => { this._list.selectItem(id); this._renderAll(); }),
        onToggle: withErrorHandling((id) => { this._list.toggleItem(id); this._renderAll(); }),
        onDelete: withErrorHandling((id) => {
          this._list = this._history.execute(new DeleteByIdCommand(this._list, id, this._repo));
          this._renderAll();
        }),
      }
    );
    this._actionBar = new ActionBarComponent(
      this.$root.querySelector('.action-bar'),
      {
        onUndo: () => {
          const result = this._history.undo();
          if (result) { this._list = result; this._renderAll(); }
        },
        onDelete: () => {
          this._list = this._history.execute(new DeleteSelectedCommand(this._list, this._repo));
          this._renderAll();
        },
        onOpenAdd: () => this._modal.show(),
      }
    );
    this._modal = new AddItemModal(
      this.$root.querySelector('.modal-overlay'),
      {
        onAdd: (text) => {
          this._list = this._history.execute(new AddItemCommand(this._list, text, this._repo));
          this._renderAll();
        },
        onClose: () => this._modal.hide(),
      }
    );
  }
  _renderAll() {
    this._itemList.render(this._list);
    this._actionBar.render(this._list, this._history.canUndo);
  }
}
