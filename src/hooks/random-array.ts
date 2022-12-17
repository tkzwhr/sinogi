import { useCallback, useState } from 'react';

export function useRandomArray<T>(items: T[]): [T | undefined, () => void] {
  const initial =
    items.length > 0
      ? items[Math.floor(Math.random() * items.length)]
      : undefined;
  const [item, setItem] = useState(initial);
  const next = useCallback(() => {
    const item = items[Math.floor(Math.random() * items.length)];
    setItem(item);
  }, [items]);
  return [item, next];
}
