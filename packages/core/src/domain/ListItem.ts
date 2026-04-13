export interface ListItem {
  id: string;
  text: string;
  isSelected: boolean;
}

export type ItemId = string & { readonly __brand: 'ItemId' };

export function createItemId(): ItemId {
  return crypto.randomUUID() as ItemId;
}
