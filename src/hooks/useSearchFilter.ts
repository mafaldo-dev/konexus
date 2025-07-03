import { useMemo } from 'react';

export function useSearchFilter<T>(items: T[], searchTerm: string, keys: Array<keyof T>): T[] {
  const lowerCaseSearchTerm = searchTerm.toLowerCase();

  const filteredItems = useMemo(() => {
    if (!lowerCaseSearchTerm) {
      return items;
    }

    return items.filter(item =>
      keys.some(key =>
        String(item[key]).toLowerCase().includes(lowerCaseSearchTerm)
      )
    );
  }, [items, lowerCaseSearchTerm, keys]);

  return filteredItems;
}
