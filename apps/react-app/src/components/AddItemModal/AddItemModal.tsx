import { useEffect, useRef, useState } from "react";
import styles from "./AddItemModal.module.css";

interface AddItemModalProps {
  onAdd: (text: string) => void;
  onClose: () => void;
}

export function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const [inputValue, setInputValue] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);
  const addBtnRef = useRef<HTMLButtonElement>(null);
  const cancelBtnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
        return;
      }
      if (e.key === "Tab") {
        const focusable = [
          inputRef.current,
          addBtnRef.current,
          cancelBtnRef.current,
        ].filter(
          (el): el is HTMLElement => el !== null && !el.hasAttribute("disabled")
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
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInputValue("");
  };

  return (
    <div className={styles.overlay}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-item-modal-title"
      >
        <h2 className={styles.title} id="add-item-modal-title">
          Add item to list
        </h2>
        <input
          ref={inputRef}
          className={styles.input}
          id="add-item-modal-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSubmit();
            }
          }}
          placeholder="Enter item text"
          aria-label="Item text"
        />
        <div className={styles.actions}>
          <button
            ref={addBtnRef}
            type="button"
            className={styles.addBtn}
            onClick={handleSubmit}
            disabled={inputValue.trim() === ""}
          >
            ADD
          </button>
          <button
            ref={cancelBtnRef}
            type="button"
            className={styles.cancelBtn}
            onClick={onClose}
          >
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
