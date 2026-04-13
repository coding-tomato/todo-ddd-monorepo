import type { ListItem } from '@repo/core';

interface ListItemRowProps {
  item: ListItem;
  onSelect: (id: string) => void;
  onToggle: (id: string) => void;
  onDelete: (id: string) => void;
}

export function ListItemRow({ item, onSelect, onToggle, onDelete }: ListItemRowProps) {
  return (
    <li
      className={`list-item-row${item.isSelected ? ' list-item-row--selected' : ''}`}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey) {
          onToggle(item.id);
        } else {
          onSelect(item.id);
        }
      }}
      onDoubleClick={() => onDelete(item.id)}
    >
      <span className="list-item-row__text">{item.text}</span>
    </li>
  );
}
