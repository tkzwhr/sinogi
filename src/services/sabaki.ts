import { RawProblem } from '@/types';
import GoBoard, { Vertex } from '@sabaki/go-board';
// @ts-ignore
import GameTree from '@sabaki/immutable-gametree';
// @ts-ignore
import * as SGF from '@sabaki/sgf';
import { GhostStone, Map, Marker } from '@sabaki/shudan/src/Goban';

const BLACK = 1;
const WHITE = -1;
const MARKS = { CR: 'circle', MA: 'cross', SQ: 'square', TR: 'triangle' };
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

type Node = {
  id: number;
  data: Record<string, Array<any>>;
  children: Node[];
};

export type GameInfo = {
  gameName?: string;
  gameComment?: string;
};

export type BoardState = {
  board: GoBoard;
  markerMap?: Map<Marker | null>;
  ghostStoneMap?: Map<GhostStone | null>;
  comment?: string;
};

export function extractProblems(sgfText: string): RawProblem[] {
  const rootNodes = SGF.parse(sgfText);
  return rootNodes.flatMap((node: Node): RawProblem[] => {
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

export function createGameTree(sgfText: string): GameTree {
  const rootNodes = SGF.parse(sgfText);
  if (rootNodes.length > 1) throw 'Too many records.';
  return new GameTree({ root: rootNodes[0] });
}

export function getGameInfo(gameTree: GameTree): GameInfo {
  return {
    gameName: gameTree.root.data.GN?.[0],
    gameComment: gameTree.root.data.GC?.[0],
  };
}

export function getBoardState(
  gameTree: GameTree,
  id: number,
  boardCache?: (_0: number) => GoBoard | undefined,
): BoardState | null {
  const node = gameTree.get(id);
  if (!node) return null;

  // Search board from cache

  let baseBoard: GoBoard | undefined = undefined;
  let traversedNodes: Node[] = [];
  if (boardCache) {
    for (const node of gameTree.listNodesVertically(id, -1, {})) {
      baseBoard = boardCache(node.id);
      if (baseBoard) {
        break;
      }
      traversedNodes.unshift(node);
    }
  } else {
    traversedNodes = Array.from<Node>(
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

export function getMove(node: Node): PutPoint | null {
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

function getSize(gameTree: GameTree): [number, number] {
  const rootNode: Node = gameTree.root;
  const sz: string = (rootNode.data.SZ ?? ['19'])[0];
  const size = sz.includes(':') ? sz.split(':') : [sz, sz];
  const [w, h] = size.map((x) => (Number.isNaN(x) ? 19 : +x));
  return [w, h];
}

function getAdded(node: Node): PutPoint[] {
  const blacks = (node.data.AB ?? []).flatMap((vertexStr: string) =>
    SGF.parseCompressedVertices(vertexStr).map((vertex: Vertex) => ({
      vertex,
      stone: BLACK,
    })),
  );

  const whites = (node.data.AW ?? []).flatMap((vertexStr: string) =>
    SGF.parseCompressedVertices(vertexStr).map((vertex: Vertex) => ({
      vertex,
      stone: WHITE,
    })),
  );

  return [...blacks, ...whites];
}

function getNextMoves(gameTree: GameTree, node: Node): NextPoint[] {
  const treeNodes = Array.from<Node>(
    gameTree.listNodesVertically(node.id, -1, {}),
  ).reverse();
  const nextIsTesuji = treeNodes.reduce(
    (prev, n) => {
      const move = prev.find((p) => p.id === n.id);
      if (move && !move.isTesuji) return [];

      const children = n.children.map((c) => ({
        id: c.id,
        isTesuji: getIsTesuji(c),
      }));

      let hasTesuji = true;
      if (children.find((c) => c.isTesuji === null) !== undefined) {
        hasTesuji = children.find((c) => c.isTesuji === true) !== undefined;
        const hasBadMove =
          children.find((c) => c.isTesuji === false) !== undefined;

        if (hasTesuji && hasBadMove)
          throw 'Children have tesuji and bad move. Children can have only one side.';
      }

      return children.map((c) => ({
        id: c.id,
        isTesuji: c.isTesuji ?? !hasTesuji,
      }));
    },
    [{ id: 0, isTesuji: true }],
  );

  return node.children.flatMap((n) => {
    const move = getMove(n);
    const isCorrectRoute =
      nextIsTesuji.length > 0 &&
      nextIsTesuji.find((nit) => nit.id === n.id)!.isTesuji;
    return move ? [{ vertex: move.vertex, isCorrectRoute }] : [];
  });
}

function getMarkers(node: Node): MarkerPoint[] {
  const allMarks: MarkerPoint[] = Object.keys(MARKS).reduce((arr, key) => {
    const marks = node.data[key];
    if (!marks) return arr;

    const additional = marks.flatMap((vertexStr: string) =>
      SGF.parseCompressedVertices(vertexStr).map((vertex: Vertex) => ({
        vertex,
        marker: { type: MARKS[key as keyof typeof MARKS] as Marker['type'] },
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

function getIsTesuji(node: Node): boolean | null {
  if (node.data.TE && node.data.TE[0] === '1') {
    return true;
  }
  if (node.data.BM && node.data.BM[0] === '1') {
    return false;
  }
  return null;
}
