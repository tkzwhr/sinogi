import SolveCountIndicator from '@/components/presentational/SolveCountIndicator';
import TimeIndicator from '@/components/presentational/TimeIndicator';
import useIntervalTimer from '@/hooks/interval-timer';
import useProblem from '@/hooks/problem';
import { ErrorPage } from '@/pages/Error.page';
import {
  fetchProblemSGF,
  openProblemView,
  storeGameHistory,
} from '@/services/api';
import { SolveSettings } from '@/types';
import { randomize } from '@/utils/randomize';
import { BoundedGoban, Vertex } from '@sabaki/shudan';
import { Button, Col, notification, Row, Space, Tag, Typography } from 'antd';
import { useCallback, useEffect, useState } from 'react';
import { useAsync, useCounter, useWindowSize } from 'react-use';

type Props = {
  solveSettings: SolveSettings;
  problemIds: string[];
  todaySolveCount: number;
};

export default function SolveContainer(props: Props) {
  const { width, height } = useWindowSize();
  const [api, contextHolder] = notification.useNotification();

  const [solveMode, nextSolveMode, altSolveMode] = useSolveMode();

  const [problemId, setProblemId] = useState(randomize(props.problemIds));
  const nextProblem = useCallback(
    () => setProblemId(randomize(props.problemIds)),
    [props.problemIds],
  );

  const sgfText = useAsync(() => fetchProblemSGF(problemId!), [problemId]);
  const [problem, problemFn] = useProblem(
    solveMode !== 'ready' && sgfText.value ? sgfText.value.sgfText : '',
  );
  const [lastPlayerMove, setLastPlayerMove] = useState<[number, number] | null>(
    null,
  );

  const [intervalTimer, intervalTimerFn] = useIntervalTimer(
    props.solveSettings.allottedTime,
    () => altSolveMode(),
  );

  const [solveCount, { inc: incSolveCount }] = useCounter(
    props.todaySolveCount,
  );

  const answer = (vertex: Vertex) => {
    const [x, y] = vertex;
    if (problem.boardState.board.signMap[y][x] !== 0) return;

    const result = problemFn.play(vertex);
    if (result.isLastMove && !result.isCorrectRoute) {
      setLastPlayerMove(vertex);
    }
    result.isLastMove ? altSolveMode(result.isCorrectRoute) : nextSolveMode();
  };

  useEffect(() => {
    const usesTimer = props.solveSettings.allottedTime > 0;
    switch (solveMode) {
      case 'opponentPlaying':
        setTimeout(() => {
          const result = problemFn.randomPlay();
          result.isLastMove
            ? altSolveMode(result.isCorrectRoute)
            : nextSolveMode();
        }, 100);
        break;
      case 'correctAnswered':
        storeGameHistory(problemId!, true).then();
        incSolveCount();
        usesTimer && intervalTimerFn.pause();
        api.success({ message: '正解！', placement: 'topLeft' });
        break;
      case 'answered':
        storeGameHistory(problemId!, false).then();
        incSolveCount();
        usesTimer && intervalTimerFn.pause();
        api.error({ message: '残念...', placement: 'topLeft' });
        break;
      case 'timedOut':
        api.warning({ message: '時間切れ', placement: 'topLeft' });
        break;
      case 'restart':
        setLastPlayerMove(null);
        nextProblem();
      // fallthrough
      case 'start':
        problemFn.rewind();
        usesTimer && intervalTimerFn.restart();
        nextSolveMode();
        break;
      default:
        break;
    }
  }, [solveMode]);

  if (sgfText.error) return <ErrorPage message={sgfText.error.message} />;

  const next = () => {
    nextSolveMode();
  };

  let signMap = problem.boardState.board.signMap;
  if (lastPlayerMove) {
    const [x, y] = lastPlayerMove;
    signMap = problem.boardState.board.signMap.map((column, c) =>
      column.map((row, r) => {
        return r === x && c === y ? problem.gameInfo.playerColor : row;
      }),
    );
  }

  return (
    <>
      <Row gutter={[16, 16]}>
        <Col>
          <BoundedGoban
            maxWidth={width - 48}
            maxHeight={height - 48}
            signMap={signMap}
            markerMap={problem.boardState.markerMap}
            onVertexClick={(_: any, vertex: Vertex) =>
              solveMode === 'playing' && answer(vertex)
            }
          />
        </Col>
        <Col style={{ maxWidth: '360px' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              gap: '64px',
              height: '100%',
            }}
          >
            <Space direction="vertical" size="large">
              {props.solveSettings.allottedTime > 0 && (
                <TimeIndicator
                  allottedTime={props.solveSettings.allottedTime}
                  value={intervalTimer.rate}
                  time={intervalTimer.time}
                />
              )}
              {props.solveSettings.quota > 0 && (
                <SolveCountIndicator
                  solveCount={solveCount}
                  quota={props.solveSettings.quota}
                />
              )}
              {solveMode !== 'ready' && (
                <Space direction="vertical">
                  <Typography.Text strong>手番</Typography.Text>
                  <Tag
                    color={
                      problem.gameInfo.playerColor === 1 ? 'black' : 'default'
                    }
                  >
                    {problem.gameInfo.playerColor === 1 ? '黒先' : '白先'}
                  </Tag>
                </Space>
              )}
              {solveMode !== 'ready' && (
                <Space direction="vertical">
                  <Typography.Text strong>コメント</Typography.Text>
                  <Typography.Text>
                    {problem.boardState?.comment ?? ''}
                  </Typography.Text>
                </Space>
              )}
              <Button
                disabled={
                  solveMode !== 'correctAnswered' &&
                  solveMode !== 'answered' &&
                  solveMode !== 'timedOut'
                }
                onClick={() =>
                  openProblemView(problemId!, problem.gameInfo.gameName)
                }
              >
                答えを確認する
              </Button>
            </Space>
            <Button
              type="primary"
              disabled={
                solveMode !== 'ready' &&
                solveMode !== 'correctAnswered' &&
                solveMode !== 'answered' &&
                solveMode !== 'timedOut'
              }
              onClick={next}
            >
              {solveMode === 'ready' ? 'スタート' : '次の問題へ'}
            </Button>
          </div>
        </Col>
      </Row>
      {contextHolder}
    </>
  );
}

type SolveMode =
  | 'ready'
  | 'start'
  | 'playing'
  | 'opponentPlaying'
  | 'correctAnswered'
  | 'answered'
  | 'timedOut'
  | 'restart';

function useSolveMode(): [
  SolveMode,
  () => void,
  (isCorrect?: boolean) => void,
] {
  const [solveMode, setSolveMode] = useState<SolveMode>('ready');
  const next = useCallback(() => {
    setSolveMode((prev) => {
      switch (prev) {
        case 'ready':
          return 'start';
        case 'start':
          return 'playing';
        case 'playing':
          return 'opponentPlaying';
        case 'opponentPlaying':
          return 'playing';
        case 'correctAnswered':
          return 'restart';
        case 'answered':
          return 'restart';
        case 'timedOut':
          return 'restart';
        case 'restart':
          return 'playing';
      }
    });
  }, []);
  const alt = useCallback((isCorrect?: boolean) => {
    setSolveMode((prev) => {
      switch (prev) {
        case 'playing':
          return isCorrect === undefined
            ? 'timedOut'
            : isCorrect
            ? 'correctAnswered'
            : 'answered';
        case 'opponentPlaying':
          return isCorrect === undefined
            ? 'timedOut'
            : isCorrect
            ? 'correctAnswered'
            : 'answered';
        default:
          return prev;
      }
    });
  }, []);
  return [solveMode, next, alt];
}
