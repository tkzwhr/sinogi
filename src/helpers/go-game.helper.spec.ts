import * as GoGameFn from './go-game.helper';
import { flip, invertColor, rotate } from './go-game.helper';

const B = 1;
const W = -1;

const createSGFText = (text: string) => `(;GM[1]FF[4]${text})`;

const stringifyNextPoint = (nextPoint: {
  vertex: [number, number];
  advancesCorrectRoute: boolean;
}) =>
  `[${nextPoint.vertex[0]}:${nextPoint.vertex[1]}] ${
    nextPoint.advancesCorrectRoute ? '○' : '×'
  }`;

const flattenText = (text: string) =>
  text
    .split('\n')
    .map((t) => t.trim())
    .join('');

describe('rotate', () => {
  it('正方形の碁盤で反時計周りに90度回転できること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9]AB[bi]LB[bi:1];W[ch]TR[ch]');

    // Act
    const result = rotate(sgfText, '90deg');

    // Assert
    expect(result).toBe(createSGFText('SZ[9]AB[ih]LB[ih:1];W[hg]TR[hg]'));
  });

  it('長方形の碁盤で反時計周りに90度回転できること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[5:9]AB[bi]LB[bi:1];W[ch]TR[ch]');

    // Act
    const result = rotate(sgfText, '90deg');

    // Assert
    expect(result).toBe(createSGFText('SZ[9:5]AB[id]LB[id:1];W[hc]TR[hc]'));
  });
});

describe('flip', () => {
  it('左右反転できること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9]AB[bi]LB[bi:1];W[ch]TR[ch]');

    // Act
    const result = flip(sgfText, 'horizontal');

    // Assert
    expect(result).toBe(createSGFText('SZ[9]AB[hi]LB[hi:1];W[gh]TR[gh]'));
  });

  it('上下反転できること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9]AB[bi]LB[bi:1];W[ch]TR[ch]');

    // Act
    const result = flip(sgfText, 'vertical');

    // Assert
    expect(result).toBe(createSGFText('SZ[9]AB[ba]LB[ba:1];W[cb]TR[cb]'));
  });
});

describe('invertColor', () => {
  it('色反転できること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9]AB[bi]LB[bi:A]VW[aa:bb];W[ch]');

    // Act
    const result = invertColor(sgfText);

    // Assert
    expect(result).toBe(createSGFText('SZ[9]AW[bi]LB[bi:A]VW[aa:bb];B[ch]'));
  });
});

describe('extractGames', () => {
  it('2つ以上の棋譜をそれぞれの棋譜情報として取得できること', () => {
    // Arrange
    const sgfText =
      createSGFText('GN[棋譜1]AW[ab];B[bc]') +
      createSGFText('GN[棋譜2]GC[コメント2]AW[cd];B[de]');

    // Act
    const result = GoGameFn.extractGames(sgfText).map((g) => ({
      ...g,
      sgfText: flattenText(g.sgfText),
    }));

    // Assert
    expect(result).toStrictEqual([
      {
        title: '棋譜1',
        description: undefined,
        sgfText: ';GM[1]FF[4]GN[棋譜1]AW[ab](;B[bc])',
      },
      {
        title: '棋譜2',
        description: 'コメント2',
        sgfText: ';GM[1]FF[4]GN[棋譜2]GC[コメント2]AW[cd](;B[de])',
      },
    ]);
  });

  it('タイトルがない棋譜は取得できないこと', () => {
    // Arrange
    const sgfText = createSGFText('AW[ab];B[bc]');

    // Act
    const result = GoGameFn.extractGames(sgfText).map((g) => ({
      ...g,
      sgfText: flattenText(g.sgfText),
    }));

    // Assert
    expect(result).toStrictEqual([]);
  });
});

describe('createGameTree', () => {
  it('棋譜からGameTreeを作成できること', () => {
    // Arrange
    const sgfText = createSGFText('AW[ab];B[bc]');

    // Act
    const result = GoGameFn.createGameTree(sgfText);

    // Assert
    expect(result).toHaveProperty('root');
  });

  it('2つ以上の棋譜が含まれるときエラーになること', () => {
    // Arrange
    const sgfText =
      createSGFText('AW[ab];B[bc]') + createSGFText('AB[cd];W[de]');
    const actFn = () => GoGameFn.createGameTree(sgfText);

    // Act

    // Assert
    expect(actFn).toThrowError('Too many records.');
  });
});

describe('getGameInfo', () => {
  it('ゲーム情報を取得できること', () => {
    // Arrange
    const sgfText = createSGFText('GN[ゲーム]GC[コメント]SZ[9];B[ab]');
    const gameTree = GoGameFn.createGameTree(sgfText);

    // Act
    const result = GoGameFn.getGameInfo(gameTree);

    // Assert
    expect(result).toStrictEqual({
      gameName: 'ゲーム',
      gameComment: 'コメント',
      size: [9, 9],
      playerColor: 1,
    });
  });

  it(':が入っている碁盤サイズを取得できること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[5:6];W[ab]');
    const gameTree = GoGameFn.createGameTree(sgfText);

    // Act
    const result = GoGameFn.getGameInfo(gameTree);

    // Assert
    expect(result).toStrictEqual({
      gameName: undefined,
      gameComment: undefined,
      size: [5, 6],
      playerColor: -1,
    });
  });

  it('サイズ指定がないときは19路盤とみなされこと', () => {
    // Arrange
    const sgfText = createSGFText(';W[ab]');
    const gameTree = GoGameFn.createGameTree(sgfText);

    // Act
    const result = GoGameFn.getGameInfo(gameTree);

    // Assert
    expect(result).toStrictEqual({
      gameName: undefined,
      gameComment: undefined,
      size: [19, 19],
      playerColor: -1,
    });
  });

  it('サイズ指定が不正なときは19路盤とみなされこと', () => {
    // Arrange
    const sgfText = createSGFText('SZ[a:b];W[ab]');
    const gameTree = GoGameFn.createGameTree(sgfText);

    // Act
    const result = GoGameFn.getGameInfo(gameTree);

    // Assert
    expect(result).toStrictEqual({
      gameName: undefined,
      gameComment: undefined,
      size: [19, 19],
      playerColor: -1,
    });
  });

  it('黒番と白番が同時に含まれるときエラーになること', () => {
    // Arrange
    const sgfText = createSGFText(';B[ab]W[bc]');
    const gameTree = GoGameFn.createGameTree(sgfText);
    const actFn = () => GoGameFn.getGameInfo(gameTree);

    // Act

    // Assert
    expect(actFn).toThrowError('First moves must be either black or white.');
  });
});

describe('getNextMoves', () => {
  it('手筋も悪手も指定されていないGameTreeでは、次の手はすべて正解となること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9](;B[ab])(;B[bc])');
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 0;

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[0:1] ○',
      '[1:2] ○'
    ]);
  });

  it('複数の手筋を含むGameTreeでは、次の手はすべて正解となること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9](;B[ab]TE[1])(;B[bc]TE[1])');
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 0;

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[0:1] ○',
      '[1:2] ○'
    ]);
  });

  it('手筋を含むものと含まないものがあるGameTreeでは、次の手は手筋のみ正解となること', () => {
    // Arrange
    const sgfText = createSGFText(
      'SZ[9](;B[ab]TE[1])(;B[bc]TE[1])(;B[cd])(;B[de])',
    );
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 0;

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[0:1] ○',
      '[1:2] ○',
      '[2:3] ×',
      '[3:4] ×'
    ]);
  });

  it('悪手を含むものと含まないものがあるGameTreeでは、次の手は悪手以外が正解となること', () => {
    // Arrange
    const sgfText = createSGFText(
      'SZ[9](;B[ab]BM[1])(;B[bc]BM[1])(;B[cd])(;B[de])',
    );
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 0;

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[0:1] ×',
      '[1:2] ×',
      '[2:3] ○',
      '[3:4] ○'
    ]);
  });

  it('悪手を含むものと含まないものがあるGameTreeでは、次の手は悪手以外が正解となること', () => {
    // Arrange
    const sgfText = createSGFText(
      'SZ[9](;B[ab]BM[1])(;B[bc]BM[1])(;B[cd])(;B[de])',
    );
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 0;

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[0:1] ×',
      '[1:2] ×',
      '[2:3] ○',
      '[3:4] ○'
    ]);
  });

  it('手筋と悪手を同時に含むGameTreeではエラーになること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9](;B[ab]TE[1])(;B[bc]BM[1])(;B[cd])');
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 0;
    const actFn = () =>
      GoGameFn.getNextMoves(gameTree, nodeId).map(stringifyNextPoint);

    // Act

    // Assert
    expect(actFn).toThrowError(
      'Children have good move and bad move. Children can have only one side.',
    );
  });

  it('子ノードのノードIDを指定して次の手を取得できること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9];B[ab](;W[bc]TE[1])(;B[cd])');
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 1; // B[ab]

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[1:2] ○',
      '[2:3] ×',
    ]);
  });

  it('不正解ルートでは次の手は必ず不正解になること', () => {
    // Arrange
    const sgfText = createSGFText(
      'SZ[9];B[ab]BM[1];W[bc](;W[cd]TE[1])(;B[de])',
    );
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 2; // W[bc]

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      '[2:3] ×',
      '[3:4] ×',
    ]);
  });

  it('次の手が存在しない場合は空配列が返ること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9];B[ab]');
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 1; // B[ab]

    // Act
    const result = GoGameFn.getNextMoves(gameTree, nodeId).map(
      stringifyNextPoint,
    );

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([]);
  });

  it('指定したノードIDが見つからないときエラーになること', () => {
    // Arrange
    const sgfText = createSGFText('SZ[9];B[ab]');
    const gameTree = GoGameFn.createGameTree(sgfText);
    const nodeId = 9999;
    const actFn = () => GoGameFn.getNextMoves(gameTree, nodeId);

    // Act

    // Assert
    expect(actFn).toThrowError('Node not found.');
  });
});

describe('generateAllBoardState', () => {
  it('ボード状態を生成できること', () => {
    // Arrange
    const node0 = 'SZ[3]AB[aa]AW[ab]';
    const node1 = 'B[ba]TE[1]';
    const node2 = 'W[bb]C[コメント]';
    const node3 = 'B[ca]CR[cb]';
    const sgfText = createSGFText(`${node0}(;${node1};${node2})(;${node3})`);
    const gameTree = GoGameFn.createGameTree(sgfText);

    // Act
    const result = Array.from(
      GoGameFn.generateAllBoardState(gameTree).entries(),
    ).map(([k, v]) => [k, { ...v, board: v.board.signMap }]);

    // Assert
    // prettier-ignore
    expect(result).toStrictEqual([
      [0, {
        board: [
          [B, 0, 0],
          [W, 0, 0],
          [0, 0, 0],
        ],
        markerMap: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        ghostStoneMap: [
          [null, { sign: B, type: "good" }, { sign: B, type: "bad" }],
          [null, null, null],
          [null, null, null],
        ],
        comment: null
      }],
      [1, {
        board: [
          [B, B, 0],
          [W, 0, 0],
          [0, 0, 0],
        ],
        markerMap: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        ghostStoneMap: [
          [null, null, null],
          [null, { sign: B, type: "good" }, null],
          [null, null, null],
        ],
        comment: null
      }],
      [2, {
        board: [
          [B, B, 0],
          [W, W, 0],
          [0, 0, 0],
        ],
        markerMap: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        ghostStoneMap: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        comment: "コメント"
      }],
      [3, {
        board: [
          [B, 0, B],
          [W, 0, 0],
          [0, 0, 0],
        ],
        markerMap: [
          [null, null, null],
          [null, null, { type: "circle" }],
          [null, null, null],
        ],
        ghostStoneMap: [
          [null, null, null],
          [null, null, null],
          [null, null, null],
        ],
        comment: null
      }]
    ]);
  });
});
