import useProblem from '@/hooks/problem';
import { act, renderHook, waitFor } from '@testing-library/react';

const B = 1;
const W = -1;

const createSGFText = (text: string) => `(;GM[1]FF[4]${text})`;

const createSimpleSGFText = () => {
  const node0 = 'SZ[3]AB[aa]AW[ab]';
  const node1 = 'B[ba]TE[1]';
  const node2 = 'W[bb]C[コメント]';
  const node3 = 'B[ca]CR[cb]';
  return createSGFText(`${node0}(;${node1};${node2})(;${node3})`);
};

describe('useProblem', () => {
  it('playできること', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      const result = fn.play([1, 1]);
      expect(result).toStrictEqual({
        advancesCorrectRoute: true,
        reachesToLastMove: true,
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, B, 0],
        [W, W, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('石が置けないときはplayできないこと', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      const result = fn.play([0, 0]);
      expect(result).toBeNull();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, 0, 0],
        [W, 0, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('次の手がないときはプレイ失敗になること', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      const result = fn.play([0, 2]);
      expect(result).toStrictEqual({
        advancesCorrectRoute: false,
        reachesToLastMove: true,
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, 0, 0],
        [W, 0, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('playRandomできること', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      const result = fn.playRandom();
      expect(result).toStrictEqual({
        advancesCorrectRoute: true,
        reachesToLastMove: true,
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, B, 0],
        [W, W, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('正解手がなくてもplayRandomできること', async () => {
    // Arrange
    const sgfText = createSGFText('SZ[3];B[aa];W[ba]BM[1]');

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([0, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      const result = fn.playRandom();
      expect(result).toStrictEqual({
        advancesCorrectRoute: false,
        reachesToLastMove: true,
      });
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, W, 0],
        [0, 0, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('rewindできること', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 1]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.rewind();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, 0, 0],
        [W, 0, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('undoできること', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 1]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.undo();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, B, 0],
        [W, 0, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('redoできること', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.undo();
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.redo();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, B, 0],
        [W, 0, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('最後尾に到達していたらredoできないこと', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 1]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.redo();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, B, 0],
        [W, W, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('次の手が1つに確定できるときは、undoしていなくてもredoできること', async () => {
    // Arrange
    const sgfText = createSimpleSGFText();

    const { result: hook } = renderHook(() => useProblem(sgfText));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.redo();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual.boardState.board.signMap).toStrictEqual([
        [B, B, 0],
        [W, W, 0],
        [0, 0, 0]
      ]);
    });
  });

  it('棋譜が指定されていなくてもaエラーにならないこと', async () => {
    // Arrange
    const { result: hook } = renderHook(() => useProblem(undefined));

    // Act
    await act(async () => {
      const [, fn] = hook.current;
      fn.play([1, 0]);
    });
    await act(async () => {
      const [, fn] = hook.current;
      fn.redo();
    });

    // Assert
    await waitFor(() => {
      const [actual] = hook.current;
      // prettier-ignore
      expect(actual).toBeTruthy();
    });
  });
});
