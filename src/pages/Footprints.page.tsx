import FootprintsContainer from '@/components/containers/Footprints.container';
import { ErrorPage } from '@/pages/Error.page';
import { fetchDateSummaries, fetchSolveSettings } from '@/services/api';
import { Empty, Spin } from 'antd';
import { useAsync } from 'react-use';

export default function FootprintsPage() {
  const solveSettings = useAsync(fetchSolveSettings);
  const dateSummaries = useAsync(fetchDateSummaries);

  if (solveSettings.error)
    return <ErrorPage message={solveSettings.error.message} />;

  if (dateSummaries.error)
    return <ErrorPage message={dateSummaries.error.message} />;

  const loading = solveSettings.loading || dateSummaries.loading;
  if (loading)
    return (
      <Spin size="large">
        <Empty image={Empty.PRESENTED_IMAGE_SIMPLE} />
      </Spin>
    );

  return (
    <FootprintsContainer
      dateSummaries={dateSummaries.value!.items}
      quota={solveSettings.value!.quota}
    />
  );
}
