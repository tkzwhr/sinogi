import { useCallback, useState } from 'react';

function randomize<T>(data: T[]): T {
  return data[Math.floor(Math.random() * data.length)];
}

export default function useShuffle<T>(data: T[]): [T, () => void] {
  if (data.length === 0) throw 'No data given.';

  const [current, setCurrent] = useState(randomize(data));
  const next = useCallback(
    () =>
      setCurrent((prevState) => {
        let nextState = prevState;
        while (data.length > 1 && prevState === nextState) {
          nextState = randomize(data);
        }
        return nextState;
      }),
    [data],
  );

  return [current, next];
}
