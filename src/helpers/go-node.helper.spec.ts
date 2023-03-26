import * as GoNodeFn from './go-node.helper';
import { getMove } from './go-node.helper';
import { parse } from '@sabaki/sgf';
import { Marker } from '@sabaki/shudan/src/Goban';

const createNode = (text: string) => parse<number>(`(;GM[1]FF[4]${text})`)[0];

const stringifyPutPoint = (putPoint: {
  vertex: [number, number];
  stone: string;
}) => `[${putPoint.vertex[0]}:${putPoint.vertex[1]}] ${putPoint.stone.at(0)}`;

const stringifyMarkerPoint = (putPoint: {
  vertex: [number, number];
  marker: Marker;
}) => {
  let marker = '-';
  switch (putPoint.marker.type) {
    case 'circle':
      marker = '○';
      break;
    case 'cross':
      marker = '×';
      break;
    case 'square':
      marker = '□';
      break;
    case 'triangle':
      marker = '△';
      break;
    case 'label':
      marker = `"${putPoint.marker.label ?? ''}"`;
      break;
    default:
      break;
  }

  return `[${putPoint.vertex[0]}:${putPoint.vertex[1]}] ${marker}`;
};

describe('getAddedStones', () => {
  it('初期配置の石の位置を配列で取得できること', () => {
    // Arrange
    const node = createNode('AB[ab]AW[bc]');

    // Act
    const result = GoNodeFn.getAddedStones(node).map(stringifyPutPoint);

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[0:1] B',
      '[1:2] W'
    ]);
  });

  it('初期配置がない場合は空配列で返ること', () => {
    // Arrange
    const node = createNode('');

    // Act
    const result = GoNodeFn.getAddedStones(node).map(stringifyPutPoint);

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([]);
  });
});

describe('getMarkers', () => {
  it('各種マークを取得できること', () => {
    // Arrange
    const node = createNode('CR[ab]MA[bc]SQ[cd]TR[de]LB[ef:1]');

    // Act
    const result = GoNodeFn.getMarkers(node).map(stringifyMarkerPoint);

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[0:1] ○',
      '[1:2] ×',
      '[2:3] □',
      '[3:4] △',
      '[4:5] "1"',
    ]);
  });

  it('マークがない場合は空配列が返ること', () => {
    // Arrange
    const node = createNode('');

    // Act
    const result = GoNodeFn.getMarkers(node).map(stringifyMarkerPoint);

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([]);
  });
});

describe('getMove', () => {
  it('黒石が置かれている場合、黒石の位置を取得できること', () => {
    // Arrange
    const node = createNode('B[ab]');

    // Act
    const result = GoNodeFn.getMove(node);

    // Assert
    expect(result).toBeDefined();

    // prettier-ignore
    const resultString = stringifyPutPoint(result!);
    expect(resultString).toBe('[0:1] B');
  });

  it('白石が置かれている場合、白石の位置を取得できること', () => {
    // Arrange
    const node = createNode('W[ab]');

    // Act
    const result = GoNodeFn.getMove(node);

    // Assert
    expect(result).toBeDefined();

    // prettier-ignore
    const resultString = stringifyPutPoint(result!);
    expect(resultString).toBe('[0:1] W');
  });

  it('黒石、白石のどちらもない場合はnullが返ること', () => {
    // Arrange
    const node = createNode('');

    // Act
    const result = GoNodeFn.getMove(node);

    // Assert
    // prettier-ignore
    expect(result).toBe(null);
  });
});

describe('getChildNode', () => {
  it('子ノードを取得できること ', () => {
    // Arrange
    const node = createNode('B[ab](;W[bc])(;W[cd])');

    // Act
    const result = GoNodeFn.getChildNode(node, [1, 2]);

    // Assert
    // prettier-ignore
    expect(getMove(result!)).toStrictEqual({
      vertex: [1, 2],
      stone: GoNodeFn.Stone.WHITE
    });
  });

  it('見つからない場合はnullを返すこと ', () => {
    // Arrange
    const node = createNode('B[ab](;W[bc])(;W[cd])');

    // Act
    const result = GoNodeFn.getChildNode(node, [2, 2]);

    // Assert
    // prettier-ignore
    expect(result).toBeNull();
  });
});

describe('getComment', () => {
  it('コメントを取得できること ', () => {
    // Arrange
    const node = createNode('C[コメント]');

    // Act
    const result = GoNodeFn.getComment(node);

    // Assert
    // prettier-ignore
    expect(result).toBe("コメント");
  });

  it('コメントがないときはnullが返ること ', () => {
    // Arrange
    const node = createNode('');

    // Act
    const result = GoNodeFn.getComment(node);

    // Assert
    // prettier-ignore
    expect(result).toBe(null);
  });
});

describe('getGoodMoveExplicitly', () => {
  it('TEがある場合は明示的にGoodMoveとなること', () => {
    // Arrange
    const node = createNode('TE[1]');

    // Act
    const result = GoNodeFn.getGoodMoveExplicitly(node);

    // Assert
    // prettier-ignore
    expect(result).toBe(true);
  });

  it('BMがある場合は明示的にGoodMoveとならないこと', () => {
    // Arrange
    const node = createNode('BM[1]');

    // Act
    const result = GoNodeFn.getGoodMoveExplicitly(node);

    // Assert
    // prettier-ignore
    expect(result).toBe(false);
  });

  it('TE, BMのどちらもない場合はnullが返ること', () => {
    // Arrange
    const node = createNode('');

    // Act
    const result = GoNodeFn.getGoodMoveExplicitly(node);

    // Assert
    // prettier-ignore
    expect(result).toBe(null);
  });
});
