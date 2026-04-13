interface ActionBarProps {
  canUndo: boolean;
  hasSelection: boolean;
  onUndo: () => void;
  onDeleteSelected: () => void;
  onOpenAdd: () => void;
}

export function ActionBar({ canUndo, hasSelection, onUndo, onDeleteSelected, onOpenAdd }: ActionBarProps) {
  return (
    <div className="action-bar">
      <button
        className="action-bar__undo-btn"
        onClick={onUndo}
        disabled={!canUndo}
        aria-label="Undo"
      >
        ↩
      </button>
      <button
        className="action-bar__delete-btn"
        onClick={onDeleteSelected}
        disabled={!hasSelection}
      >
        DELETE
      </button>
      <button
        className="action-bar__add-btn"
        onClick={onOpenAdd}
      >
        + ADD
      </button>
    </div>
  );
}
