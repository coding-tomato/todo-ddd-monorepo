import type React from "react";
import styles from "./ActionBar.module.css";

interface ActionBarProps {
  canUndo: boolean;
  hasSelection: boolean;
  onUndo: () => void;
  onDeleteSelected: () => void;
  onOpenAdd: () => void;
  addBtnRef?: React.RefObject<HTMLButtonElement>;
}

export function ActionBar({
  canUndo,
  hasSelection,
  onUndo,
  onDeleteSelected,
  onOpenAdd,
  addBtnRef,
}: ActionBarProps) {
  return (
    <div className={styles.actionBar}>
      <button
        type="button"
        className={styles.undoBtn}
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
      >
        ↩
      </button>
      <button
        type="button"
        className={styles.deleteBtn}
        onClick={onDeleteSelected}
        disabled={!hasSelection}
      >
        DELETE
      </button>
      <button
        ref={addBtnRef}
        type="button"
        className={styles.addBtn}
        onClick={onOpenAdd}
      >
        + ADD
      </button>
    </div>
  );
}
