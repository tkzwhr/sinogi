import SolveCountIndicator from '@/components/presentational/SolveCountIndicator';
import TimeIndicator from '@/components/presentational/TimeIndicator';
import useIntervalTimer from '@/hooks/interval-timer';
import useProblem from '@/hooks/problem';
import { useRandomArray } from '@/hooks/random-array';
import { ErrorPage } from '@/pages/Error.page';
import {
  fetchProblemSGF,
  openProblemView,
  storeGameHistory,
} from '@/services/api';
import { SolveSettings } from '@/types';
import {
  ActionGroup,
  Button,
  Flex,
  Item,
  Text,
  View,
} from '@adobe/react-spectrum';
import { BoundedGoban, Vertex } from '@sabaki/shudan';
import AlertCircleFilled from '@spectrum-icons/workflow/AlertCircleFilled';
import CheckmarkCircle from '@spectrum-icons/workflow/CheckmarkCircle';
import Launch from '@spectrum-icons/workflow/Launch';
import OpenInLight from '@spectrum-icons/workflow/OpenInLight';
import Play from '@spectrum-icons/workflow/Play';
import { Key, useCallback, useEffect, useState } from 'react';
import { useAsync, useCounter, useWindowSize } from 'react-use';

type Props = {
  solveSettings: SolveSettings;
  problemIds: string[];
  todaySolveCount: number;
};

export default function SolveContainer(props: Props) {
  const { width, height } = useWindowSize();

  const [solveMode, nextSolveMode, altSolveMode] = useSolveMode();

  const [problemId, nextProblem] = useRandomArray(props.problemIds);

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
        break;
      case 'answered':
        storeGameHistory(problemId!, false).then();
        incSolveCount();
        usesTimer && intervalTimerFn.pause();
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
  }, [solveMode, props.solveSettings]);

  if (sgfText.error) return <ErrorPage message={sgfText.error.message} />;

  const action = (key: Key) => {
    switch (key) {
      case 'next':
        nextSolveMode();
        break;
      default:
        break;
    }
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
    <Flex gap="size-200">
      <View position="relative">
        <BoundedGoban
          maxWidth={width - 336}
          maxHeight={height - 148}
          signMap={signMap}
          markerMap={problem.boardState.markerMap}
          onVertexClick={(_: any, vertex: Vertex) =>
            solveMode === 'playing' && answer(vertex)
          }
        />
        {solveMode === 'correctAnswered' && (
          <View
            UNSAFE_className="absolute-center"
            backgroundColor="positive"
            padding="size-200"
            borderRadius="regular"
          >
            <Flex gap="size-100" alignItems="center">
              <CheckmarkCircle aria-label="正解" size="M" />
              <Text>正解！</Text>
            </Flex>
          </View>
        )}
        {solveMode === 'answered' && (
          <View
            UNSAFE_className="absolute-center"
            backgroundColor="negative"
            padding="size-200"
            borderRadius="regular"
          >
            <Flex gap="size-100" alignItems="center">
              <AlertCircleFilled aria-label="残念" size="M" />
              <Text>残念...</Text>
            </Flex>
          </View>
        )}
        {solveMode === 'timedOut' && (
          <View
            UNSAFE_className="absolute-center"
            backgroundColor="notice"
            padding="size-200"
            borderRadius="regular"
          >
            <Flex gap="size-100" alignItems="center">
              <AlertCircleFilled aria-label="時間切れ" size="M" />
              <Text>時間切れ</Text>
            </Flex>
          </View>
        )}
      </View>
      <View backgroundColor="gray-200" padding="size-100">
        {/* Info, Actions */}
        <Flex
          direction="column"
          width="size-3000"
          height="100%"
          justifyContent="space-between"
        >
          <Flex direction="column" gap="size-200">
            <TimeIndicator
              allottedTime={props.solveSettings.allottedTime}
              value={intervalTimer.rate}
              time={intervalTimer.time}
            />
            <SolveCountIndicator
              solveCount={solveCount}
              quota={props.solveSettings.quota}
            />
            <Button
              variant="primary"
              style="fill"
              onPress={() =>
                openProblemView(problemId!, problem.gameInfo.gameName)
              }
              isDisabled={
                solveMode !== 'correctAnswered' &&
                solveMode !== 'answered' &&
                solveMode !== 'timedOut'
              }
            >
              <OpenInLight />
              <Text>答えを確認する</Text>
            </Button>
          </Flex>
          {solveMode !== 'ready' ? (
            <ActionGroup
              density="compact"
              orientation="vertical"
              isDisabled={
                solveMode !== 'correctAnswered' &&
                solveMode !== 'answered' &&
                solveMode !== 'timedOut'
              }
              onAction={action}
            >
              <Item key="next" aria-label="次の問題へ">
                <Play />
                <Text>次の問題へ</Text>
              </Item>
            </ActionGroup>
          ) : (
            <ActionGroup
              density="compact"
              orientation="vertical"
              onAction={action}
            >
              <Item key="next" aria-label="スタート">
                <Launch />
                <Text>スタート</Text>
              </Item>
            </ActionGroup>
          )}
        </Flex>
      </View>
    </Flex>
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

function useSolveMode(): [SolveMode, () => void, (_0?: boolean) => void] {
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
