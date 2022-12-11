import { useCallback, useEffect, useMemo } from 'react';
import { useMap, useStateWithHistory } from 'react-use';
import GoBoard from '@sabaki/go-board';
import { Vertex } from '@sabaki/shudan';
// @ts-ignore
import { stringifyVertex } from '@sabaki/sgf';
import {
  BoardState,
  createGameTree,
  GameInfo,
  getBoardState,
  getGameInfo,
  getMove,
} from '@/utils/sabaki';

type ProblemState = {
  gameInfo: GameInfo;
  boardState: BoardState;
};

type ProblemFn = {
  rewind: () => void;
  undo: () => void;
  redo: () => void;
  play: (_0: Vertex) => void;
};

export default function useProblem(
  sgfText: string | undefined,
): [ProblemState, ProblemFn] {
  const gameTree = useMemo(() => createGameTree(sgfText ?? ''), [sgfText]);
  const [boardCache, { set, reset }] = useMap<Record<number, GoBoard>>({});

  const [currentId, setCurrentId, currentIdFn] = useStateWithHistory(0, 999);
  const boardState = getBoardState(
    gameTree,
    currentId,
    (id: number) => boardCache[id],
  );
  if (!boardState) {
    throw 'Board state not found.';
  }

  if (!boardCache[currentId]) {
    set(currentId, boardState.board.clone());
  }

  useEffect(() => {
    reset();
    currentIdFn.go(0);
  }, [gameTree]);

  const rewind = useCallback(() => currentIdFn.go(0), []);

  const undo = useCallback(() => currentIdFn.back(1), []);

  const redo = useCallback(() => {
    const currentPosition = currentIdFn.position;
    currentIdFn.forward(1);

    if (currentPosition < currentIdFn.position) return;

    const node = gameTree.get(currentId);
    if (!node || !node.children || node.children.length !== 1) return;

    setCurrentId(node.children[0].id);
  }, [gameTree, currentId]);

  const play = useCallback(
    (vertex: Vertex) => {
      const node = gameTree.get(currentId);
      if (!node) return;

      const child = node.children.find((c: any) => {
        const move = getMove(c);
        return move
          ? stringifyVertex(move.vertex) === stringifyVertex(vertex)
          : false;
      });
      if (!child) return;

      setCurrentId(child.id);
    },
    [gameTree, currentId],
  );

  return [
    {
      gameInfo: getGameInfo(gameTree),
      boardState,
    },
    {
      rewind,
      undo,
      redo,
      play,
    },
  ];
}
