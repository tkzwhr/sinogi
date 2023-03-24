import { PlayResult } from '@/types';
import {
  BoardState,
  createGameTree,
  GameInfo,
  getBoardState,
  getGameInfo,
  getMove,
} from '@/utils/sabaki';
import GoBoard from '@sabaki/go-board';
import { stringifyVertex } from '@sabaki/sgf';
import { Vertex } from '@sabaki/shudan';
import { useCallback, useEffect, useMemo } from 'react';
import { useMap, useStateWithHistory } from 'react-use';

type ProblemState = {
  gameInfo: GameInfo;
  boardState: BoardState;
};

type ProblemFn = {
  rewind: () => void;
  undo: () => void;
  redo: () => void;
  play: (vertex: Vertex) => PlayResult | null;
  playRandom: () => PlayResult;
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
    (vertex: Vertex): PlayResult | null => {
      const [x, y] = vertex;
      if (boardState.board.signMap[y][x] !== 0) {
        return null;
      }

      const node = gameTree.get(currentId);
      if (!node)
        return {
          advancesCorrectRoute: false,
          reachesToLastMove: true,
        };

      const child = node.children.find((c: any) => {
        const move = getMove(c);
        return move
          ? stringifyVertex(move.vertex) === stringifyVertex(vertex)
          : false;
      });
      if (!child)
        return {
          advancesCorrectRoute: false,
          reachesToLastMove: true,
        };

      setCurrentId(child.id);

      return {
        advancesCorrectRoute: boardState.ghostStoneMap?.[y][x]?.type === 'good',
        reachesToLastMove: gameTree.get(child.id)?.children.length === 0,
      };
    },
    [gameTree, currentId],
  );

  const playRandom = useCallback((): PlayResult => {
    if (!boardState.ghostStoneMap)
      return {
        advancesCorrectRoute: false,
        reachesToLastMove: true,
      };

    const ghostStones: { vertex: Vertex; isTesuji: boolean }[] =
      boardState.ghostStoneMap.flatMap((cols, y) =>
        cols.flatMap((ghostStone, x) => {
          return ghostStone && ghostStone.sign !== 0
            ? [{ vertex: [x, y], isTesuji: ghostStone.type === 'good' }]
            : [];
        }),
      );

    if (ghostStones.length === 0)
      return {
        advancesCorrectRoute: false,
        reachesToLastMove: true,
      };

    const tesujis = ghostStones.filter((gs) => gs.isTesuji);
    if (tesujis.length > 0) {
      const move = tesujis[Math.floor(Math.random() * tesujis.length)];
      return play(move.vertex)!;
    }

    const move = ghostStones[Math.floor(Math.random() * ghostStones.length)];
    return play(move.vertex)!;
  }, [gameTree, currentId]);

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
      playRandom,
    },
  ];
}
