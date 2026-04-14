import { withErrorHandling } from "../../utils/errorHandler.js";
import { Component } from "../shared/Component.js";
import "./AddItemModal.css";

export class AddItemModal extends Component {
  constructor($root, { onAdd, onClose }) {
    super($root);
    this.$ = {
      input: $root.querySelector(".modal__input"),
      addBtn: $root.querySelector(".modal__add-btn"),
      cancelBtn: $root.querySelector(".modal__cancel-btn"),
    };
    this._onAdd = onAdd;
    this._onClose = onClose;
    this._bindEvents();
  }
  _bindEvents() {
    this.$.addBtn.addEventListener(
      "click",
      withErrorHandling(() => {
        const text = this.$.input.value.trim();
        if (!text) return;
        this._onAdd(text);
        this.$.input.value = "";
        this._onClose();
      })
    );
    this.$.cancelBtn.addEventListener("click", () => this._onClose());
    this.$.input.addEventListener("input", () => {
      this.$.addBtn.disabled = !this.$.input.value.trim();
    });
    this.$.input.addEventListener("keydown", (e) => {
      if (e.key === "Enter" && this.$.input.value.trim()) {
        e.preventDefault();
        withErrorHandling(() => {
          this._onAdd(this.$.input.value.trim());
          this.$.input.value = "";
          this._onClose();
        })();
      }
    });
    // Escape closes the modal
    this.$root.addEventListener("keydown", (e) => {
      if (e.key === "Escape") this._onClose();
    });
    // Focus trap: keep Tab/Shift+Tab inside the dialog
    const dialog = this.$root.querySelector('[role="dialog"]');
    dialog.addEventListener("keydown", (e) => {
      if (e.key !== "Tab") return;
      const focusable = Array.from(
        dialog.querySelectorAll('button:not([disabled]), input')
      );
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (e.shiftKey) {
        if (document.activeElement === first) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
  }
  show(openerElement = null) {
    this._opener = openerElement;
    this.$root.classList.remove("modal-overlay--hidden");
    this.$.input.focus();
    this.$.addBtn.disabled = true;
  }
  hide() {
    this.$root.classList.add("modal-overlay--hidden");
    this.$.input.value = "";
    if (this._opener) {
      this._opener.focus();
      this._opener = null;
    }
  }
}
