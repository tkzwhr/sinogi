import {
  BoardState,
  createGameTree,
  GameInfo,
  generateAllBoardState,
  getGameInfo,
} from '@/helpers/go-game.helper';
import { getChildNode } from '@/helpers/go-node.helper';
import { PlayResult, Vertex } from '@/types';
import { useCallback, useEffect, useMemo } from 'react';
import { useStateWithHistory } from 'react-use';

const PlayResultFailed = {
  advancesCorrectRoute: false,
  reachesToLastMove: true,
};

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
  const boardStateMap = useMemo(
    () => generateAllBoardState(gameTree),
    [gameTree],
  );
  const [currentNodeId, setCurrentNodeId, currentNodeIdFn] =
    useStateWithHistory(0, 999);
  const boardState = boardStateMap.get(currentNodeId)!;

  useEffect(() => currentNodeIdFn.go(0), [gameTree]);

  const rewind = useCallback(() => currentNodeIdFn.go(0), []);

  const undo = useCallback(() => currentNodeIdFn.back(1), []);

  const redo = useCallback(() => {
    currentNodeIdFn.forward(1);

    const node = gameTree.get(currentNodeId);
    if (!node || !node.children || node.children.length !== 1) return;

    setCurrentNodeId(node.children[0].id);
  }, [gameTree, currentNodeId]);

  const play = useCallback(
    (vertex: Vertex): PlayResult | null => {
      if (existsStone(boardState, vertex)) {
        return null;
      }

      const childNode = getChildNode(gameTree.get(currentNodeId)!, vertex);
      if (!childNode) {
        return PlayResultFailed;
      }

      setCurrentNodeId(childNode.id);

      return {
        advancesCorrectRoute: isGoodMove(boardState, vertex),
        reachesToLastMove: gameTree.get(childNode.id)?.children.length === 0,
      };
    },
    [gameTree, currentNodeId],
  );

  const playRandom = useCallback((): PlayResult => {
    const nextGoodMoves = getNextMoves(boardState, true);
    if (nextGoodMoves.length > 0) {
      const move =
        nextGoodMoves[Math.floor(Math.random() * nextGoodMoves.length)];
      return play(move)!;
    }

    const nextMoves = getNextMoves(boardState, false);
    const move = nextMoves[Math.floor(Math.random() * nextMoves.length)];
    return play(move)!;
  }, [gameTree, currentNodeId]);

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

function existsStone(boardState: BoardState, vertex: Vertex): boolean {
  const [x, y] = vertex;
  return boardState.board.signMap[y][x] !== 0;
}

function isGoodMove(boardState: BoardState, vertex: Vertex): boolean {
  const [x, y] = vertex;
  return boardState.ghostStoneMap[y][x]?.type === 'good';
}

function getNextMoves(boardState: BoardState, onlyGoodMove: boolean): Vertex[] {
  return boardState.ghostStoneMap.flatMap((cols, y) =>
    cols.flatMap((ghostStone, x) => {
      const vertex: Vertex = [x, y];
      return ghostStone &&
        ghostStone.sign !== 0 &&
        (!onlyGoodMove || ghostStone.type === 'good')
        ? [vertex]
        : [];
    }),
  );
}
