export function randomize<T>(items: T[]): T {
  if (items.length === 0) throw 'No items given.';
  return items[Math.floor(Math.random() * items.length)];
}
