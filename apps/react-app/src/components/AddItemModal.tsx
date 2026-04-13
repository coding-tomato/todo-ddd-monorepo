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
      <div className="add-item-modal" role="dialog" aria-modal="true" aria-labelledby="add-item-modal-title">
        <h2 className="add-item-modal__title" id="add-item-modal-title">Add item to list</h2>
        <input
          className="add-item-modal__input"
          id="add-item-modal-input"
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') handleSubmit(); }}
          autoFocus
          placeholder="Type the text here..."
          aria-label="Item text"
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
