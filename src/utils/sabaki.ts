import { RawProblem } from '@/types';
import GoBoard, { Vertex } from '@sabaki/go-board';
import GameTree from '@sabaki/immutable-gametree';
import * as SGF from '@sabaki/sgf';
import { GhostStone, Map, Marker } from '@sabaki/shudan/src/Goban';

const BLACK = 1;
const WHITE = -1;
const MARKS: { prop: SGF.Property; type: Marker['type'] }[] = [
  { prop: 'CR', type: 'circle' },
  { prop: 'MA', type: 'cross' },
  { prop: 'SQ', type: 'square' },
  { prop: 'TR', type: 'triangle' },
];

type GoGameTree = GameTree<number, SGF.Property, string>;
type GoNodeObject = SGF.NodeObject<number>;
type Stone = typeof BLACK | typeof WHITE;
type PointBase = {
  vertex: Vertex;
};
type PutPoint = PointBase & {
  stone: Stone;
};
type MarkerPoint = PointBase & {
  marker: Marker;
};
type NextPoint = PointBase & {
  isCorrectRoute: boolean;
};
type TesujiMap = Record<number, boolean>;

export type GameInfo = {
  gameName?: string;
  gameComment?: string;
  playerColor: Stone;
};

export type BoardState = {
  board: GoBoard;
  markerMap?: Map<Marker | null>;
  ghostStoneMap?: Map<GhostStone | null>;
  comment?: string;
};

export function extractProblems(sgfText: string): RawProblem[] {
  const rootNodes: GoNodeObject[] = SGF.parse(sgfText);
  return rootNodes.flatMap((node): RawProblem[] => {
    const title = node.data.GN?.[0];
    if (!title) return [];
    const description = node.data.GC?.[0];
    return [
      {
        title,
        description,
        sgfText: SGF.stringify(node),
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

  return {
    gameName: gameTree.root.data.GN?.[0],
    gameComment: gameTree.root.data.GC?.[0],
    playerColor: isBlack ? 1 : -1,
  };
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
      baseBoard = boardCache(node.id as number);
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
    baseBoard = getAdded(gameTree.root).reduce(
      (board, putPoint) => board.set(putPoint.vertex, putPoint.stone),
      GoBoard.fromDimensions(...getSize(gameTree)),
    );
  }

  // Move stones

  const board = traversedNodes.reduceRight((board, node) => {
    const move = getMove(node);
    return move ? board.makeMove(move.stone, move.vertex) : board;
  }, baseBoard);

  // Add markers

  const markerMap: Map<Marker | null> = board.signMap.map((row) =>
    row.map(() => null),
  );
  getMarkers(node).forEach(({ vertex, marker }) => {
    const [x, y] = vertex;
    markerMap[y][x] = marker;
  });

  // Get next moves

  const ghostStoneMap: Map<GhostStone | null> = board.signMap.map((row) =>
    row.map(() => null),
  );
  getNextMoves(gameTree, node).forEach(({ vertex, isCorrectRoute }) => {
    const [x, y] = vertex;
    ghostStoneMap[y][x] = {
      sign: BLACK,
      type: isCorrectRoute ? 'good' : 'bad',
    };
  });

  // Get comment

  const comment = node.data.C?.[0];

  return {
    board,
    markerMap,
    ghostStoneMap,
    comment,
  };
}

export function getMove(node: GoNodeObject): PutPoint | null {
  const black = node.data.B;
  if (black) {
    return {
      vertex: SGF.parseVertex(black[0]),
      stone: BLACK,
    };
  }

  const white = node.data.W;
  if (white) {
    return {
      vertex: SGF.parseVertex(white[0]),
      stone: WHITE,
    };
  }

  return null;
}

function getSize(gameTree: GoGameTree): [number, number] {
  const rootNode = gameTree.root;
  const sz: string = (rootNode.data.SZ ?? ['19'])[0];
  const size = sz.includes(':') ? sz.split(':') : [sz, sz];
  const [w, h] = size.map((x) => (Number.isNaN(x) ? 19 : +x));
  return [w, h];
}

function getAdded(node: GoNodeObject): PutPoint[] {
  const blacks = (node.data.AB ?? []).flatMap((vertexStr: string) =>
    SGF.parseCompressedVertices(vertexStr).map(
      (vertex): PutPoint => ({
        vertex,
        stone: BLACK,
      }),
    ),
  );

  const whites = (node.data.AW ?? []).flatMap((vertexStr: string) =>
    SGF.parseCompressedVertices(vertexStr).map(
      (vertex): PutPoint => ({
        vertex,
        stone: WHITE,
      }),
    ),
  );

  return [...blacks, ...whites];
}

function getNextMoves(gameTree: GoGameTree, node: GoNodeObject): NextPoint[] {
  const generateTesujiMap = (n: GoNodeObject): TesujiMap => {
    const childrenSummary = n.children.reduce(
      (acc, v) => {
        const isTesuji = getIsTesuji(v);
        return {
          hasTesuji: acc.hasTesuji || isTesuji === true,
          hasBadMove: acc.hasBadMove || isTesuji === false,
          hasNull: acc.hasNull || isTesuji === null,
        };
      },
      { hasTesuji: false, hasBadMove: false, hasNull: false },
    );

    let isCorrectRouteImplicitly = true;
    if (childrenSummary.hasNull) {
      if (childrenSummary.hasTesuji && childrenSummary.hasBadMove)
        throw 'Children have tesuji and bad move. Children can have only one side.';

      isCorrectRouteImplicitly = !childrenSummary.hasTesuji;
    }

    return n.children.reduce(
      (p, c) =>
        Object.assign(p, {
          [c.id]: getIsTesuji(c) ?? isCorrectRouteImplicitly,
        }),
      {} as TesujiMap,
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
    if (!parent) return acc;

    return generateTesujiMap(parent)[n.id];
  }, true);

  const childrenTesujiMap = generateTesujiMap(node);
  return node.children.flatMap((n) => {
    const move = getMove(n);
    if (!move) return [];

    return [
      {
        vertex: move.vertex,
        isCorrectRoute: isCorrectRoute && childrenTesujiMap[n.id],
      },
    ];
  });
}

function getMarkers(node: GoNodeObject): MarkerPoint[] {
  const allMarks: MarkerPoint[] = MARKS.reduce((arr, { prop, type }) => {
    const marks = node.data?.[prop];
    if (!marks) return arr;

    const additional = marks.flatMap((vertexStr: string) =>
      SGF.parseCompressedVertices(vertexStr).map((vertex: Vertex) => ({
        vertex,
        marker: { type },
      })),
    );
    return [...arr, ...additional];
  }, [] as MarkerPoint[]);

  const allLabels: MarkerPoint[] =
    node.data.LB?.map((composed: string) => {
      const [vertexStr, label] = composed.split(':');
      const vertex: Vertex = SGF.parseVertex(vertexStr);
      return { vertex, marker: { type: 'label', label } };
    }) ?? [];

  return [...allMarks, ...allLabels];
}

function getIsTesuji(node: GoNodeObject): boolean | null {
  if (node.data.TE?.[0] === '1') {
    return true;
  }
  if (node.data.BM?.[0] === '1') {
    return false;
  }
  return null;
}
