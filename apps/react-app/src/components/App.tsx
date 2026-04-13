import { useState, useMemo } from 'react';
import { LocalStorageListRepository } from '@repo/core';
import type { ListRepository } from '@repo/core';
import { useTextList } from '../hooks/useTextList';
import { ErrorBoundary } from './ErrorBoundary/ErrorBoundary';
import { ItemList } from './ItemList/ItemList';
import { ActionBar } from './ActionBar/ActionBar';
import { AddItemModal } from './AddItemModal/AddItemModal';
import styles from './App.module.css';

export function TextListApp({ repo }: { repo: ListRepository }) {
  const {
    list, error, canUndo,
    handleAddItem, handleDeleteSelected, handleDeleteById,
    handleSelectItem, handleToggleItem, handleUndo,
  } = useTextList(repo);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className={styles.app}>
      <div className={styles.card}>
        <ErrorBoundary>
          <h1 className={styles.heading}>This is a technical proof</h1>
          <p className={styles.description}>
            Lorem ipsum dolor sit amet consectetur adipiscing, elit mus primis nec inceptos. Lacinia
            habitasse arcu molestie maecenas cursus quam nunc, hendrerit posuere augue fames
            dictumst placerat porttitor, dis mi pharetra vestibulum venenatis phasellus.
          </p>
          {error && <div className={styles.errorBanner} role="alert">{error}</div>}
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

export function App() {
  const repo = useMemo(() => new LocalStorageListRepository(), []);
  return <TextListApp repo={repo} />;
}
