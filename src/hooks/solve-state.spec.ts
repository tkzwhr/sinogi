import useSolveState from '@/hooks/solve-state';
import { act, renderHook, waitFor } from '@testing-library/react';

describe('useSolveState', () => {
  it('開始したら自分の手番になること', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useSolveState());
    const [firstValue] = hook.current;

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'START' });
    });

    // Assert
    expect(firstValue).toStrictEqual({
      status: 'INITIALIZED',
      solveCount: 0,
      playResult: null,
      lastIncorrectPlayVertex: null,
    });

    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toStrictEqual({
        status: 'WAIT_FOR_PLAYER_PLAY',
        solveCount: 0,
        playResult: null,
        lastIncorrectPlayVertex: null,
      });
    });
  });

  it('自分の石を置いたら相手の手番になること', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useSolveState());

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'START' });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({
        type: 'PLAY',
        vertex: [1, 2],
        playResult: { advancesCorrectRoute: true, reachesToLastMove: false },
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toStrictEqual({
        status: 'WAIT_FOR_OPPONENT_PLAY',
        solveCount: 0,
        playResult: null,
        lastIncorrectPlayVertex: null,
      });
    });
  });

  it('自分の石を置けないときは自分の手番のままになっていること', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useSolveState());

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'START' });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'PLAY', vertex: [1, 2], playResult: null });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toStrictEqual({
        status: 'WAIT_FOR_PLAYER_PLAY',
        solveCount: 0,
        playResult: null,
        lastIncorrectPlayVertex: null,
      });
    });
  });

  it('相手の石を置いたら自分の手番になること', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useSolveState());

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'START' });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({
        type: 'PLAY',
        vertex: [1, 2],
        playResult: { advancesCorrectRoute: true, reachesToLastMove: false },
      });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({
        type: 'OPPONENT_PLAY',
        advancesCorrectRoute: true,
        reachesToLastMove: false,
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toStrictEqual({
        status: 'WAIT_FOR_PLAYER_PLAY',
        solveCount: 0,
        playResult: null,
        lastIncorrectPlayVertex: null,
      });
    });
  });

  it('自分の石を置いて終わったら完了になること', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useSolveState());

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'START' });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({
        type: 'PLAY',
        vertex: [1, 2],
        playResult: { advancesCorrectRoute: false, reachesToLastMove: true },
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toStrictEqual({
        status: 'FINISHED',
        solveCount: 1,
        playResult: 'INCORRECT',
        lastIncorrectPlayVertex: [1, 2],
      });
    });
  });

  it('相手の石を置いて終わったら完了になること', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useSolveState());

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'START' });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({
        type: 'PLAY',
        vertex: [1, 2],
        playResult: { advancesCorrectRoute: true, reachesToLastMove: false },
      });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({
        type: 'OPPONENT_PLAY',
        advancesCorrectRoute: true,
        reachesToLastMove: true,
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toStrictEqual({
        status: 'FINISHED',
        solveCount: 1,
        playResult: 'CORRECT',
        lastIncorrectPlayVertex: null,
      });
    });
  });

  it('時間切れになること', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useSolveState());

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'START' });
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn({ type: 'RUN_OUT_OF_TIME' });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      expect(actual).toStrictEqual({
        status: 'FINISHED',
        solveCount: 0,
        playResult: 'TIMED_OUT',
        lastIncorrectPlayVertex: null,
      });
    });
  });
});
