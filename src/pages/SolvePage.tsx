import { fetchBookProblemSGF, fetchBooks, openProblemView } from '@/api';
import PageContainer from '@/components/PageContainer';
import SolveCountIndicator from '@/components/solve-count-indicator/SolveCountIndicator';
import SolveSettingsModal from '@/components/solve-settings-modal/SolveSettings.modal';
import TimeIndicator from '@/components/time-indicator/TimeIndicator';
import useIntervalTimer from '@/hooks/interval-timer';
import useProblem from '@/hooks/problem';
import { ErrorPage } from '@/pages/ErrorPage';
import { SolveSettings } from '@/types';
import {
  ActionButton,
  ActionGroup,
  Button,
  DialogTrigger,
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
import Settings from '@spectrum-icons/workflow/Settings';
import { Key, useCallback, useEffect, useState } from 'react';
import { useAsync, useAsyncFn, useToggle, useWindowSize } from 'react-use';

type InitialSolveState = {
  sgfText: string;
  allottedTime: number;
};

type SolveStateState = {
  problem: any;
  didAnswer: boolean | null;
  intervalTimer: any;
};

type SolveStateFn = {
  answer: (_0?: Vertex) => void;
  reset: () => void;
};

function useSolveState(
  init: InitialSolveState,
): [SolveStateState, SolveStateFn] {
  const [problem, problemFn] = useProblem(init.sgfText);
  const [didAnswer, setDidAnswer] = useState<boolean | null>(null);
  const [intervalTimer, intervalTimerFn] = useIntervalTimer(
    init.allottedTime,
    () => {
      setDidAnswer(false);
    },
  );
  const [waitOpponentPlay, toggleWaitOpponentPlay] = useToggle(false);

  useEffect(() => {
    if (!waitOpponentPlay) return;
    answer();
  }, [waitOpponentPlay]);

  const answer = useCallback(
    (vertex?: Vertex) => {
      const result = vertex ? problemFn.play(vertex) : problemFn.randomPlay();

      if (result.isLastMove) {
        setDidAnswer(result.isCorrectRoute);
        intervalTimerFn.pause();
        return;
      }

      setTimeout(
        () => {
          toggleWaitOpponentPlay();
        },
        vertex ? 0 : 100,
      );
    },
    [init],
  );

  const reset = useCallback(() => {
    setDidAnswer(null);
    problemFn.rewind();
    intervalTimerFn.restart();
  }, [init]);

  return [
    {
      problem,
      didAnswer,
      intervalTimer,
    },
    {
      answer,
      reset,
    },
  ];
}

export default function SolvePage() {
  const { width, height } = useWindowSize();

  const [problemId, setProblemId] = useState<string | null>(null);
  const sgfText = useAsync(async () => {
    if (!problemId) return '';
    return await fetchBookProblemSGF(problemId);
  }, [problemId]);

  const [solveSettings, setSolveSettings] = useState<SolveSettings>({
    scope: 'all',
    selectedBooks: ['2'],
    quota: 20,
    allottedTime: 5,
  });
  const [solveCount, setSolveCount] = useState(0);
  const [solveState, solveStateFn] = useSolveState({
    sgfText: sgfText.value ?? '',
    allottedTime: solveSettings.allottedTime,
  });
  const [books, callFetchBooks] = useAsyncFn(fetchBooks, []);

  useEffect(() => {
    if (solveState.didAnswer === null) return;
    setSolveCount((prevState) => prevState + 1);
  }, [solveState.didAnswer]);

  if (sgfText.loading) return <></>;
  if (sgfText.error) return <ErrorPage error={sgfText.error.message} />;

  const isStart = problemId !== null;

  const loadBooks = (isOpen: boolean) => {
    if (!isOpen) return;

    callFetchBooks().then();
  };

  const action = (key: Key) => {
    switch (key) {
      case 'next':
        setProblemId(new Date().getSeconds().toString());
        solveStateFn.reset();
        break;
      default:
        break;
    }
  };

  return (
    <PageContainer>
      <Flex direction="column" gap="size-200">
        {/* Header, Main */}
        <Flex justifyContent="space-between" alignItems="center">
          <h2>詰碁</h2>
          <DialogTrigger isDismissable onOpenChange={loadBooks}>
            <ActionButton aria-label="Problems" isQuiet>
              <Settings />
            </ActionButton>
            {(close: () => void) => (
              <SolveSettingsModal
                {...solveSettings}
                books={books.value?.items ?? []}
                closeFn={close}
                onClose={setSolveSettings}
              />
            )}
          </DialogTrigger>
        </Flex>
        <View padding="size-200">
          {/* Board, InfoPanel */}
          <Flex gap="size-200">
            <View position="relative">
              <BoundedGoban
                maxWidth={width - 336}
                maxHeight={height - 148}
                signMap={solveState.problem.boardState.board.signMap}
                markerMap={solveState.problem.boardState.markerMap}
                onVertexClick={(_: any, vertex: Vertex) =>
                  isStart && solveStateFn.answer(vertex)
                }
              />
              {solveState.didAnswer !== null &&
                (solveState.didAnswer ? (
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
                ) : (
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
                ))}
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
                    allottedTime={solveSettings.allottedTime}
                    value={solveState.intervalTimer.rate}
                    time={solveState.intervalTimer.time}
                  />
                  <SolveCountIndicator
                    solveCount={solveCount}
                    quota={solveSettings.quota}
                  />
                  <Button
                    variant="primary"
                    style="fill"
                    onPress={() => problemId && openProblemView(problemId)}
                    isDisabled={solveState.didAnswer === null}
                  >
                    <OpenInLight />
                    <Text>答えを確認する</Text>
                  </Button>
                </Flex>
                {isStart ? (
                  <ActionGroup
                    density="compact"
                    orientation="vertical"
                    isDisabled={solveState.didAnswer === null}
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
        </View>
      </Flex>
    </PageContainer>
  );
}
