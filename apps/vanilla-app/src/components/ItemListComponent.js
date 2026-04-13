import { Component } from './Component.js';

export class ItemListComponent extends Component {
  constructor($root, { onSelect, onToggle, onDelete }) {
    super($root);
    this._onSelect = onSelect;
    this._onToggle = onToggle;
    this._onDelete = onDelete;
  }
  render(list) {
    this.$root.innerHTML = '';
    const ul = document.createElement('ul');
    ul.className = 'item-list';
    list.getItems().forEach(item => {
      const li = document.createElement('li');
      li.className = 'item-list__item' + (item.isSelected ? ' item-list__item--selected' : '');
      li.textContent = item.text;
      li.dataset.id = item.id;
      li.addEventListener('click', (e) => {
        if (e.ctrlKey || e.metaKey) {
          this._onToggle(item.id);
        } else {
          this._onSelect(item.id);
        }
      });
      li.addEventListener('dblclick', () => this._onDelete(item.id));
      ul.appendChild(li);
    });
    this.$root.appendChild(ul);
  }
}
