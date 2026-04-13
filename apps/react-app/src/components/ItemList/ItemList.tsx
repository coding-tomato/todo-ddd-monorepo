import type { ListItem } from '@repo/core';
import { ListItemRow } from '../ListItemRow/ListItemRow';
import styles from './ItemList.module.css';

interface ItemListProps {
  items: ReadonlyArray<ListItem>;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ItemList({ items, onSelect, onToggle, onDelete }: ItemListProps) {
  return (
    <ul className={styles.itemList}>
      {items.map((item) => (
        <ListItemRow
          key={item.id}
          item={item}
          onSelect={onSelect}
          onToggle={onToggle}
          onDelete={onDelete}
        />
      ))}
    </ul>
  );
}
