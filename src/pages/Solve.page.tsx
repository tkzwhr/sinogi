import PageFoundationContainer from '@/components/containers/PageFoundation.container';
import SolveContainer from '@/components/containers/Solve.container';
import SolveSettingsModal from '@/components/containers/SolveSettings.modal';
import EmptyBook from '@/components/presentational/EmptyBook';
import { ErrorPage } from '@/pages/Error.page';
import {
  fetchBooks,
  fetchSolveSettings,
  fetchTodaySummary,
  storeSolveSettings,
} from '@/services/api';
import { refreshBooksEvent } from '@/services/event';
import { SolveSettings } from '@/types';
import {
  ActionButton,
  DialogTrigger,
  Flex,
  ProgressCircle,
  View,
} from '@adobe/react-spectrum';
import Settings from '@spectrum-icons/workflow/Settings';
import { useEffect, useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

export default function SolvePage() {
  const solveSettings = useAsync(fetchSolveSettings);

  const todaySummary = useAsync(fetchTodaySummary);

  const [books, invokeFetchBooks] = useAsyncFn(fetchBooks, [], {
    loading: true,
  });

  useEffect(() => {
    invokeFetchBooks().then();
  }, []);

  refreshBooksEvent.useRefreshBooksListener(invokeFetchBooks);

  const [solveSettingsState, setSolveSettingsState] = useState<
    SolveSettings | undefined
  >(undefined);

  const saveSolveSettings = (
    solveSettings: SolveSettings,
    onAfter: () => void,
  ) => {
    setSolveSettingsState(solveSettings);
    storeSolveSettings(solveSettings).then();
    onAfter();
  };

  if (solveSettings.error)
    return <ErrorPage message={solveSettings.error.message} />;

  if (todaySummary.error)
    return <ErrorPage message={todaySummary.error.message} />;

  if (books.error) return <ErrorPage message={books.error.message} />;

  const loading =
    solveSettings.loading || todaySummary.loading || books.loading;

  const problemIds =
    books.value?.items.flatMap((b) => b.problems.map((p) => p.problemId)) ?? [];

  return (
    <PageFoundationContainer>
      <Flex direction="column" gap="size-200">
        <Flex justifyContent="space-between" alignItems="center">
          <h2>詰碁</h2>
          {!solveSettings.loading && (
            <DialogTrigger>
              <ActionButton aria-label="詰碁設定" isQuiet>
                <Settings />
              </ActionButton>
              {(close: () => void) => (
                <SolveSettingsModal
                  solveSettings={solveSettingsState || solveSettings.value!}
                  onUpdate={(value) => saveSolveSettings(value, close)}
                />
              )}
            </DialogTrigger>
          )}
        </Flex>
        <View padding="size-200">
          {loading ? (
            <ProgressCircle
              aria-label="読み込み中..."
              size="L"
              isIndeterminate
            />
          ) : problemIds.length === 0 ? (
            <EmptyBook />
          ) : (
            <SolveContainer
              problemIds={problemIds}
              solveSettings={solveSettingsState || solveSettings.value!}
              todaySolveCount={todaySummary.value!.numberOfAnswers}
            />
          )}
        </View>
      </Flex>
    </PageFoundationContainer>
  );
}
