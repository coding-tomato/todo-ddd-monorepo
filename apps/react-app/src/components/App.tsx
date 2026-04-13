import { useState, useMemo } from 'react';
import { LocalStorageListRepository } from '@repo/core';
import { useTextList } from '../hooks/useTextList';
import { ErrorBoundary } from './ErrorBoundary';
import { ItemList } from './ItemList';
import { ActionBar } from './ActionBar';
import { AddItemModal } from './AddItemModal';

export function App() {
  const repo = useMemo(() => new LocalStorageListRepository(), []);
  const {
    list, error, canUndo,
    handleAddItem, handleDeleteSelected, handleDeleteById,
    handleSelectItem, handleToggleItem, handleUndo,
  } = useTextList(repo);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="app">
      <div className="card">
        <ErrorBoundary>
          {error && <div className="error-banner" role="alert">{error}</div>}
          <ItemList
            items={list.getItems()}
            onSelect={handleSelectItem}
            onToggle={handleToggleItem}
            onDelete={handleDeleteById}
          />
          <ActionBar
            canUndo={canUndo}
            hasSelection={list.getItems().some((i) => i.isSelected)}
            onUndo={handleUndo}
            onDeleteSelected={handleDeleteSelected}
            onOpenAdd={() => setIsModalOpen(true)}
          />
          {isModalOpen && (
            <AddItemModal
              onAdd={(text) => { handleAddItem(text); setIsModalOpen(false); }}
              onClose={() => setIsModalOpen(false)}
            />
          )}
        </ErrorBoundary>
      </div>
    </div>
  );
}
