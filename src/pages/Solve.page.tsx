import SolveContainer from '@/components/containers/Solve.container';
import SolveSettingsSidePanel from '@/components/presentational/SolveSettings.sidepanel';
import { ErrorPage } from '@/pages/Error.page';
import {
  fetchBooks,
  fetchSolveSettings,
  fetchTodaySummary,
  storeSolveSettings,
} from '@/services/api';
import { refreshBooksEvent } from '@/services/event';
import { SolveSettings } from '@/types';
import SettingOutlined from '@ant-design/icons/SettingOutlined';
import { Spin, Empty, FloatButton } from 'antd';
import { useEffect, useState } from 'react';
import { useAsync, useAsyncFn } from 'react-use';

export default function SolvePage() {
  const [solveSettingsState, setSolveSettingsState] = useState<
    SolveSettings | undefined
  >(undefined);
  const [showsSolveSettings, setShowsSolveSettings] = useState(false);

  const solveSettings = useAsync(fetchSolveSettings);
  const todaySummary = useAsync(fetchTodaySummary);
  const [books, invokeFetchBooks] = useAsyncFn(fetchBooks, [], {
    loading: true,
  });

  useEffect(() => {
    invokeFetchBooks().then();
  }, []);

  refreshBooksEvent.useRefreshBooksListener(invokeFetchBooks);

  if (solveSettings.error)
    return <ErrorPage message={solveSettings.error.message} />;

  if (todaySummary.error)
    return <ErrorPage message={todaySummary.error.message} />;

  if (books.error) return <ErrorPage message={books.error.message} />;

  const loading =
    solveSettings.loading || todaySummary.loading || books.loading;
  if (loading)
    return (
      <Spin size="large">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Spin>
    );

  const problemIds =
    books.value?.items.flatMap((b) => b.problems.map((p) => p.problemId)) ?? [];

  const updateSolveSettings = (value: SolveSettings) => {
    setSolveSettingsState(value);
    storeSolveSettings(value).then();
    setShowsSolveSettings(false);
  };

  return (
    <>
      {problemIds.length === 0 ? (
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <SolveContainer
          problemIds={problemIds}
          solveSettings={solveSettingsState || solveSettings.value!}
          todaySolveCount={todaySummary.value!.numberOfAnswers}
        />
      )}
      <SolveSettingsSidePanel
        open={showsSolveSettings}
        solveSettings={solveSettingsState || solveSettings.value!}
        onUpdate={updateSolveSettings}
      />
      <FloatButton
        icon={<SettingOutlined />}
        onClick={() => setShowsSolveSettings(true)}
      />
    </>
  );
}
