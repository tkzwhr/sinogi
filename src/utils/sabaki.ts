import * as GoGameHelper from '@/helpers/go-game.helper';
import * as GoNodeHelper from '@/helpers/go-node.helper';
import GoBoard from '@sabaki/go-board';
import GameTree from '@sabaki/immutable-gametree';
import * as SGF from '@sabaki/sgf';
import { GhostStone, Map, Marker } from '@sabaki/shudan/src/Goban';

type GoGameTree = GameTree<number, SGF.Property, string>;
type GoNodeObject = SGF.NodeObject<number>;

export type GameInfo = {
  gameName?: string;
  gameComment?: string;
  playerColor: 1 | -1;
};

export type BoardState = {
  board: GoBoard;
  markerMap?: Map<Marker | null>;
  ghostStoneMap?: Map<GhostStone | null>;
  comment?: string;
};

function toSign(stone: GoNodeHelper.Stone): 1 | -1 {
  return stone === GoNodeHelper.Stone.BLACK ? 1 : -1;
}

export function getBoardState(
  gameTree: GoGameTree,
  id: number,
  boardCache?: (nodeId: number) => GoBoard | undefined,
): BoardState | null {
  const node = gameTree.get(id);
  if (!node) return null;

  // Search board from cache

  let baseBoard: GoBoard | undefined = undefined;
  let traversedNodes: GoNodeObject[] = [];
  if (boardCache) {
    for (const node of gameTree.listNodesVertically(id, -1, {})) {
      baseBoard = boardCache(node.id);
      if (baseBoard) {
        break;
      }
      traversedNodes.unshift(node);
    }
  } else {
    traversedNodes = Array.from<GoNodeObject>(
      gameTree.listNodesVertically(id, -1, {}),
    ).reverse();
  }

  if (!baseBoard) {
    const { size } = GoGameHelper.getGameInfo(gameTree);
    baseBoard = GoNodeHelper.getAddedStones(gameTree.root).reduce(
      (board, putPoint) => board.set(putPoint.vertex, toSign(putPoint.stone)),
      GoBoard.fromDimensions(...size),
    );
  }

  // Move stones

  const board = traversedNodes.reduceRight((board, node) => {
    const move = GoNodeHelper.getMove(node);
    return move ? board.makeMove(toSign(move.stone), move.vertex) : board;
  }, baseBoard);

  // Add markers

  const markerMap: Map<Marker | null> = board.signMap.map((row) =>
    row.map(() => null),
  );
  GoNodeHelper.getMarkers(node).forEach(({ vertex, marker }) => {
    const [x, y] = vertex;
    markerMap[y][x] = marker;
  });

  // Get next moves

  const ghostStoneMap: Map<GhostStone | null> = board.signMap.map((row) =>
    row.map(() => null),
  );
  GoGameHelper.getNextMoves(gameTree, node.id).forEach(
    ({ vertex, advancesCorrectRoute }) => {
      const [x, y] = vertex;
      ghostStoneMap[y][x] = {
        sign: toSign(GoNodeHelper.Stone.BLACK),
        type: advancesCorrectRoute ? 'good' : 'bad',
      };
    },
  );

  // Get comment

  const comment = node.data.C?.[0];

  return {
    board,
    markerMap,
    ghostStoneMap,
    comment,
  };
}
