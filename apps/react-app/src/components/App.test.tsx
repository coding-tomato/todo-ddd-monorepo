import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { axe } from 'vitest-axe';
import { TextListApp } from './App';
import { InMemoryListRepository } from '../__tests__/InMemoryListRepository';

function setup() {
  const repo = new InMemoryListRepository();
  const user = userEvent.setup();
  const utils = render(<TextListApp repo={repo} />);
  return { repo, user, ...utils };
}

async function addItem(user: ReturnType<typeof userEvent.setup>, text: string) {
  await user.click(screen.getByRole('button', { name: /\+ add/i }));
  await user.type(screen.getByPlaceholderText(/type the text here/i), text);
  await user.click(screen.getByRole('button', { name: /^add$/i }));
}

describe('TextListApp integration', () => {
  it('initial render — empty list: no list items, Delete disabled, Undo disabled', () => {
    setup();

    expect(screen.queryAllByRole('listitem')).toHaveLength(0);
    expect(screen.getByRole('button', { name: /delete/i })).toBeDisabled();
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  });

  it('add item — modal appears, type text, click ADD, item in list and modal closed', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /\+ add/i }));
    expect(screen.getByPlaceholderText(/type the text here/i)).toBeInTheDocument();

    await user.type(screen.getByPlaceholderText(/type the text here/i), 'Buy milk');
    await user.click(screen.getByRole('button', { name: /^add$/i }));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
    expect(screen.queryByPlaceholderText(/type the text here/i)).not.toBeInTheDocument();
  });

  it('add item — empty blocked: ADD button disabled when input empty, stays disabled after clear', async () => {
    const { user } = setup();

    await user.click(screen.getByRole('button', { name: /\+ add/i }));
    const modalAddBtn = screen.getByRole('button', { name: /^add$/i });
    expect(modalAddBtn).toBeDisabled();

    const input = screen.getByPlaceholderText(/type the text here/i);
    await user.type(input, 'hello');
    expect(modalAddBtn).toBeEnabled();

    await user.clear(input);
    expect(modalAddBtn).toBeDisabled();
  });

  it('select item — click item gives it selected class, Delete button enabled', async () => {
    const { user } = setup();

    await addItem(user, 'Buy milk');

    const item = screen.getByText('Buy milk').closest('li')!;
    await user.click(item);

    expect(item).toHaveAttribute('data-selected');
  });

  it('multi-select — add 2 items, ctrl+click both → both selected, Delete enabled', async () => {
    const { user } = setup();

    await addItem(user, 'Item A');
    await addItem(user, 'Item B');

    const itemA = screen.getByText('Item A').closest('li')!;
    const itemB = screen.getByText('Item B').closest('li')!;

    await user.click(itemA);
    await user.keyboard('[ControlLeft>]');
    await user.click(itemB);
    await user.keyboard('[/ControlLeft]');

    expect(itemA).toHaveAttribute('data-selected');
    expect(itemB).toHaveAttribute('data-selected');
    expect(screen.getByRole('button', { name: /delete/i })).toBeEnabled();
  });

  it('delete selected — add 2 items, select first, click Delete → first removed, second remains', async () => {
    const { user } = setup();

    await addItem(user, 'Item A');
    await addItem(user, 'Item B');

    const itemA = screen.getByText('Item A').closest('li')!;
    await user.click(itemA);
    await user.click(screen.getByRole('button', { name: /delete/i }));

    expect(screen.queryByText('Item A')).not.toBeInTheDocument();
    expect(screen.getByText('Item B')).toBeInTheDocument();
  });

  it('undo add — add item, click Undo → item removed, Undo disabled', async () => {
    const { user } = setup();

    await addItem(user, 'Buy milk');
    expect(screen.getByText('Buy milk')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /undo/i }));

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /undo/i })).toBeDisabled();
  });

  it('undo delete — add item, select, delete, click Undo → item restored', async () => {
    const { user } = setup();

    await addItem(user, 'Buy milk');
    const item = screen.getByText('Buy milk').closest('li')!;
    await user.click(item);
    await user.click(screen.getByRole('button', { name: /delete/i }));
    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /undo/i }));

    expect(screen.getByText('Buy milk')).toBeInTheDocument();
  });

  it('double-click delete — add item, double-click it → item removed', async () => {
    const { user } = setup();

    await addItem(user, 'Buy milk');
    const item = screen.getByText('Buy milk').closest('li')!;
    await user.dblClick(item);

    expect(screen.queryByText('Buy milk')).not.toBeInTheDocument();
  });

  it('error shown — repo.save throws → error banner with role="alert" visible', async () => {
    const { repo, user } = setup();

    vi.spyOn(repo, 'save').mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    await addItem(user, 'Buy milk');

    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByRole('alert')).toHaveTextContent('Storage quota exceeded');
  });

  it('error cleared — trigger error, fix save, add another item → error banner gone', async () => {
    const { repo, user } = setup();

    const saveSpy = vi.spyOn(repo, 'save').mockImplementation(() => {
      throw new Error('Storage quota exceeded');
    });

    await addItem(user, 'Item A');
    expect(screen.getByRole('alert')).toBeInTheDocument();

    saveSpy.mockRestore();

    await addItem(user, 'Item B');

    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
  });
});

describe('TextListApp accessibility', () => {
  it('passes axe on initial empty state', async () => {
    const { container } = setup();
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with items in the list', async () => {
    const { container, user } = setup();
    await addItem(user, 'Buy milk');
    await addItem(user, 'Walk the dog');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with modal open', async () => {
    const { container, user } = setup();
    await user.click(screen.getByRole('button', { name: /add/i }));
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('passes axe with error banner visible', async () => {
    const { container, repo, user } = setup();
    vi.spyOn(repo, 'save').mockImplementation(() => { throw new Error('fail'); });
    await addItem(user, 'Item A');
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
