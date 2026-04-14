import { useState } from "react";
import styles from "./AddItemModal.module.css";

interface AddItemModalProps {
  onAdd: (text: string) => void;
  onClose: () => void;
}

export function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const [inputValue, setInputValue] = useState("");

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
          className={styles.input}
          id="add-item-modal-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleSubmit();
          }}
          placeholder="Type the text here..."
          aria-label="Item text"
        />
        <div className={styles.actions}>
          <button
            type="button"
            className={styles.addBtn}
            onClick={handleSubmit}
            disabled={inputValue.trim() === ""}
          >
            ADD
          </button>
          <button type="button" className={styles.cancelBtn} onClick={onClose}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
