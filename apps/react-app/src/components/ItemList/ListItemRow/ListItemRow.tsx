import type { ListItem } from '@repo/core';
import styles from './ListItemRow.module.css';

interface ListItemRowProps {
  item: ListItem;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ListItemRow({ item, onSelect, onToggle, onDelete }: ListItemRowProps) {
  return (
    <li
      className={`${styles.row}${item.isSelected ? ` ${styles.selected}` : ''}`}
      data-selected={item.isSelected || undefined}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onToggle(item.id);
        } else {
          onSelect(item.id);
        }
      }}
      onDoubleClick={() => onDelete(item.id)}
    >
      <span className={styles.text}>{item.text}</span>
    </li>
  );
}
