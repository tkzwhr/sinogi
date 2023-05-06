import SolveCountIndicator from '@/components/presentational/SolveCountIndicator';
import TimeIndicator from '@/components/presentational/TimeIndicator';
import * as GoGameHelper from '@/helpers/go-game.helper';
import useIntervalTimer from '@/hooks/interval-timer';
import useProblem from '@/hooks/problem';
import useShuffle from '@/hooks/shuffle';
import useSolveState from '@/hooks/solve-state';
import { ErrorPage } from '@/pages/Error.page';
import {
  fetchProblemSGF,
  openProblemView,
  storeGameHistory,
} from '@/services/api';
import { SolveSettings, Vertex } from '@/types';
import { BoundedGoban } from '@sabaki/shudan';
import { Button, Col, notification, Row, Space, Tag, Typography } from 'antd';
import { useEffect, useMemo } from 'react';
import { useAsync, useWindowSize } from 'react-use';

type Props = {
  solveSettings: SolveSettings;
  problemIds: string[];
  todaySolveCount: number;
};

export default function SolveContainer(props: Props) {
  const { width, height } = useWindowSize();

  const [notificationFn, contextHolder] = notification.useNotification();

  const [solveState, solveStateDispatch] = useSolveState();

  const [problemId, selectProblem] = useShuffle(props.problemIds);

  const sgfText = useAsync(() => fetchProblemSGF(problemId), [problemId]);

  const adjustedSgfText = useMemo(() => {
    if (!sgfText.value) {
      return undefined;
    }

    let result = sgfText.value.sgfText;

    if (props.solveSettings.rotateMode !== 'disabled') {
      if (props.solveSettings.rotateMode !== 'random') {
        result = GoGameHelper.rotate(result, props.solveSettings.rotateMode);
      } else {
        const modeList: ('90deg' | '180deg' | '270deg')[] = [
          '90deg',
          '180deg',
          '270deg',
        ];
        result = GoGameHelper.rotate(
          result,
          modeList[Math.floor(Math.random() * modeList.length)],
        );
      }
    }

    if (props.solveSettings.flipMode !== 'disabled') {
      if (props.solveSettings.flipMode !== 'random') {
        result = GoGameHelper.flip(result, props.solveSettings.flipMode);
      } else {
        const modeList: ('horizontal' | 'vertical')[] = [
          'horizontal',
          'vertical',
        ];
        result = GoGameHelper.flip(
          result,
          modeList[Math.floor(Math.random() * modeList.length)],
        );
      }
    }

    if (props.solveSettings.invertColorMode !== 'disabled') {
      if (
        props.solveSettings.invertColorMode === 'inverted' ||
        Math.random() < 0.5
      ) {
        result = GoGameHelper.invertColor(result);
      }
    }

    return result;
  }, [sgfText.value]);

  const [problem, problemFn] = useProblem(
    solveState.status !== 'INITIALIZED' ? adjustedSgfText : undefined,
  );

  const [intervalTimer, intervalTimerFn] = useIntervalTimer(
    props.solveSettings.allottedTime,
    () => solveStateDispatch({ type: 'RUN_OUT_OF_TIME' }),
  );

  useEffect(() => {
    switch (solveState.status) {
      case 'WAIT_FOR_OPPONENT_PLAY':
        setTimeout(
          () =>
            solveStateDispatch({
              type: 'OPPONENT_PLAY',
              ...problemFn.playRandom(),
            }),
          100,
        );
        break;
      case 'FINISHED':
        if (props.solveSettings.allottedTime > 0) {
          intervalTimerFn.pause();
        }
        switch (solveState.playResult) {
          case 'CORRECT':
            storeGameHistory(problemId, true).then();
            notificationFn.success({ message: '正解！', placement: 'topLeft' });
            break;
          case 'INCORRECT':
            storeGameHistory(problemId, false).then();
            notificationFn.error({ message: '残念...', placement: 'topLeft' });
            break;
          case 'TIMED_OUT':
            notificationFn.warning({
              message: '時間切れ',
              placement: 'topLeft',
            });
            break;
        }
        break;
    }
  }, [solveState.status]);

  const start = () => {
    if (solveState.status !== 'INITIALIZED') {
      selectProblem();
    }
    if (props.solveSettings.allottedTime > 0) {
      intervalTimerFn.restart();
    }
    problemFn.rewind();
    solveStateDispatch({ type: 'START' });
  };

  const play = (vertex: Vertex) => {
    if (solveState.status !== 'WAIT_FOR_PLAYER_PLAY') {
      return;
    }

    solveStateDispatch({
      type: 'PLAY',
      vertex,
      playResult: problemFn.play(vertex),
    });
  };

  if (sgfText.error) return <ErrorPage message={sgfText.error.message} />;

  let signMap = problem.boardState.board.signMap;
  if (solveState.lastIncorrectPlayVertex) {
    const [x, y] = solveState.lastIncorrectPlayVertex;
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
            onVertexClick={(_: any, vertex: Vertex) => play(vertex)}
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
                  solveCount={props.todaySolveCount + solveState.solveCount}
                  quota={props.solveSettings.quota}
                />
              )}
              {solveState.status !== 'INITIALIZED' && (
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
              {solveState.status !== 'INITIALIZED' && (
                <Space direction="vertical">
                  <Typography.Text strong>コメント</Typography.Text>
                  <Typography.Text>
                    {problem.boardState?.comment ?? ''}
                  </Typography.Text>
                </Space>
              )}
              <Button
                disabled={solveState.status !== 'FINISHED'}
                onClick={() =>
                  openProblemView(problemId, problem.gameInfo.gameName)
                }
              >
                答えを確認する
              </Button>
            </Space>
            <Button
              type="primary"
              disabled={
                solveState.status === 'WAIT_FOR_PLAYER_PLAY' ||
                solveState.status === 'WAIT_FOR_OPPONENT_PLAY'
              }
              onClick={start}
            >
              {solveState.status === 'INITIALIZED' ? 'スタート' : '次の問題へ'}
            </Button>
          </div>
        </Col>
      </Row>
      {contextHolder}
    </>
  );
}
