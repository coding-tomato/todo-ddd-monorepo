import {
  AddItemCommand,
  CommandHistory,
  DeleteByIdCommand,
  DeleteSelectedCommand,
  LocalStorageListRepository,
  loadList,
} from "@repo/core";
import { withErrorHandling } from "../../utils/errorHandler.js";
import { ActionBarComponent } from "../ActionBarComponent/ActionBarComponent.js";
import { AddItemModal } from "../AddItemModal/AddItemModal.js";
import { ItemListComponent } from "../ItemListComponent/ItemListComponent.js";
import { Component } from "../shared/Component.js";
import "./AppComponent.css";

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
      <main>
        <div class="card">
          <h1 class="card__heading">This is a technical proof</h1>
          <p class="card__description">Lorem ipsum dolor sit amet consectetur adipiscing,
          elit mus primis nec inceptos. Lacinia habitasse arcu molestie maecenas cursus quam nunc,
          hendrerit posuere augue fames dictumst placerat porttitor, dis mi pharetra vestibulum
          venenatis phasellus.</p>
          <div class="item-list-container"></div>
          <div class="action-bar">
            <button class="action-bar__undo-btn" aria-label="Undo">↩</button>
            <button class="action-bar__delete-btn">DELETE</button>
            <button class="action-bar__add-btn">+ ADD</button>
          </div>
        </div>
      </main>
      <div class="modal-overlay modal-overlay--hidden">
        <div class="modal" role="dialog" aria-modal="true" aria-labelledby="modal-title">
          <label class="modal__label" id="modal-title" for="modal-input">Add item to list</label>
          <input class="modal__input" id="modal-input" type="text" placeholder="Type the text here…" />
          <div class="modal__actions">
            <button class="modal__add-btn" disabled>ADD</button>
            <button class="modal__cancel-btn">CANCEL</button>
          </div>
        </div>
      </div>
      <div class="sr-only" aria-live="polite" aria-atomic="true"></div>
    `;
    this.$liveRegion = this.$root.querySelector("[aria-live]");
  }
  _initComponents() {
    this._itemList = new ItemListComponent(
      this.$root.querySelector(".item-list-container"),
      {
        onSelect: withErrorHandling((id) => {
          this._list.selectItem(id);
          this._renderAll();
        }),
        onToggle: withErrorHandling((id) => {
          this._list.toggleItem(id);
          this._renderAll();
        }),
        onDelete: withErrorHandling((id) => {
          this._list = this._history.execute(
            new DeleteByIdCommand(this._list, id, this._repo)
          );
          this._renderAll();
        }),
      }
    );
    this._actionBar = new ActionBarComponent(
      this.$root.querySelector(".action-bar"),
      {
        onUndo: () => {
          const result = this._history.undo();
          if (result) {
            this._list = result;
            this._renderAll();
          }
        },
        onDelete: () => {
          this._list = this._history.execute(
            new DeleteSelectedCommand(this._list, this._repo)
          );
          this._renderAll();
        },
        onOpenAdd: () =>
          this._modal.show(this.$root.querySelector(".action-bar__add-btn")),
      }
    );
    this._modal = new AddItemModal(this.$root.querySelector(".modal-overlay"), {
      onAdd: (text) => {
        this._list = this._history.execute(
          new AddItemCommand(this._list, text, this._repo)
        );
        this._renderAll();
      },
      onClose: () => this._modal.hide(),
    });
  }
  _renderAll() {
    const newCount = this._list.getItems().length;
    if (this._prevCount !== undefined && newCount !== this._prevCount) {
      const diff = newCount - this._prevCount;
      this.$liveRegion.textContent =
        diff > 0
          ? `Item added. ${newCount} item${newCount === 1 ? "" : "s"} in list.`
          : `Item deleted. ${newCount} item${newCount === 1 ? "" : "s"} in list.`;
    }
    this._prevCount = newCount;
    this._itemList.render(this._list);
    this._actionBar.render(this._list, this._history.canUndo);
  }
}
