import useShuffle from '@/hooks/shuffle';
import { act, renderHook, waitFor } from '@testing-library/react';

describe('useShuffle', () => {
  it('1つの値が与えられたときは前回と同じ値になること', async () => {
    // Arrange
    const data = ['A'];

    const { result: hook } = renderHook(() => useShuffle(data));
    const [firstValue] = hook.current;

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toBe(firstValue);
    });
  });

  it('2つ以上の値が与えられたときは前回と異なる値になること', async () => {
    // Arrange
    const data = ['A', 'B'];

    const { result: hook } = renderHook(() => useShuffle(data));
    const [firstValue] = hook.current;

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).not.toBe(firstValue);
    });
  });

  it('空配列ではエラーになること', async () => {
    // Arrange
    const renderHookFn = () => renderHook(() => useShuffle([]));

    // Act

    // Assert
    expect(renderHookFn).toThrowError('No data given.');
  });
});
