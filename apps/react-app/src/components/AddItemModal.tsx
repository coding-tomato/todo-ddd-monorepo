import { useState } from 'react';

interface AddItemModalProps {
  onAdd: (text: string) => void;
  onClose: () => void;
}

export function AddItemModal({ onAdd, onClose }: AddItemModalProps) {
  const [inputValue, setInputValue] = useState('');

  const handleSubmit = () => {
    const trimmed = inputValue.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setInputValue('');
  };

  return (
    <div className="add-item-modal__overlay">
      <div className="add-item-modal">
        <h2 className="add-item-modal__title">Add Item</h2>
        <input
          className="add-item-modal__input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          autoFocus
          placeholder="Enter item text..."
        />
        <div className="add-item-modal__actions">
          <button
            className="add-item-modal__add-btn"
            onClick={handleSubmit}
            disabled={inputValue.trim() === ''}
          >
            ADD
          </button>
          <button className="add-item-modal__cancel-btn" onClick={onClose}>
            CANCEL
          </button>
        </div>
      </div>
    </div>
  );
}
