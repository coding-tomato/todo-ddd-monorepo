import { Component } from './Component.js';
import { withErrorHandling } from '../errorHandler.js';

export class AddItemModal extends Component {
  constructor($root, { onAdd, onClose }) {
    super($root);
    this.$ = {
      input: $root.querySelector('.modal__input'),
      addBtn: $root.querySelector('.modal__add-btn'),
      cancelBtn: $root.querySelector('.modal__cancel-btn'),
    };
    this._onAdd = onAdd;
    this._onClose = onClose;
    this._bindEvents();
  }
  _bindEvents() {
    this.$.addBtn.addEventListener('click', withErrorHandling(() => {
      const text = this.$.input.value.trim();
      if (!text) return;
      this._onAdd(text);
      this.$.input.value = '';
      this._onClose();
    }));
    this.$.cancelBtn.addEventListener('click', () => this._onClose());
    this.$.input.addEventListener('input', () => {
      this.$.addBtn.disabled = !this.$.input.value.trim();
    });
    this.$.input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && this.$.input.value.trim()) {
        withErrorHandling(() => {
          this._onAdd(this.$.input.value.trim());
          this.$.input.value = '';
          this._onClose();
        })();
      }
    });
  }
  show() {
    this.$root.classList.remove('modal-overlay--hidden');
    this.$.input.focus();
    this.$.addBtn.disabled = true;
  }
  hide() {
    this.$root.classList.add('modal-overlay--hidden');
    this.$.input.value = '';
  }
}
