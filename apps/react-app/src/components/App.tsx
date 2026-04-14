import type { ListRepository } from "@repo/core";
import { LocalStorageListRepository } from "@repo/core";
import { useCallback, useMemo, useRef, useState } from "react";
import { useTextList } from "../hooks/useTextList";
import { ActionBar } from "./ActionBar/ActionBar";
import { AddItemModal } from "./AddItemModal/AddItemModal";
import styles from "./App.module.css";
import { ErrorBoundary } from "./ErrorBoundary/ErrorBoundary";
import { ItemList } from "./ItemList/ItemList";

export function TextListApp({ repo }: { repo: ListRepository }) {
  const {
    list,
    error,
    canUndo,
    handleAddItem,
    handleDeleteSelected,
    handleDeleteById,
    handleSelectItem,
    handleToggleItem,
    handleUndo,
  } = useTextList(repo);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [announcement, setAnnouncement] = useState("");
  const addBtnRef = useRef<HTMLButtonElement>(null);

  const openModal = useCallback(() => setIsModalOpen(true), []);

  const closeModal = useCallback(() => {
    setIsModalOpen(false);
    addBtnRef.current?.focus();
  }, []);

  const handleAddWithAnnounce = useCallback(
    (text: string) => {
      handleAddItem(text);
      setAnnouncement("Added to list");
      closeModal();
    },
    [handleAddItem, closeModal]
  );

  const handleDeleteWithAnnounce = useCallback(() => {
    handleDeleteSelected();
    setAnnouncement("Deleted from list");
  }, [handleDeleteSelected]);

  return (
    <main className={styles.app}>
      <div className={styles.card}>
        <ErrorBoundary>
          <h1 className={styles.heading}>This is a technical proof</h1>
          <p className={styles.description}>
            Lorem ipsum dolor sit amet consectetur adipiscing, elit mus primis
            nec inceptos. Lacinia habitasse arcu molestie maecenas cursus quam
            nunc, hendrerit posuere augue fames dictumst placerat porttitor, dis
            mi pharetra vestibulum venenatis phasellus.
          </p>
          {error && (
            <div className={styles.errorBanner} role="alert">
              {error}
            </div>
          )}
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
            onDeleteSelected={handleDeleteWithAnnounce}
            onOpenAdd={openModal}
            addBtnRef={addBtnRef}
          />
          {isModalOpen && (
            <AddItemModal onAdd={handleAddWithAnnounce} onClose={closeModal} />
          )}
        </ErrorBoundary>
      </div>
      <div
        aria-live="polite"
        aria-atomic="true"
        className={styles.srOnly}
      >
        {announcement}
      </div>
    </main>
  );
}

export function App() {
  const repo = useMemo(() => new LocalStorageListRepository(), []);
  return <TextListApp repo={repo} />;
}
