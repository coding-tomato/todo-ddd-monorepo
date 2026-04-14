import { useState, useCallback, useReducer } from 'react';
import {
  type TextList,
  CommandHistory,
  AddItemCommand,
  DeleteSelectedCommand,
  DeleteByIdCommand,
  loadList,
} from '@repo/core';
import type { ListRepository } from '@repo/core';

export function useTextList(repo: ListRepository) {
  const [list] = useState<TextList>(() => loadList(repo));
  const [history] = useState(() => new CommandHistory());
  const [error, setError] = useState<string | null>(null);
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0);

  const clearError = useCallback(() => setError(null), []);

  const handleAddItem = useCallback((text: string) => {
    try {
      history.execute(new AddItemCommand(list, text, repo));
      forceUpdate();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [list, history, repo]);

  const handleDeleteSelected = useCallback(() => {
    try {
      history.execute(new DeleteSelectedCommand(list, repo));
      forceUpdate();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [list, history, repo]);

  const handleDeleteById = useCallback((id: string) => {
    try {
      history.execute(new DeleteByIdCommand(list, id, repo));
      forceUpdate();
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [list, history, repo]);

  const handleSelectItem = useCallback((id: string) => {
    list.selectItem(id);
    forceUpdate();
  }, [list]);

  const handleToggleItem = useCallback((id: string) => {
    list.toggleItem(id);
    forceUpdate();
  }, [list]);

  const handleUndo = useCallback(() => {
    try {
      const result = history.undo();
      if (result) {
        forceUpdate();
        setError(null);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong, please try again');
    }
  }, [history]);

  return {
    list,
    error,
    canUndo: history.canUndo,
    handleAddItem,
    handleDeleteSelected,
    handleDeleteById,
    handleSelectItem,
    handleToggleItem,
    handleUndo,
    clearError,
  };
}
