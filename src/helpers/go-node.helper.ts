import { Vertex } from '@/types';
import * as SGF from '@sabaki/sgf';
import { stringifyVertex } from '@sabaki/sgf';
import { Marker } from '@sabaki/shudan/src/Goban';

export const Stone = {
  BLACK: 'BLACK',
  WHITE: 'WHITE',
} as const;

export type Stone = keyof typeof Stone;

const Mark = {
  CR: 'circle',
  MA: 'cross',
  SQ: 'square',
  TR: 'triangle',
} as const;

type Mark = keyof typeof Mark;

type PointBase = {
  vertex: Vertex;
};

type PutPoint = PointBase & {
  stone: Stone;
};
type MarkerPoint = PointBase & {
  marker: Marker;
};

type GoNodeObject = SGF.NodeObject<number>;

export function getAddedStones(node: GoNodeObject): PutPoint[] {
  const blacks = (node.data.AB ?? []).flatMap((vertexStr: string) =>
    SGF.parseCompressedVertices(vertexStr).map(
      (vertex): PutPoint => ({
        vertex,
        stone: Stone.BLACK,
      }),
    ),
  );

  const whites = (node.data.AW ?? []).flatMap((vertexStr: string) =>
    SGF.parseCompressedVertices(vertexStr).map(
      (vertex): PutPoint => ({
        vertex,
        stone: Stone.WHITE,
      }),
    ),
  );

  return [...blacks, ...whites];
}

export function getMarkers(node: GoNodeObject): MarkerPoint[] {
  const allMarks = Object.entries(Mark).reduce((acc, [prop, value]) => {
    const marks = node.data?.[prop as Mark];
    if (!marks) return acc;

    const additional = marks.flatMap((vertexStr: string) =>
      SGF.parseCompressedVertices(vertexStr).map((vertex: Vertex) => ({
        vertex,
        marker: { type: value },
      })),
    );
    return [...acc, ...additional];
  }, [] as MarkerPoint[]);

  const allLabels: MarkerPoint[] =
    node.data.LB?.map((composed: string) => {
      const [vertexStr, label] = composed.split(':');
      const vertex: Vertex = SGF.parseVertex(vertexStr);
      return { vertex, marker: { type: 'label', label } };
    }) ?? [];

  return [...allMarks, ...allLabels];
}

export function getMove(node: GoNodeObject): PutPoint | null {
  const black = node.data.B;
  if (black) {
    return {
      vertex: SGF.parseVertex(black[0]),
      stone: Stone.BLACK,
    };
  }

  const white = node.data.W;
  if (white) {
    return {
      vertex: SGF.parseVertex(white[0]),
      stone: Stone.WHITE,
    };
  }

  return null;
}

export function getChildNode(
  node: GoNodeObject,
  vertex: Vertex,
): GoNodeObject | null {
  return (
    node.children.find((c) => {
      const move = getMove(c);
      return move && stringifyVertex(move.vertex) === stringifyVertex(vertex);
    }) ?? null
  );
}

export function getComment(node: GoNodeObject): string | null {
  const comment = node.data.C?.[0];

  if (comment) {
    return comment;
  }

  return null;
}

export function getGoodMoveExplicitly(node: GoNodeObject): boolean | null {
  if (node.data.TE?.[0] === '1') {
    return true;
  }

  if (node.data.BM?.[0] === '1') {
    return false;
  }

  return null;
}
