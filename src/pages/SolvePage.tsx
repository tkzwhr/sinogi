import PageContainer from '@/components/PageContainer';
import { Goban } from '@sabaki/shudan';
import {
  Flex,
  View,
  DialogTrigger,
  ButtonGroup,
  ActionButton,
  Button,
} from '@adobe/react-spectrum';
import Settings from '@spectrum-icons/workflow/Settings';
import SolveSettingsModal from '@/components/solve-settings-modal/SolveSettings.modal';
import { Book, SolveSettings } from '@/types';
import { useState } from 'react';
import SolveCountIndicator from '@/components/solve-count-indicator/SolveCountIndicator';
import TimeIndicator from '@/components/time-indicator/TimeIndicator';
import useIntervalTimer from '@/hooks/interval-timer';
import { useAsync } from 'react-use';
import { fetchBooks, openProblemView } from '@/api';

export default function SolvePage() {
  const signMap = [
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 1, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
    [0, 0, 0, 0, 0, 0, 0, 0, 0],
  ];

  const books = useAsync(fetchBooks);

  const [problemId] = useState('1');
  const [solveSettings, setSolveSettings] = useState<SolveSettings>({
    scope: 'all',
    selectedBooks: ['2'],
    quota: 20,
    allottedTime: 5,
  });
  const [isStart, setIsStart] = useState(false);
  const [solveCount, setSolveCount] = useState(0);
  const [didAnswer, setDidAnswer] = useState(false);
  const intervalTimer = useIntervalTimer(solveSettings.allottedTime, () => {
    setDidAnswer(true);
  });

  const start = () => {
    setIsStart(true);
    intervalTimer.restart();
  };

  const next = () => {
    setDidAnswer(false);
    setSolveCount((prevState) => prevState + 1);
    intervalTimer.restart();
  };

  if (books.loading || books.error) return <></>;

  return (
    <PageContainer>
      <Flex direction="column" gap="size-200">
        <Flex justifyContent="space-between" alignItems="center">
          <h2>詰碁</h2>
          <DialogTrigger isDismissable>
            <ActionButton aria-label="Problems" isQuiet>
              <Settings />
            </ActionButton>
            {(close: () => void) => (
              <SolveSettingsModal
                {...solveSettings}
                books={books.value!.items}
                closeFn={close}
                onClose={setSolveSettings}
              />
            )}
          </DialogTrigger>
        </Flex>
        <Flex gap="size-200">
          <TimeIndicator
            allottedTime={solveSettings.allottedTime}
            value={intervalTimer.rate}
            time={intervalTimer.time}
          />
          <SolveCountIndicator
            solveCount={solveCount}
            quota={solveSettings.quota}
          />
        </Flex>
        <View>
          <Goban vertexSize={48} signMap={signMap} />
        </View>
        {isStart ? (
          <ButtonGroup isDisabled={!didAnswer}>
            <Button
              variant="primary"
              onPress={() => openProblemView(problemId)}
            >
              答えを見る
            </Button>
            <Button variant="accent" onPress={next}>
              次の問題へ
            </Button>
          </ButtonGroup>
        ) : (
          <ButtonGroup>
            <Button variant="accent" onPress={start}>
              始める
            </Button>
          </ButtonGroup>
        )}
      </Flex>
    </PageContainer>
  );
}
