import { withErrorHandling } from "../../utils/errorHandler.js";
import { Component } from "../shared/Component.js";
import "./ActionBarComponent.css";

export class ActionBarComponent extends Component {
  constructor($root, { onUndo, onDelete, onOpenAdd }) {
    super($root);
    this.$ = {
      undoBtn: $root.querySelector(".action-bar__undo-btn"),
      deleteBtn: $root.querySelector(".action-bar__delete-btn"),
      addBtn: $root.querySelector(".action-bar__add-btn"),
    };
    this.$.undoBtn.addEventListener("click", withErrorHandling(onUndo));
    this.$.deleteBtn.addEventListener("click", withErrorHandling(onDelete));
    this.$.addBtn.addEventListener("click", onOpenAdd);
  }
  render(list, canUndo) {
    const hasSelection = list.getItems().some((i) => i.isSelected);
    this.$.undoBtn.disabled = !canUndo;
    this.$.deleteBtn.disabled = !hasSelection;
  }
}
