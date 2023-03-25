import * as GoNodeHelper from '@/helpers/go-node.helper';
import { RawProblem, Vertex } from '@/types';
import GoBoard from '@sabaki/go-board';
import GameTree from '@sabaki/immutable-gametree';
import * as SGF from '@sabaki/sgf';
import { GhostStone, Map as GobanMap, Marker } from '@sabaki/shudan/src/Goban';

export type GameInfo = {
  gameName?: string;
  gameComment?: string;
  size: [number, number];
  playerColor: 1 | -1;
};

export type BoardState = {
  board: GoBoard;
  markerMap: GobanMap<Marker | null>;
  ghostStoneMap: GobanMap<GhostStone | null>;
  comment: string | null;
};

type PointBase = {
  vertex: Vertex;
};

type NextPoint = PointBase & {
  advancesCorrectRoute: boolean;
};

type GoodMoveMap = Record<number, boolean>;

type GoGameTree = GameTree<number, SGF.Property, string>;
type GoNodeObject = SGF.NodeObject<number>;

export function extractGames(sgfText: string): RawProblem[] {
  const rootNodes: GoNodeObject[] = SGF.parse(sgfText);
  return rootNodes.flatMap((rootNode) => {
    const gameInfo = getGameInfo(new GameTree({ root: rootNode }));
    if (!gameInfo.gameName) {
      return [];
    }
    return [
      {
        title: gameInfo.gameName,
        description: gameInfo.gameComment,
        sgfText: SGF.stringify(rootNode),
      },
    ];
  });
}

export function createGameTree(sgfText: string): GoGameTree {
  const rootNodes: GoNodeObject[] = SGF.parse(sgfText);
  if (rootNodes.length > 1) throw 'Too many records.';
  return new GameTree({ root: rootNodes[0] });
}

export function getGameInfo(gameTree: GoGameTree): GameInfo {
  const isBlack =
    gameTree.root.children.find((c) => c.data.B?.[0] !== undefined) !==
    undefined;
  const isWhite =
    gameTree.root.children.find((c) => c.data.W?.[0] !== undefined) !==
    undefined;

  if (isBlack && isWhite) throw 'First moves must be either black or white.';

  const sz: string = (gameTree.root.data.SZ ?? ['19'])[0];
  const size = sz.includes(':') ? sz.split(':') : [sz, sz];
  const [w, h] = size.map((x) => (Number.isNaN(+x) ? 19 : +x));

  return {
    gameName: gameTree.root.data.GN?.[0],
    gameComment: gameTree.root.data.GC?.[0],
    size: [w, h],
    playerColor: isBlack ? 1 : -1,
  };
}

export function getNextMoves(
  gameTree: GoGameTree,
  nodeId: GoNodeObject['id'],
): NextPoint[] {
  const node = gameTree.get(nodeId);
  if (!node) throw 'Node not found.';

  const generateGoodMoveMap = (n: GoNodeObject): GoodMoveMap => {
    const children = n.children.reduce(
      (acc, v) => {
        const isGoodMoveExplicitly = GoNodeHelper.getGoodMoveExplicitly(v);
        return {
          includesGoodMove:
            acc.includesGoodMove || isGoodMoveExplicitly === true,
          includesBadMove:
            acc.includesBadMove || isGoodMoveExplicitly === false,
          includesImplicitMove:
            acc.includesImplicitMove || isGoodMoveExplicitly === null,
        };
      },
      {
        includesGoodMove: false,
        includesBadMove: false,
        includesImplicitMove: false,
      },
    );

    let isCorrectRouteImplicitly = true;
    if (children.includesImplicitMove) {
      if (children.includesGoodMove && children.includesBadMove)
        throw 'Children have good move and bad move. Children can have only one side.';

      isCorrectRouteImplicitly = !children.includesGoodMove;
    }

    return n.children.reduce(
      (p, c) =>
        Object.assign(p, {
          [c.id]:
            GoNodeHelper.getGoodMoveExplicitly(c) ?? isCorrectRouteImplicitly,
        }),
      {} as GoodMoveMap,
    );
  };

  const treeNodes = Array.from<GoNodeObject>(
    gameTree.listNodesVertically(node.id, -1, {}),
  ).reverse();

  const isCorrectRoute = treeNodes.reduce((acc, n) => {
    // if it becomes false explicitly even once, never becomes true
    if (!acc) return false;

    // skip root node
    if (n.parentId === null) return acc;

    const parent = gameTree.get(n.parentId);

    return generateGoodMoveMap(parent!)[n.id];
  }, true);

  const childrenGoodMoveMap = generateGoodMoveMap(node);

  return node.children.flatMap((n) => {
    const move = GoNodeHelper.getMove(n);
    return [
      {
        vertex: move!.vertex,
        advancesCorrectRoute: isCorrectRoute && childrenGoodMoveMap[n.id],
      },
    ];
  });
}

export function generateAllBoardState(
  gameTree: GoGameTree,
): Map<GoNodeObject['id'], BoardState> {
  const boardStateMap = new Map<GoNodeObject['id'], BoardState>();
  const boards = new Map<GoNodeObject['id'], GoBoard>();

  const nodeIds = Array.from(gameTree.listNodes())
    .map((n) => n.id)
    .sort();

  nodeIds.forEach((nodeId) => {
    const node = gameTree.get(nodeId)!;

    const board = generateGoBoard(gameTree, node, boards);
    boards.set(nodeId, board);

    const markerMap = generateMarkerMap(board, node);
    const ghostStoneMap = generateGhostStoneMap(gameTree, board, node);
    const comment = GoNodeHelper.getComment(node);

    boardStateMap.set(nodeId, {
      board,
      markerMap,
      ghostStoneMap,
      comment,
    });
  });

  return boardStateMap;
}

function generateGoBoard(
  gameTree: GoGameTree,
  node: GoNodeObject,
  boardCache: Map<GoNodeObject['id'], GoBoard>,
): GoBoard {
  const [foundBoard, traversedNodes] = searchBoardFromCache(
    gameTree,
    node.id,
    boardCache,
  );

  const initialBoard = foundBoard ?? generateInitialBoard(gameTree);

  return traversedNodes.reduceRight((board, node) => {
    const move = GoNodeHelper.getMove(node);
    return move ? board.makeMove(toSign(move.stone), move.vertex) : board;
  }, initialBoard);
}

function generateMarkerMap(
  board: GoBoard,
  node: GoNodeObject,
): GobanMap<Marker | null> {
  const markerMap: GobanMap<Marker | null> = board.signMap.map((row) =>
    row.map(() => null),
  );

  GoNodeHelper.getMarkers(node).forEach(({ vertex, marker }) => {
    const [x, y] = vertex;
    markerMap[y][x] = marker;
  });

  return markerMap;
}

function generateGhostStoneMap(
  gameTree: GoGameTree,
  board: GoBoard,
  node: GoNodeObject,
): GobanMap<GhostStone | null> {
  const ghostStoneMap: GobanMap<GhostStone | null> = board.signMap.map((row) =>
    row.map(() => null),
  );

  getNextMoves(gameTree, node.id).forEach(
    ({ vertex, advancesCorrectRoute }) => {
      const [x, y] = vertex;
      ghostStoneMap[y][x] = {
        sign: toSign(GoNodeHelper.Stone.BLACK),
        type: advancesCorrectRoute ? 'good' : 'bad',
      };
    },
  );

  return ghostStoneMap;
}

function generateInitialBoard(gameTree: GoGameTree): GoBoard {
  const { size } = getGameInfo(gameTree);
  return GoNodeHelper.getAddedStones(gameTree.root).reduce(
    (board, putPoint) => board.set(putPoint.vertex, toSign(putPoint.stone)),
    GoBoard.fromDimensions(...size),
  );
}

function searchBoardFromCache(
  gameTree: GoGameTree,
  nodeId: GoNodeObject['id'],
  cache: Map<GoNodeObject['id'], GoBoard>,
): [GoBoard | undefined, GoNodeObject[]] {
  const traversedNodes: GoNodeObject[] = [];

  for (const node of gameTree.listNodesVertically(nodeId, -1, {})) {
    const board = cache.get(node.id);

    if (board) {
      return [board, traversedNodes];
    }

    traversedNodes.unshift(node);
  }

  return [undefined, traversedNodes];
}

function toSign(stone: GoNodeHelper.Stone): 1 | -1 {
  return stone === GoNodeHelper.Stone.BLACK ? 1 : -1;
}
