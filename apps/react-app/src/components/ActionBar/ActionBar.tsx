import styles from './ActionBar.module.css';

interface ActionBarProps {
  canUndo: boolean;
  hasSelection: boolean;
  onUndo: () => void;
  onDeleteSelected: () => void;
  onOpenAdd: () => void;
}

export function ActionBar({ canUndo, hasSelection, onUndo, onDeleteSelected, onOpenAdd }: ActionBarProps) {
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
        type="button"
        className={styles.addBtn}
        onClick={onOpenAdd}
      >
        + ADD
      </button>
    </div>
  );
}
